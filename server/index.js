/**
 * Anoix web service (CloudBase CloudRun container) — serves BOTH the built
 * frontend (dist/) and the JSON API:
 *
 *   /api/health, /api/films, /api/films/:id, /api/news   → CloudBase PG
 *   everything else                                       → SPA (dist/index.html)
 *
 * PG access uses an admin session token (username/password sign-in) instead
 * of an API key: the platform's key-issuance service currently mis-signs
 * project_id, while user-session tokens work fine. Switching back to the
 * API key after the ticket is fixed is a one-line change in pgGet().
 *
 * Env:
 *   CLOUDBASE_ENV_ID   - environment id
 *   ADMIN_USERNAME     - admin account for the server-side session
 *   ADMIN_PASSWORD     - its password (secret, server only)
 *   PORT               - listen port (CloudRun sets this)
 */
import express from 'express';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import cloudbase from '@cloudbase/js-sdk';
import { tmdbRouter } from './tmdb.js';
import {
  allowRate,
  clientIp,
  issueVoterCookie,
  resolveVoterId,
} from './auth.js';
import { tcRequest, tcEnabled } from './tcapi.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DIST_DIR = path.resolve(__dirname, '../dist');

const ENV_ID = process.env.CLOUDBASE_ENV_ID;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const PG_BASE = `https://${ENV_ID}.api.tcloudbasegateway.com/v1/rdb/rest/v1`;
const PORT = Number(process.env.PORT || 8080);

// Degrade gracefully instead of crash-looping: without admin credentials the
// data APIs return 503 while the static site keeps serving (frontend has a
// static fallback). This keeps deploys green even when env vars lag behind.
const dbEnabled = Boolean(ENV_ID && ADMIN_USERNAME && ADMIN_PASSWORD);
if (!dbEnabled) {
  console.warn('[anoix] Missing CLOUDBASE_ENV_ID / ADMIN_USERNAME / ADMIN_PASSWORD — data APIs disabled, static site only');
}

// ---- Admin session token (auto re-login on expiry) ----
const cb = ENV_ID ? cloudbase.init({ env: ENV_ID }) : null;
let cachedToken = null;
let tokenExpireAt = 0;

async function getAdminToken(force = false) {
  if (!cb) throw new Error('CloudBase client unavailable: missing env id');
  if (!force && cachedToken && Date.now() < tokenExpireAt - 60_000) return cachedToken;
  const { data, error } = await cb.auth.signInWithPassword({
    username: ADMIN_USERNAME,
    password: ADMIN_PASSWORD,
  });
  if (error || !data?.session?.access_token) {
    throw new Error(`admin sign-in failed: ${error?.message ?? 'no session'}`);
  }
  cachedToken = data.session.access_token;
  const expiresIn = data.session.expires_in ?? 3600;
  tokenExpireAt = Date.now() + expiresIn * 1000;
  return cachedToken;
}

const app = express();
app.use(express.json());

// Public read API. Echo the request origin (instead of a wildcard) so the
// signed voter cookie can be used cross-origin in local dev; same-origin
// production traffic is unaffected.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  if (origin) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

async function pgGet(path, _retried = false) {
  if (!dbEnabled) {
    const err = new Error('data APIs disabled: missing admin credentials');
    err.status = 503;
    throw err;
  }
  const token = await getAdminToken(_retried); // force a fresh login on the retry
  const r = await fetch(`${PG_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (r.status === 401 && !_retried) {
    return pgGet(path, true); // token expired mid-flight — re-login once
  }
  if (!r.ok) {
    const body = await r.text();
    const err = new Error(`PG ${r.status}: ${body.slice(0, 200)}`);
    err.status = r.status;
    throw err;
  }
  return r.json();
}

/** Write helper (same auth, returns [status, body]) without throwing on 4xx. */
async function pgWrite(method, path, body, _retried = false) {
  const token = await getAdminToken(_retried); // force a fresh login on the retry
  const r = await fetch(`${PG_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (r.status === 401 && !_retried) {
    return pgWrite(method, path, body, true);
  }
  const text = await r.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* keep null */ }
  return [r.status, json];
}

app.get('/api/health', async (_req, res) => {
  let db = 'ok';
  if (!dbEnabled) db = 'disabled';
  else { try { await getAdminToken(); } catch { db = 'degraded'; } }
  res.json({ ok: true, env: ENV_ID, db, time: new Date().toISOString() });
});

app.get('/api/films', async (_req, res, next) => {
  try {
    const rows = await pgGet('/films?select=*&order=sort_order.asc');
    res.json(rows);
  } catch (e) { next(e); }
});

app.get('/api/films/:id', async (req, res, next) => {
  try {
    const rows = await pgGet(`/films?select=*&id=eq.${encodeURIComponent(req.params.id)}`);
    res.json(rows[0] ?? null);
  } catch (e) { next(e); }
});

app.get('/api/news', async (_req, res, next) => {
  try {
    const rows = await pgGet('/news?select=*&order=sort_order.asc');
    // Publish control: only show items that are published (or scheduled whose
    // time has arrived); pinned items float to the top. Lazy scheduling — no
    // cron needed, the time comparison does the job.
    const now = Date.now();
    const visible = rows
      .filter((r) => {
        if (r.status === 'draft' || r.status === 'archived') return false;
        if (!r.published_at) return r.status === 'published';
        return new Date(r.published_at).getTime() <= now;
      })
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    res.json(visible);
  } catch (e) { next(e); }
});

// ---- Screenings (archive) ----
app.get('/api/screenings', async (_req, res, next) => {
  try {
    const rows = await pgGet('/screenings?select=*&order=screen_date.desc');
    res.json(rows);
  } catch (e) { next(e); }
});

// ---- Nominations (rounds + options + film join + live vote counts) ----
app.get('/api/nominations', async (_req, res, next) => {
  try {
    const [rounds, options, films, votes] = await Promise.all([
      pgGet('/nomination_rounds?select=*&order=created_at.desc'),
      pgGet('/nomination_options?select=*&order=id.asc'),
      pgGet('/films?select=id,title,title_zh,title_en,year,category,image'),
      pgGet('/votes?select=round_id,option_id'),
    ]);
    const filmById = new Map(films.map((f) => [f.id, f]));
    const voteCount = new Map(); // option_id -> count (live tally, no stale counter)
    for (const v of votes) voteCount.set(v.option_id, (voteCount.get(v.option_id) ?? 0) + 1);
    res.json(rounds.map((r) => ({
      ...r,
      options: options
        .filter((o) => o.round_id === r.id)
        .map((o) => ({
          ...o,
          votes_count: voteCount.get(o.id) ?? 0,
          film: o.film_id ? filmById.get(o.film_id) ?? null : null,
        })),
    })));
  } catch (e) { next(e); }
});

// ---- Issue an unforgeable anonymous voter cookie ----
app.get('/api/vote/ticket', (_req, res) => {
  issueVoterCookie(res);
  res.json({ ok: true });
});

// ---- Voting (server-side boundary; UNIQUE(round_id, voter_id) is the guard) ----
// voterId is NEVER taken from the body: a logged-in user's vote binds to their
// account uid (real-name), otherwise it uses the signed anonymous cookie.
app.post('/api/vote', async (req, res, next) => {
  try {
    const { roundId, optionId } = req.body ?? {};
    if (!roundId || !Number.isInteger(optionId) || optionId <= 0) {
      return res.status(400).json({ error: 'bad_request' });
    }
    if (!allowRate(`vote:${clientIp(req)}`, 30, 60_000)) {
      return res.status(429).json({ error: 'rate_limited' });
    }

    const voterId = await resolveVoter(req);
    if (!voterId) {
      return res.status(401).json({ error: 'identity_required' });
    }

    const rounds = await pgGet(`/nomination_rounds?id=eq.${encodeURIComponent(roundId)}&select=id,status,deadline`);
    const round = rounds?.[0];
    if (!round) return res.status(404).json({ error: 'round_not_found' });
    if (round.status !== 'voting') return res.status(409).json({ error: 'not_voting' });
    if (round.deadline && new Date(round.deadline).getTime() < Date.now()) {
      return res.status(409).json({ error: 'deadline_passed' });
    }

    // The candidate must belong to this round — otherwise a voter could push
    // this round's vote onto a different (already revealed) round's option.
    const opts = await pgGet(`/nomination_options?id=eq.${optionId}&select=id,round_id`);
    const opt = opts?.[0];
    if (!opt) return res.status(404).json({ error: 'option_not_found' });
    if (opt.round_id !== roundId) return res.status(400).json({ error: 'option_not_in_round' });

    const [status] = await pgWrite('POST', '/votes', {
      round_id: roundId,
      option_id: optionId,
      voter_id: voterId,
    });
    if (status === 409) return res.status(409).json({ error: 'already_voted' });
    if (status >= 400) return res.status(502).json({ error: 'vote_failed' });
    return res.json({ ok: true });
  } catch (e) { next(e); }
});

// ---- My vote status (token uid first, else signed cookie) ----
app.get('/api/vote', async (req, res, next) => {
  try {
    const { roundId } = req.query;
    if (!roundId) return res.json({ voted: false, optionId: null });
    const voterId = await resolveVoter(req);
    if (!voterId) return res.json({ voted: false, optionId: null });
    const mine = await pgGet(
      `/votes?round_id=eq.${encodeURIComponent(String(roundId))}&voter_id=eq.${encodeURIComponent(voterId)}&select=option_id&limit=1`
    );
    return res.json({ voted: mine.length > 0, optionId: mine[0]?.option_id ?? null });
  } catch (e) { next(e); }
});

// ---- Resolve a caller's role by forwarding THEIR access token to the PG
// gateway. The gateway verifies the token; the user_roles self-read RLS
// policy returns only the caller's own row, so this is tamper-proof. ----
async function callerRole(accessToken) {
  if (!accessToken) return null;
  try {
    const r = await fetch(`${PG_BASE}/user_roles?select=uid,role&limit=1`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!r.ok) return null;
    const rows = await r.json();
    return rows?.[0]?.role ?? null;
  } catch {
    return null;
  }
}

/** Extract the `sub` (uid) from a JWT payload without signature checks. */
function decodeJwtSub(token) {
  try {
    const parts = String(token).split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return payload.sub || payload.uid || null;
  } catch {
    return null;
  }
}

/**
 * Resolve the caller's uid + role. The token is first VERIFIED by the PG
 * gateway (a forged token is rejected with 401); only then is the JWT `sub`
 * decoded — so the returned uid is trustworthy. Any authenticated user is
 * supported (not just admins).
 */
async function callerIdentity(accessToken) {
  if (!accessToken) return null;
  try {
    const r = await fetch(`${PG_BASE}/user_roles?select=uid,role&limit=1`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!r.ok) return null; // invalid/expired token
    const rows = await r.json();
    const uid = decodeJwtSub(accessToken);
    if (!uid) return null;
    return { uid, role: rows?.[0]?.role ?? 'user' };
  } catch {
    return null;
  }
}

/**
 * Resolve the ballot identity: a valid Bearer token binds the vote to the
 * account uid (real-name), otherwise fall back to the signed anonymous cookie.
 */
async function resolveVoter(req) {
  const authz = req.headers.authorization || '';
  if (authz.startsWith('Bearer ')) {
    const ident = await callerIdentity(authz.slice(7).trim());
    if (ident) return ident.uid;
  }
  return resolveVoterId(req);
}

// ---- Admin-only gate (verified role + rate limit). Used by TMDB proxy and
// user management endpoints. ----
async function adminGate(req, res, next) {
  if (!allowRate(`admin:${clientIp(req)}`, 120, 60_000)) {
    return res.status(429).json({ error: 'rate_limited' });
  }
  const authz = req.headers.authorization || '';
  if (!authz.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const role = await callerRole(authz.slice(7).trim());
  if (role !== 'admin') {
    return res.status(403).json({ error: 'not_admin' });
  }
  next();
}

// ---- User management (CloudBase Auth via TC API + local role table) ----
const mapUser = (u, roleMap) => ({
  uid: u.UUId,
  username: u.UserName || '',
  email: u.Email || '',
  nickname: u.NickName || '',
  gender: u.Gender || '',
  avatarUrl: u.AvatarUrl || '',
  country: u.Country || '',
  province: u.Province || '',
  city: u.City || '',
  isAnonymous: Boolean(u.IsAnonymous),
  disabled: Boolean(u.IsDisabled),
  hasPassword: Boolean(u.HasPassword),
  createTime: u.CreateTime || '',
  updateTime: u.UpdateTime || '',
  role: roleMap.get(u.UUId) === 'admin' ? 'admin' : 'user',
});

app.get('/api/admin/users', adminGate, async (req, res, next) => {
  try {
    if (!tcEnabled()) return res.status(503).json({ error: 'user_management_unavailable' });
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const resp = await tcRequest('DescribeEndUsers', { EnvId: ENV_ID, Limit: limit, Offset: offset });
    const roles = await pgGet('/user_roles?select=uid,role');
    const roleMap = new Map((roles || []).map((r) => [r.uid, r.role]));
    const users = (resp.Users || []).map((u) => mapUser(u, roleMap));
    res.json({ total: users.length, users });
  } catch (e) { next(e); }
});

app.post('/api/admin/users', adminGate, async (req, res, next) => {
  try {
    const { username, password, role } = req.body ?? {};
    const name = typeof username === 'string' ? username.trim() : '';
    if (!name || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'bad_request' });
    }
    const resp = await tcRequest('CreateEndUserAccount', { EnvId: ENV_ID, Username: name, Password: password });
    const uid = resp?.User?.UUId || resp?.UUId || null;
    if (uid && role === 'admin') {
      await pgWrite('POST', '/user_roles', { uid, username: name, role: 'admin' });
    }
    res.json({ ok: true, uid });
  } catch (e) { next(e); }
});

app.patch('/api/admin/users/:uid', adminGate, async (req, res, next) => {
  try {
    const uid = req.params.uid;
    const { role, disabled, password } = req.body ?? {};

    if (role === 'admin') {
      await pgWrite('POST', '/user_roles', { uid, role: 'admin' });
    } else if (role === 'user') {
      await pgWrite('DELETE', `/user_roles?uid=eq.${encodeURIComponent(uid)}`);
    }
    if (typeof disabled === 'boolean') {
      await tcRequest('ModifyEndUser', { EnvId: ENV_ID, UUId: uid, Status: disabled ? 'DISABLE' : 'ENABLE' });
    }
    if (typeof password === 'string' && password.length >= 6) {
      try {
        await tcRequest('ModifyEndUserAccount', { EnvId: ENV_ID, Uuid: uid, Password: password });
      } catch (e) {
        // CloudBase can't modify a DISABLED account's credentials ("user id not exist").
        if (e?.code === 'InvalidParameter' || /not exist/i.test(e?.message || '')) {
          const err = new Error('该用户已被封禁，请先解封后再重置密码');
          err.status = 409;
          throw err;
        }
        throw e;
      }
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
});

app.delete('/api/admin/users/:uid', adminGate, async (req, res, next) => {
  try {
    const uid = req.params.uid;
    await pgWrite('DELETE', `/user_roles?uid=eq.${encodeURIComponent(uid)}`);
    await tcRequest('DeleteEndUser', { EnvId: ENV_ID, UserList: [uid] });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ---- Self profile (verified token → own uid; never trusts a client uid) ----
const pickField = (v, max) => (typeof v === 'string' ? v.slice(0, max) : undefined);

app.get('/api/me', async (req, res, next) => {
  try {
    const authz = req.headers.authorization || '';
    if (!authz.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
    const ident = await callerIdentity(authz.slice(7).trim());
    if (!ident) return res.status(401).json({ error: 'unauthorized' });
    const resp = await tcRequest('DescribeEndUsers', { EnvId: ENV_ID, Limit: 100, Offset: 0 });
    const u = (resp.Users || []).find((x) => x.UUId === ident.uid);
    if (!u) return res.status(404).json({ error: 'user_not_found' });
    res.json(mapUser(u, new Map([[ident.uid, ident.role]])));
  } catch (e) { next(e); }
});

app.patch('/api/me', async (req, res, next) => {
  try {
    const authz = req.headers.authorization || '';
    if (!authz.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
    const ident = await callerIdentity(authz.slice(7).trim());
    if (!ident) return res.status(401).json({ error: 'unauthorized' });
    const { nickname, avatarUrl } = req.body ?? {};
    const patch = { EnvId: ENV_ID, Uid: ident.uid };
    if (pickField(nickname, 64) !== undefined) patch.NickName = pickField(nickname, 64);
    if (pickField(avatarUrl, 1024) !== undefined) patch.AvatarUrl = pickField(avatarUrl, 1024);
    if (patch.NickName !== undefined || patch.AvatarUrl !== undefined) {
      await tcRequest('ModifyUser', patch);
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
});

async function verifyUserPassword(username, password) {
  try {
    const r = await fetch(`https://${ENV_ID}.api.tcloudbasegateway.com/auth/v1/signin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    if (!r.ok) return false;
    const j = await r.json();
    return Boolean(j.access_token || j.accessToken);
  } catch {
    return false;
  }
}

app.post('/api/me/password', async (req, res, next) => {
  try {
    const authz = req.headers.authorization || '';
    if (!authz.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
    const ident = await callerIdentity(authz.slice(7).trim());
    if (!ident) return res.status(401).json({ error: 'unauthorized' });
    const { currentPassword, newPassword } = req.body ?? {};
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'bad_request' });
    }
    const resp = await tcRequest('DescribeEndUsers', { EnvId: ENV_ID, Limit: 100, Offset: 0 });
    const u = (resp.Users || []).find((x) => x.UUId === ident.uid);
    const username = u?.UserName;
    if (!username) return res.status(400).json({ error: 'no_username_account' });
    if (!(await verifyUserPassword(username, currentPassword))) {
      return res.status(401).json({ error: 'wrong_current_password' });
    }
    await tcRequest('ModifyEndUserAccount', { EnvId: ENV_ID, Uuid: ident.uid, Password: newPassword });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ---- My voting history (votes bound to the account uid) ----
app.get('/api/me/votes', async (req, res, next) => {
  try {
    const authz = req.headers.authorization || '';
    if (!authz.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
    const ident = await callerIdentity(authz.slice(7).trim());
    if (!ident) return res.status(401).json({ error: 'unauthorized' });

    const [votes, rounds, options, films] = await Promise.all([
      pgGet(`/votes?voter_id=eq.${encodeURIComponent(ident.uid)}&select=round_id,option_id,created_at&order=created_at.desc`),
      pgGet('/nomination_rounds?select=id,title,status'),
      pgGet('/nomination_options?select=id,round_id,film_id'),
      pgGet('/films?select=id,title,title_zh,title_en'),
    ]);
    const roundMap = new Map((rounds || []).map((r) => [r.id, r]));
    const optionMap = new Map((options || []).map((o) => [o.id, o]));
    const filmMap = new Map((films || []).map((f) => [f.id, f]));
    const list = (votes || []).map((v) => {
      const round = roundMap.get(v.round_id);
      const option = optionMap.get(v.option_id);
      const film = option ? filmMap.get(option.film_id) : null;
      return {
        roundId: v.round_id,
        roundTitle: round?.title || v.round_id,
        roundStatus: round?.status || 'revealed',
        optionId: v.option_id,
        filmTitle: film ? (film.title_zh || film.title_en || film.title) : (option?.note || '—'),
        votedAt: v.created_at,
      };
    });
    res.json({ votes: list });
  } catch (e) { next(e); }
});

// ---- TMDB proxy (configurable base URL, key stays server-side) ----
app.use('/api/tmdb', adminGate, tmdbRouter);

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  // Full upstream detail stays in server logs only — clients get a generic error.
  console.error('[api]', err.message);
  res.status(err.status || 502).json({ error: 'upstream_error' });
});

// ---- Static frontend + SPA fallback (after API routes) ----
app.use(express.static(DIST_DIR));
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`[anoix] web+api listening on :${PORT}, env=${ENV_ID}, dist=${DIST_DIR}`);
});
