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

app.get('/api/screenings/:id', async (req, res, next) => {
  try {
    const rows = await pgGet(`/screenings?id=eq.${encodeURIComponent(req.params.id)}&select=*`);
    const s = rows?.[0];
    if (!s) return res.status(404).json({ error: 'not_found' });
    const ids = (s.film_ids || []).filter(Boolean);
    const films = ids.length
      ? await pgGet(`/films?id=in.(${ids.map(encodeURIComponent).join(',')})&select=id,title,title_zh,title_en,year,category,image`)
      : [];
    res.json({ ...s, films: films ?? [] });
  } catch (e) { next(e); }
});

// ---- Participation (rsvp) ----
app.get('/api/rsvp/:screeningId', async (req, res, next) => {
  try {
    const ident = await resolveIdentity(req);
    const rows = await pgGet(`/rsvps?screening_id=eq.${encodeURIComponent(req.params.screeningId)}&select=uid`);
    const list = rows ?? [];
    const rsvped = ident ? list.some((r) => r.uid === ident.identityId) : false;
    res.json({ rsvped, count: list.length });
  } catch (e) { next(e); }
});

app.post('/api/rsvp/:screeningId', async (req, res, next) => {
  try {
    const ident = await resolveIdentity(req);
    if (!ident) return res.status(401).json({ error: 'identity_required' });
    if (!allowRate(`rsvp:${clientIp(req)}`, 20, 60_000)) return res.status(429).json({ error: 'rate_limited' });
    const sid = req.params.screeningId;
    const scr = await pgGet(`/screenings?id=eq.${encodeURIComponent(sid)}&select=id`);
    if (!scr?.length) return res.status(404).json({ error: 'screening_not_found' });
    const [status] = await pgWrite('POST', '/rsvps', { screening_id: sid, uid: ident.identityId });
    if (status === 409) return res.json({ ok: true }); // already participating
    if (status >= 400) return res.status(502).json({ error: 'rsvp_failed' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

app.delete('/api/rsvp/:screeningId', async (req, res, next) => {
  try {
    const ident = await resolveIdentity(req);
    if (!ident) return res.status(401).json({ error: 'identity_required' });
    if (!allowRate(`rsvp:${clientIp(req)}`, 20, 60_000)) return res.status(429).json({ error: 'rate_limited' });
    await pgWrite('DELETE', `/rsvps?screening_id=eq.${encodeURIComponent(req.params.screeningId)}&uid=eq.${encodeURIComponent(ident.identityId)}`);
    res.json({ ok: true });
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

// ---- Voting (multi-vote within a round, weekly quota capped) ----
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

    const ident = await resolveIdentity(req);
    if (!ident) {
      return res.status(401).json({ error: 'identity_required' });
    }
    const quota = await quotaInfo(ident.identityId, ident.kind);
    if (quota.remainingVotes <= 0) {
      return res.status(429).json({ error: 'quota_exceeded' });
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
      voter_id: ident.identityId,
    });
    if (status === 409) return res.status(409).json({ error: 'already_voted' });
    if (status >= 400) return res.status(502).json({ error: 'vote_failed' });
    await bumpQuota(ident.identityId, 'vote');
    return res.json({ ok: true });
  } catch (e) { next(e); }
});

// ---- My vote status (token uid first, else signed cookie) ----
app.get('/api/vote', async (req, res, next) => {
  try {
    const { roundId } = req.query;
    if (!roundId) return res.json({ voted: false, optionIds: [] });
    const voterId = await resolveVoter(req);
    if (!voterId) return res.json({ voted: false, optionIds: [] });
    const mine = await pgGet(
      `/votes?round_id=eq.${encodeURIComponent(String(roundId))}&voter_id=eq.${encodeURIComponent(voterId)}&select=option_id`,
    );
    return res.json({ voted: (mine || []).length > 0, optionIds: (mine || []).map((v) => v.option_id) });
  } catch (e) { next(e); }
});

// ---- Revoke (withdraw) a vote ----
app.delete('/api/vote', async (req, res, next) => {
  try {
    const { roundId, optionId } = req.body ?? {};
    if (!roundId || !Number.isInteger(optionId) || optionId <= 0) {
      return res.status(400).json({ error: 'bad_request' });
    }
    const ident = await resolveIdentity(req);
    if (!ident) return res.status(401).json({ error: 'identity_required' });

    const rounds = await pgGet(`/nomination_rounds?id=eq.${encodeURIComponent(roundId)}&select=id,status`);
    const round = rounds?.[0];
    if (!round) return res.status(404).json({ error: 'round_not_found' });
    if (round.status !== 'voting') return res.status(409).json({ error: 'not_voting' });

    const [status] = await pgWrite(
      'DELETE',
      `/votes?round_id=eq.${encodeURIComponent(roundId)}&voter_id=eq.${encodeURIComponent(ident.identityId)}&option_id=eq.${optionId}`,
    );
    if (status === 404) return res.status(404).json({ error: 'vote_not_found' });
    if (status >= 400) return res.status(502).json({ error: 'revoke_failed' });
    await unbumpQuota(ident.identityId, 'vote');
    return res.json({ ok: true });
  } catch (e) { next(e); }
});

// ---- Weekly quota (anonymous cookie vs logged-in uid) ----
app.get('/api/quota', async (req, res, next) => {
  try {
    const ident = await resolveIdentity(req);
    if (!ident) {
      return res.json({
        kind: 'anon',
        nominationsUsed: 0,
        votesUsed: 0,
        nominationsLimit: QUOTA_LIMITS.anon.nominations,
        votesLimit: QUOTA_LIMITS.anon.votes,
        remainingNominations: QUOTA_LIMITS.anon.nominations,
        remainingVotes: QUOTA_LIMITS.anon.votes,
      });
    }
    res.json(await quotaInfo(ident.identityId, ident.kind));
  } catch (e) { next(e); }
});

// ---- Continuous nomination → pool (no round required; admin reviews later) ----
app.post('/api/nominations', async (req, res, next) => {
  try {
    const ident = await resolveIdentity(req);
    if (!ident) return res.status(401).json({ error: 'identity_required' });

    const { filmId, tmdb, note } = req.body ?? {};
    if (typeof note !== 'string' || note.trim().length === 0) {
      return res.status(400).json({ error: 'note_required' });
    }
    if (note.trim().length > 200) return res.status(400).json({ error: 'note_too_long' });

    const quota = await quotaInfo(ident.identityId, ident.kind);
    if (quota.remainingNominations <= 0) return res.status(429).json({ error: 'quota_exceeded' });

    const row = {
      note: note.trim(),
      nominee_identity_id: ident.identityId,
      source: 'user',
      status: 'pending',
      planned: false,
    };

    if (tmdb && tmdb.tmdbId) {
      row.tmdb_id = `tmdb-${tmdb.tmdbId}`;
      row.title = tmdb.title || tmdb.originalTitle || `tmdb-${tmdb.tmdbId}`;
      row.original_title = tmdb.originalTitle || null;
      row.year = tmdb.year || '';
      row.image = tmdb.posterUrl || '';
      row.overview = tmdb.overview || '';
      row.director = tmdb.director || null;
    } else if (typeof filmId === 'string' && filmId.trim()) {
      const fid = filmId.trim();
      const films = await pgGet(`/films?id=eq.${encodeURIComponent(fid)}&select=id,title,title_zh,title_en,year,image`);
      const f = films?.[0];
      if (!f) return res.status(404).json({ error: 'film_not_found' });
      row.film_id = fid;
      row.title = f.title_zh || f.title_en || f.title;
      row.year = f.year || '';
      row.image = f.image || '';
    } else {
      return res.status(400).json({ error: 'film_required' });
    }

    await pgWrite('POST', '/nomination_pool', row);
    await bumpQuota(ident.identityId, 'nomination');
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ---- Nominate a film directly into a specific round (admin/legacy) ----
app.post('/api/nominations/:roundId/nominate', async (req, res, next) => {
  try {
    const ident = await resolveIdentity(req);
    if (!ident) return res.status(401).json({ error: 'identity_required' });

    const roundId = req.params.roundId;
    const { filmId, tmdb, note } = req.body ?? {};
    if (typeof note !== 'string' || note.trim().length === 0) {
      return res.status(400).json({ error: 'note_required' });
    }
    if (note.trim().length > 200) return res.status(400).json({ error: 'note_too_long' });

    const rounds = await pgGet(`/nomination_rounds?id=eq.${encodeURIComponent(roundId)}&select=id,status`);
    const round = rounds?.[0];
    if (!round) return res.status(404).json({ error: 'round_not_found' });
    if (round.status !== 'collecting') return res.status(409).json({ error: 'not_collecting' });

    const quota = await quotaInfo(ident.identityId, ident.kind);
    if (quota.remainingNominations <= 0) return res.status(429).json({ error: 'quota_exceeded' });

    // Resolve film id: existing library film, or create one from TMDB scrape.
    let fid = typeof filmId === 'string' ? filmId.trim() : '';
    let source = 'library';
    if (tmdb && tmdb.tmdbId) {
      fid = `tmdb-${tmdb.tmdbId}`;
      source = 'tmdb';
      const existing = await pgGet(`/films?id=eq.${encodeURIComponent(fid)}&select=id`);
      if (!existing?.length) {
        await pgWrite('POST', '/films', {
          id: fid,
          title: tmdb.originalTitle || tmdb.title || fid,
          title_zh: tmdb.title || null,
          title_en: tmdb.originalTitle || null,
          year: tmdb.year || '',
          category: 'Movie',
          image: tmdb.posterUrl || '',
          description: tmdb.overview || '',
          description_zh: tmdb.overview || null,
          description_en: tmdb.overview || null,
          director: tmdb.director || null,
          is_new: false,
          sort_order: 0,
        });
      }
    }
    if (!fid) return res.status(400).json({ error: 'film_required' });

    const films = await pgGet(`/films?id=eq.${encodeURIComponent(fid)}&select=id`);
    if (!films?.length) return res.status(404).json({ error: 'film_not_found' });

    const nominator = ident.kind === 'user' ? '用户' : '匿名';
    await pgWrite('POST', '/nomination_options', {
      round_id: roundId,
      film_id: fid,
      nominator,
      nominee_identity_id: ident.identityId,
      source,
      note: note.trim(),
      votes_count: 0,
    });
    await bumpQuota(ident.identityId, 'nomination');
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ---- Nomination plaza (reads the pool; votes joined from round candidates) ----
app.get('/api/nominations/plaza', async (req, res, next) => {
  try {
    const scope = req.query.scope === 'all' ? 'all' : 'week';
    const [pool, options, votes] = await Promise.all([
      pgGet('/nomination_pool?select=id,film_id,tmdb_id,title,image,year,planned,created_at&order=created_at.desc'),
      pgGet('/nomination_options?select=id,film_id'),
      pgGet('/votes?select=option_id'),
    ]);
    const optionFilm = new Map();
    for (const o of options || []) optionFilm.set(o.id, o.film_id);
    const votesByFilm = new Map();
    for (const v of votes || []) {
      const fid = optionFilm.get(v.option_id);
      if (fid) votesByFilm.set(fid, (votesByFilm.get(fid) ?? 0) + 1);
    }

    const weekStart = Date.now() - 7 * 24 * 3600 * 1000;
    const grouped = new Map();
    for (const p of pool || []) {
      const created = p.created_at ? new Date(p.created_at).getTime() : 0;
      if (scope === 'week' && created < weekStart) continue;
      const key = p.film_id || p.tmdb_id || p.title;
      let g = grouped.get(key);
      if (!g) {
        g = { filmId: key, title: p.title, image: p.image || '', year: p.year || '', nominations: 0, planned: false };
        grouped.set(key, g);
      }
      g.nominations += 1;
      g.planned = g.planned || Boolean(p.planned);
    }
    const items = Array.from(grouped.values()).map((g) => ({
      filmId: g.filmId,
      title: g.title,
      image: g.image,
      year: g.year,
      category: '',
      nominations: g.nominations,
      votes: votesByFilm.get(g.filmId) ?? 0,
      planned: g.planned,
    }));
    res.json({ items });
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
 * Resolve the request identity: a valid Bearer token → account uid, otherwise
 * the signed anonymous cookie. Returns { identityId, kind: 'user'|'anon' }.
 */
async function resolveIdentity(req) {
  const authz = req.headers.authorization || '';
  if (authz.startsWith('Bearer ')) {
    const ident = await callerIdentity(authz.slice(7).trim());
    if (ident) return { identityId: ident.uid, kind: 'user' };
  }
  const cookieId = resolveVoterId(req);
  return cookieId ? { identityId: cookieId, kind: 'anon' } : null;
}

/** Ballot identity string (uid or anonymous cookie id). */
async function resolveVoter(req) {
  const ident = await resolveIdentity(req);
  return ident ? ident.identityId : null;
}

// ---- Weekly quota (natural week, Monday 00:00 Asia/Shanghai) ----
const QUOTA_LIMITS = {
  user: { nominations: 3, votes: 6 },
  anon: { nominations: 1, votes: 2 },
};

function weekStartDateString(now = Date.now()) {
  const sh = new Date(now + 8 * 3600 * 1000); // shift to Asia/Shanghai (UTC+8)
  const day = sh.getUTCDay(); // 0=Sun, 1=Mon
  const diff = (day + 6) % 7; // days since Monday
  const monday = new Date(Date.UTC(sh.getUTCFullYear(), sh.getUTCMonth(), sh.getUTCDate() - diff));
  return monday.toISOString().slice(0, 10);
}

async function quotaInfo(identityId, kind) {
  const ws = weekStartDateString();
  const limit = QUOTA_LIMITS[kind] || QUOTA_LIMITS.anon;
  const base = { kind, nominationsLimit: limit.nominations, votesLimit: limit.votes };
  try {
    const rows = await pgGet(
      `/user_quota?identity_id=eq.${encodeURIComponent(identityId)}&week_start=eq.${ws}&select=nominations_used,votes_used&limit=1`,
    );
    const q = rows?.[0] ?? { nominations_used: 0, votes_used: 0 };
    const nominationsUsed = q.nominations_used ?? 0;
    const votesUsed = q.votes_used ?? 0;
    return {
      ...base,
      nominationsUsed,
      votesUsed,
      remainingNominations: Math.max(0, limit.nominations - nominationsUsed),
      remainingVotes: Math.max(0, limit.votes - votesUsed),
    };
  } catch {
    return {
      ...base,
      nominationsUsed: 0,
      votesUsed: 0,
      remainingNominations: limit.nominations,
      remainingVotes: limit.votes,
    };
  }
}

async function bumpQuota(identityId, type) {
  const ws = weekStartDateString();
  const rows = await pgGet(
    `/user_quota?identity_id=eq.${encodeURIComponent(identityId)}&week_start=eq.${ws}&select=nominations_used,votes_used&limit=1`,
  );
  if (rows?.length) {
    const r = rows[0];
    const body = type === 'nomination'
      ? { nominations_used: (r.nominations_used ?? 0) + 1 }
      : { votes_used: (r.votes_used ?? 0) + 1 };
    await pgWrite('PATCH', `/user_quota?identity_id=eq.${encodeURIComponent(identityId)}&week_start=eq.${ws}`, body);
  } else {
    await pgWrite('POST', '/user_quota', {
      identity_id: identityId,
      week_start: ws,
      nominations_used: type === 'nomination' ? 1 : 0,
      votes_used: type === 'vote' ? 1 : 0,
    });
  }
}

async function unbumpQuota(identityId, type) {
  const ws = weekStartDateString();
  const rows = await pgGet(
    `/user_quota?identity_id=eq.${encodeURIComponent(identityId)}&week_start=eq.${ws}&select=nominations_used,votes_used&limit=1`,
  );
  if (!rows?.length) return; // no row → nothing to decrement
  const r = rows[0];
  if (type === 'vote') {
    await pgWrite('PATCH', `/user_quota?identity_id=eq.${encodeURIComponent(identityId)}&week_start=eq.${ws}`, {
      votes_used: Math.max(0, (r.votes_used ?? 0) - 1),
    });
  } else {
    await pgWrite('PATCH', `/user_quota?identity_id=eq.${encodeURIComponent(identityId)}&week_start=eq.${ws}`, {
      nominations_used: Math.max(0, (r.nominations_used ?? 0) - 1),
    });
  }
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

// ---- Mark an option as approved into the screening plan ("已通过") ----
app.post('/api/admin/options/:id/plan', adminGate, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'bad_request' });
    await pgWrite('PATCH', `/nomination_options?id=eq.${id}`, { planned: true });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ---- P1-P3: nomination pool admin (list / promote / demote) ----
app.get('/api/admin/pool', adminGate, async (_req, res, next) => {
  try {
    const rows = await pgGet('/nomination_pool?select=*&order=created_at.desc');
    res.json(rows ?? []);
  } catch (e) { next(e); }
});

// 勾选入库: promote a pool item into the film library (creates a film for TMDB)
app.post('/api/admin/pool/:id/promote', adminGate, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'bad_request' });
    const rows = await pgGet(`/nomination_pool?id=eq.${id}&select=*`);
    const p = rows?.[0];
    if (!p) return res.status(404).json({ error: 'not_found' });

    let fid = p.film_id;
    if (!fid && p.tmdb_id) {
      fid = p.tmdb_id;
      const existing = await pgGet(`/films?id=eq.${encodeURIComponent(fid)}&select=id`);
      if (!existing?.length) {
        await pgWrite('POST', '/films', {
          id: fid,
          title: p.original_title || p.title || fid,
          title_zh: p.title || null,
          title_en: p.original_title || null,
          year: p.year || '',
          category: 'Movie',
          image: p.image || '',
          description: p.overview || '',
          description_zh: p.overview || null,
          description_en: p.overview || null,
          director: p.director || null,
          is_new: false,
          sort_order: 0,
        });
      }
    }
    if (!fid) return res.status(400).json({ error: 'no_film' });
    await pgWrite('PATCH', `/nomination_pool?id=eq.${id}`, { status: 'promoted', film_id: fid, planned: true });
    // Notify the nominator that their pick was approved into the library.
    if (p.nominee_identity_id) {
      await pgWrite('POST', '/notifications', {
        uid: p.nominee_identity_id,
        type: 'promoted',
        title: '你的提名已通过',
        body: `《${p.title}》已被管理员勾选入库`,
      }).catch(() => {});
    }
    res.json({ ok: true, filmId: fid });
  } catch (e) { next(e); }
});

// 退回提名库 (reversible): reset a promoted item back to pending
app.post('/api/admin/pool/:id/demote', adminGate, async (req, res, next) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'bad_request' });
    await pgWrite('PATCH', `/nomination_pool?id=eq.${id}`, { status: 'pending', planned: false });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// 排期: set a film's screening status/date (待定 / 选日期 / 下周六 / 已放映)
app.post('/api/admin/films/:id/schedule', adminGate, async (req, res, next) => {
  try {
    const id = req.params.id;
    const { screening_status, screening_date } = req.body ?? {};
    const valid = ['unscheduled', 'scheduled', 'screened'];
    if (!valid.includes(screening_status)) return res.status(400).json({ error: 'bad_status' });
    const body = { screening_status };
    body.screening_date = screening_date && typeof screening_date === 'string' ? screening_date : null;
    await pgWrite('PATCH', `/films?id=eq.${encodeURIComponent(id)}`, body);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// 轮次状态流转: draft → collecting → reviewing → voting → revealed → archived
app.post('/api/admin/rounds/:id/status', adminGate, async (req, res, next) => {
  try {
    const id = req.params.id;
    const { status, deadline } = req.body ?? {};
    const valid = ['draft', 'collecting', 'reviewing', 'voting', 'revealed', 'archived'];
    if (!valid.includes(status)) return res.status(400).json({ error: 'bad_status' });
    const body = { status };
    if (deadline !== undefined) body.deadline = deadline || null;
    await pgWrite('PATCH', `/nomination_rounds?id=eq.${encodeURIComponent(id)}`, body);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ---- P5: admin statistics (who nominated / who voted) ----
app.get('/api/admin/stats', adminGate, async (_req, res, next) => {
  try {
    const [pool, votes, options, rounds, films] = await Promise.all([
      pgGet('/nomination_pool?select=id,title,note,source,status,nominee_identity_id,created_at&order=created_at.desc&limit=500'),
      pgGet('/votes?select=round_id,option_id,voter_id,created_at&order=created_at.desc&limit=500'),
      pgGet('/nomination_options?select=id,round_id,film_id'),
      pgGet('/nomination_rounds?select=id,title'),
      pgGet('/films?select=id,title,title_zh,title_en'),
    ]);

    // uid → display name (anonymous cookie ids are long and never match a uid)
    let userMap = new Map();
    try {
      const resp = await tcRequest('DescribeEndUsers', { EnvId: ENV_ID, Limit: 100, Offset: 0 });
      for (const u of resp.Users || []) userMap.set(u.UUId, u.UserName || u.Email || u.PhoneNumber || u.UUId);
    } catch { /* stats still useful without name resolution */ }
    const name = (id) => (id ? (userMap.get(id) || (String(id).length > 30 ? '匿名' : id)) : '匿名');

    const roundTitle = new Map((rounds || []).map((r) => [r.id, r.title]));
    const filmTitle = new Map((films || []).map((f) => [f.id, f.title_zh || f.title_en || f.title]));
    const optInfo = new Map((options || []).map((o) => [o.id, { round_id: o.round_id, film_id: o.film_id }]));

    const nominations = (pool || []).map((p) => ({
      id: p.id,
      title: p.title,
      note: p.note,
      source: p.source,
      status: p.status,
      nominee: name(p.nominee_identity_id),
      created_at: p.created_at,
    }));
    const votesList = (votes || []).map((v) => {
      const o = optInfo.get(v.option_id);
      return {
        round_id: v.round_id,
        round_title: o ? (roundTitle.get(o.round_id) || v.round_id) : v.round_id,
        film_id: o?.film_id ?? null,
        film_title: o?.film_id ? (filmTitle.get(o.film_id) || o.film_id) : '—',
        voter: name(v.voter_id),
        voted_at: v.created_at,
      };
    });

    res.json({ nominations, votes: votesList });
  } catch (e) { next(e); }
});

// ---- Notifications (list / mark read) ----
app.get('/api/notifications', async (req, res, next) => {
  try {
    const ident = await resolveIdentity(req);
    if (!ident) return res.json([]);
    const rows = await pgGet(`/notifications?uid=eq.${encodeURIComponent(ident.identityId)}&select=*&order=created_at.desc&limit=50`);
    res.json(rows ?? []);
  } catch (e) { next(e); }
});

app.post('/api/notifications/read', async (req, res, next) => {
  try {
    const ident = await resolveIdentity(req);
    if (!ident) return res.status(401).json({ error: 'identity_required' });
    if (!allowRate(`notif:${clientIp(req)}`, 30, 60_000)) return res.status(429).json({ error: 'rate_limited' });
    const { id } = req.body ?? {};
    if (id != null) {
      await pgWrite('PATCH', `/notifications?uid=eq.${encodeURIComponent(ident.identityId)}&id=eq.${Number(id)}`, { read: true });
    } else {
      await pgWrite('PATCH', `/notifications?uid=eq.${encodeURIComponent(ident.identityId)}`, { read: true });
    }
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ---- Favorites (list / add / remove) ----
app.get('/api/favorites', async (req, res, next) => {
  try {
    const ident = await resolveIdentity(req);
    if (!ident) return res.json([]);
    const rows = await pgGet(`/favorites?uid=eq.${encodeURIComponent(ident.identityId)}&select=*&order=created_at.desc`);
    const ids = (rows ?? []).map((r) => r.film_id).filter(Boolean);
    const films = ids.length
      ? await pgGet(`/films?id=in.(${ids.map(encodeURIComponent).join(',')})&select=id,title,title_zh,title_en,year,category,image`)
      : [];
    res.json(films ?? []);
  } catch (e) { next(e); }
});

app.post('/api/favorites', async (req, res, next) => {
  try {
    const ident = await resolveIdentity(req);
    if (!ident) return res.status(401).json({ error: 'identity_required' });
    if (!allowRate(`fav:${clientIp(req)}`, 30, 60_000)) return res.status(429).json({ error: 'rate_limited' });
    const { filmId } = req.body ?? {};
    if (!filmId) return res.status(400).json({ error: 'film_required' });
    const [status] = await pgWrite('POST', '/favorites', { uid: ident.identityId, film_id: filmId });
    if (status === 409) return res.json({ ok: true }); // already favorited
    if (status >= 400) return res.status(502).json({ error: 'favorite_failed' });
    res.json({ ok: true });
  } catch (e) { next(e); }
});

app.delete('/api/favorites/:filmId', async (req, res, next) => {
  try {
    const ident = await resolveIdentity(req);
    if (!ident) return res.status(401).json({ error: 'identity_required' });
    if (!allowRate(`fav:${clientIp(req)}`, 30, 60_000)) return res.status(429).json({ error: 'rate_limited' });
    await pgWrite('DELETE', `/favorites?uid=eq.${encodeURIComponent(ident.identityId)}&film_id=eq.${encodeURIComponent(req.params.filmId)}`);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ---- Calendar: future live-stream / screening schedule ----
app.get('/api/calendar', async (_req, res, next) => {
  try {
    const [screenings, scheduled, films] = await Promise.all([
      pgGet('/screenings?select=id,title,screen_date,venue,theme,film_ids&order=screen_date.asc'),
      pgGet('/films?select=id,title,title_zh,title_en,image,year,screening_date&screening_status=eq.scheduled&order=screening_date.asc'),
      pgGet('/films?select=id,title,title_zh,title_en,image,year'),
    ]);
    const filmMap = new Map((films || []).map((f) => [f.id, f]));
    const events = [];
    for (const s of screenings || []) {
      if (!s.screen_date) continue;
      events.push({
        date: s.screen_date,
        type: 'screening',
        id: s.id,
        title: s.title,
        venue: s.venue || '',
        theme: s.theme || '',
        films: (s.film_ids || []).map((id) => {
          const f = filmMap.get(id);
          return { id, title: f ? (f.title_zh || f.title_en || f.title) : id, image: f?.image || '', year: f?.year || '' };
        }),
      });
    }
    for (const f of scheduled || []) {
      if (!f.screening_date) continue;
      events.push({
        date: f.screening_date,
        type: 'film',
        id: f.id,
        title: f.title_zh || f.title_en || f.title,
        image: f.image || '',
        year: f.year || '',
        venue: '',
        theme: '',
        films: [],
      });
    }
    res.json({ events });
  } catch (e) { next(e); }
});

// ---- Watch log + rating + review ----
app.get('/api/watch', async (req, res, next) => {
  try {
    const ident = await resolveIdentity(req);
    if (!ident) return res.json([]);
    const rows = await pgGet(`/watch_log?uid=eq.${encodeURIComponent(ident.identityId)}&select=*&order=watched_at.desc`);
    const ids = (rows ?? []).map((r) => r.film_id).filter(Boolean);
    const films = ids.length
      ? await pgGet(`/films?id=in.(${ids.map(encodeURIComponent).join(',')})&select=id,title,title_zh,title_en,image,year`)
      : [];
    const filmMap = new Map((films ?? []).map((f) => [f.id, f]));
    res.json((rows ?? []).map((w) => {
      const f = filmMap.get(w.film_id);
      return { ...w, film_title: f ? (f.title_zh || f.title_en || f.title) : w.film_id, image: f?.image || '', year: f?.year || '' };
    }));
  } catch (e) { next(e); }
});

app.put('/api/watch/:filmId', async (req, res, next) => {
  try {
    const ident = await resolveIdentity(req);
    if (!ident) return res.status(401).json({ error: 'identity_required' });
    if (!allowRate(`watch:${clientIp(req)}`, 30, 60_000)) return res.status(429).json({ error: 'rate_limited' });
    const filmId = req.params.filmId;
    const { rating, review } = req.body ?? {};
    const r = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    const body = {
      film_id: filmId,
      uid: ident.identityId,
      rating: r,
      review: typeof review === 'string' ? review.trim().slice(0, 200) || null : null,
      watched_at: new Date().toISOString(),
    };
    await pgWrite('DELETE', `/watch_log?film_id=eq.${encodeURIComponent(filmId)}&uid=eq.${encodeURIComponent(ident.identityId)}`);
    await pgWrite('POST', '/watch_log', body);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

app.delete('/api/watch/:filmId', async (req, res, next) => {
  try {
    const ident = await resolveIdentity(req);
    if (!ident) return res.status(401).json({ error: 'identity_required' });
    if (!allowRate(`watch:${clientIp(req)}`, 30, 60_000)) return res.status(429).json({ error: 'rate_limited' });
    await pgWrite('DELETE', `/watch_log?film_id=eq.${encodeURIComponent(req.params.filmId)}&uid=eq.${encodeURIComponent(ident.identityId)}`);
    res.json({ ok: true });
  } catch (e) { next(e); }
});

// ---- Year in review (aggregate the caller's annual participation) ----
function personaFor(n, v, w) {
  if (n === 0 && v === 0 && w === 0) return '旁观者 · 来年加油';
  const tags = [];
  if (n >= 3) tags.push('选片策展人');
  if (v >= 6) tags.push('投票狂人');
  if (w >= 3) tags.push('放映常客');
  if (tags.length >= 2) return '全能影迷';
  if (tags.length === 1) return tags[0];
  return '新晋影迷';
}

app.get('/api/me/year-review', async (req, res, next) => {
  try {
    const ident = await resolveIdentity(req);
    if (!ident) return res.status(401).json({ error: 'identity_required' });
    const uid = ident.identityId;
    const year = Number(req.query.year) || new Date().getFullYear();
    const start = `${year}-01-01`;
    const end = `${year + 1}-01-01`; // exclusive upper bound (lt)

    const [noms, votes, watches, favs, rsvps] = await Promise.all([
      pgGet(`/nomination_pool?nominee_identity_id=eq.${encodeURIComponent(uid)}&created_at=gte.${start}&created_at=lt.${end}&select=id,title,image,planned,status`),
      pgGet(`/votes?voter_id=eq.${encodeURIComponent(uid)}&created_at=gte.${start}&created_at=lt.${end}&select=round_id,option_id`),
      pgGet(`/watch_log?uid=eq.${encodeURIComponent(uid)}&watched_at=gte.${start}&watched_at=lt.${end}&select=film_id,rating,review`),
      pgGet(`/favorites?uid=eq.${encodeURIComponent(uid)}&select=film_id`),
      pgGet(`/rsvps?uid=eq.${encodeURIComponent(uid)}&created_at=gte.${start}&created_at=lt.${end}&select=screening_id`),
    ]);

    const watchIds = (watches || []).map((w) => w.film_id).filter(Boolean);
    const films = watchIds.length
      ? await pgGet(`/films?id=in.(${watchIds.map(encodeURIComponent).join(',')})&select=id,title,title_zh,title_en,image,year`)
      : [];
    const filmMap = new Map((films || []).map((f) => [f.id, f]));

    const nominatedFilms = (noms || []).map((n) => ({ title: n.title, image: n.image || '', planned: Boolean(n.planned), status: n.status }));
    const watchedFilms = (watches || []).map((w) => {
      const f = filmMap.get(w.film_id);
      return { title: f ? (f.title_zh || f.title_en || f.title) : w.film_id, image: f?.image || '', rating: w.rating || 0 };
    });
    const avgRating = watchedFilms.length
      ? Math.round((watchedFilms.reduce((s, w) => s + w.rating, 0) / watchedFilms.length) * 10) / 10
      : 0;
    const rounds = new Set((votes || []).map((v) => v.round_id)).size;

    res.json({
      year,
      nominations: nominatedFilms.length,
      nominatedFilms,
      votes: (votes || []).length,
      rounds,
      watches: watchedFilms.length,
      avgRating,
      watchedFilms,
      favorites: (favs || []).length,
      rsvps: (rsvps || []).length,
      persona: personaFor(nominatedFilms.length, (votes || []).length, watchedFilms.length),
    });
  } catch (e) { next(e); }
});

// ---- Goods (merchandise) public read ----
app.get('/api/goods', async (_req, res, next) => {
  try {
    const rows = await pgGet('/goods?select=*&order=sort_order.asc');
    res.json(rows);
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
// ---- My activity (nominations + votes, with planned/approved status) ----
app.get('/api/me/activity', async (req, res, next) => {
  try {
    const authz = req.headers.authorization || '';
    if (!authz.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
    const ident = await callerIdentity(authz.slice(7).trim());
    if (!ident) return res.status(401).json({ error: 'unauthorized' });

    const [myOptions, myVotes, rounds, allOptions, films] = await Promise.all([
      pgGet(`/nomination_options?nominee_identity_id=eq.${encodeURIComponent(ident.uid)}&select=id,round_id,film_id,note,created_at,planned,source&order=created_at.desc`),
      pgGet(`/votes?voter_id=eq.${encodeURIComponent(ident.uid)}&select=round_id,option_id,created_at&order=created_at.desc`),
      pgGet('/nomination_rounds?select=id,title,status'),
      pgGet('/nomination_options?select=id,film_id,planned'),
      pgGet('/films?select=id,title,title_zh,title_en,year,image'),
    ]);
    const roundMap = new Map((rounds || []).map((r) => [r.id, r]));
    const optionMap = new Map((allOptions || []).map((o) => [o.id, o]));
    const filmMap = new Map((films || []).map((f) => [f.id, f]));

    const nominations = (myOptions || []).map((o) => {
      const round = roundMap.get(o.round_id);
      const film = filmMap.get(o.film_id);
      return {
        id: o.id,
        roundId: o.round_id,
        roundTitle: round?.title || o.round_id,
        roundStatus: round?.status || 'revealed',
        filmId: o.film_id,
        filmTitle: film ? (film.title_zh || film.title_en || film.title) : o.film_id,
        image: film?.image || '',
        note: o.note || '',
        planned: Boolean(o.planned),
        source: o.source || 'admin',
        createdAt: o.created_at,
      };
    });

    const votes = (myVotes || []).map((v) => {
      const round = roundMap.get(v.round_id);
      const option = optionMap.get(v.option_id);
      const film = option ? filmMap.get(option.film_id) : null;
      return {
        roundId: v.round_id,
        roundTitle: round?.title || v.round_id,
        roundStatus: round?.status || 'revealed',
        filmId: option?.film_id,
        filmTitle: film ? (film.title_zh || film.title_en || film.title) : '—',
        image: film?.image || '',
        planned: Boolean(option?.planned),
        votedAt: v.created_at,
      };
    });

    res.json({ nominations, votes });
  } catch (e) { next(e); }
});

// ---- TMDB proxy (open to all for nomination scraping; rate-limited) ----
function tmdbGate(req, res, next) {
  if (!allowRate(`tmdb:${clientIp(req)}`, 20, 60_000)) {
    return res.status(429).json({ error: 'rate_limited' });
  }
  next();
}
app.use('/api/tmdb', tmdbGate, tmdbRouter);

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
