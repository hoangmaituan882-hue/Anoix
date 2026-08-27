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
import { weekStartDateString, nextUserNoFromList } from './lib/pure.js';
import { corsMiddleware, securityHeaders, errorHandler } from './lib/middleware.js';
import { adminRoutes } from './routes/admin.js';
import { socialRoutes } from './routes/social.js';
import { meRoutes } from './routes/me.js';

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
app.use(corsMiddleware);
app.use(securityHeaders);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const GATEWAY_RETRYABLE = new Set([502, 503, 504]);

async function pgGet(path, _retried = false, _attempt = 0) {
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
    return pgGet(path, true, _attempt); // token expired mid-flight — re-login once
  }
  if (GATEWAY_RETRYABLE.has(r.status) && _attempt < 2) {
    await sleep(200 * (_attempt + 1)); // transient gateway blip — backoff retry
    return pgGet(path, _retried, _attempt + 1);
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
async function pgWrite(method, path, body, _retried = false, _attempt = 0) {
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
    return pgWrite(method, path, body, true, _attempt);
  }
  if (GATEWAY_RETRYABLE.has(r.status) && _attempt < 2) {
    await sleep(200 * (_attempt + 1));
    return pgWrite(method, path, body, _retried, _attempt + 1);
  }
  const text = await r.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* keep null */ }
  return [r.status, json];
}

/** Atomic upsert via PostgREST `resolution=merge-duplicates` (requires a PK/UNIQUE). */
async function pgUpsert(path, body, _retried = false, _attempt = 0) {
  const token = await getAdminToken(_retried);
  const r = await fetch(`${PG_BASE}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=representation',
    },
    body: JSON.stringify(body),
  });
  if (r.status === 401 && !_retried) {
    return pgUpsert(path, body, true, _attempt);
  }
  if (GATEWAY_RETRYABLE.has(r.status) && _attempt < 2) {
    await sleep(200 * (_attempt + 1));
    return pgUpsert(path, body, _retried, _attempt + 1);
  }
  const text = await r.text();
  let json = null;
  try { json = text ? JSON.parse(text) : null; } catch { /* keep null */ }
  return [r.status, json];
}

/** Minimal in-memory TTL cache for read-heavy, rarely-changing content. */
function ttlCache(ttlMs) {
  const store = new Map();
  return {
    get(key) {
      const v = store.get(key);
      if (!v) return undefined;
      if (Date.now() - v.ts > ttlMs) { store.delete(key); return undefined; }
      return v.value;
    },
    set(key, value) { store.set(key, { ts: Date.now(), value }); },
    clear() { store.clear(); },
  };
}
const contentCache = ttlCache(15_000); // 15s TTL for films/news/goods

app.get('/api/health', async (_req, res) => {
  let db = 'ok';
  if (!dbEnabled) db = 'disabled';
  else { try { await getAdminToken(); } catch { db = 'degraded'; } }
  res.json({ ok: true, env: ENV_ID, db, time: new Date().toISOString() });
});

app.get('/api/films', async (_req, res, next) => {
  try {
    const cached = contentCache.get('films');
    if (cached) return res.json(cached);
    const rows = await pgGet('/films?select=*&order=sort_order.asc');
    contentCache.set('films', rows ?? []);
    res.json(rows ?? []);
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
    const cached = contentCache.get('news');
    if (cached) return res.json(cached);
    const rows = await pgGet('/news?select=*&order=sort_order.asc');
    // Publish control: only show items that are published (or scheduled whose
    // time has arrived); pinned items float to the top. Lazy scheduling — no
    // cron needed, the time comparison does the job.
    const now = Date.now();
    const visible = (rows ?? [])
      .filter((r) => {
        if (r.status === 'draft' || r.status === 'archived') return false;
        if (!r.published_at) return r.status === 'published';
        return new Date(r.published_at).getTime() <= now;
      })
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    contentCache.set('news', visible);
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
    if (!allowRate(`vote:${clientIp(req)}`, 30, 60_000)) {
      return res.status(429).json({ error: 'rate_limited' });
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
    if (!allowRate(`nom:${clientIp(req)}`, 20, 60_000)) return res.status(429).json({ error: 'rate_limited' });

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
    if (!allowRate(`nom:${clientIp(req)}`, 20, 60_000)) return res.status(429).json({ error: 'rate_limited' });

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
    const role = rows?.[0]?.role ?? 'user';
    // Lazily ensure user metadata (user_no + registered_at) for first-time callers.
    if (!rows?.length) {
      ensureUserMeta(uid).catch(() => {});
    }
    return { uid, role };
  } catch {
    return null;
  }
}

async function ensureUserMeta(uid) {
  const existing = await pgGet(`/user_roles?uid=eq.${encodeURIComponent(uid)}&select=uid`);
  if (existing?.length) return;
  await insertUserRole(uid, 'user', null);
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
const mapUser = (u, roleMap) => {
  const r = roleMap.get(u.UUId);
  return {
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
    role: r?.role === 'admin' ? 'admin' : 'user',
    userNo: r?.user_no || null,
    registeredAt: r?.registered_at || null,
  };
};

async function nextUserNo() {
  const rows = await pgGet('/user_roles?select=user_no');
  return nextUserNoFromList((rows || []).map((r) => r.user_no));
}

/** Insert a user_roles row, retrying on user_no UNIQUE collision (race-safe). */
async function insertUserRole(uid, role, username) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const userNo = await nextUserNo();
    const [status] = await pgWrite('POST', '/user_roles', {
      uid,
      role,
      username: username ?? null,
      user_no: userNo,
      registered_at: new Date().toISOString(),
    });
    if (status < 400) return true;
    if (status !== 409) return false; // non-duplicate error → give up
    // 409 → duplicate uid (already has a row) OR duplicate user_no (race)
    const exists = await pgGet(`/user_roles?uid=eq.${encodeURIComponent(uid)}&select=uid`);
    if (exists?.length) return true; // uid already registered → done
    // else user_no collision → retry with the next number
  }
  return false;
}

// ---- Route modules (extracted to server/routes/*) ----
const deps = {
  ENV_ID, pgGet, pgWrite, pgUpsert,
  resolveIdentity, resolveVoter, callerIdentity,
  quotaInfo, bumpQuota, unbumpQuota,
  allowRate, clientIp,
  nextUserNo, insertUserRole, mapUser,
  getAdminToken, tcRequest, tcEnabled,
  contentCache, adminGate,
};
adminRoutes(app, deps);
socialRoutes(app, deps);
meRoutes(app, deps);

// ---- TMDB proxy (open to all for nomination scraping; rate-limited) ----
function tmdbGate(req, res, next) {
  if (!allowRate(`tmdb:${clientIp(req)}`, 20, 60_000)) {
    return res.status(429).json({ error: 'rate_limited' });
  }
  next();
}
app.use('/api/tmdb', tmdbGate, tmdbRouter);

// ---- Static frontend + SPA fallback (after API routes) ----
app.use(express.static(DIST_DIR));
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

// Unified JSON error handler (routes call next(e); tcRequest sets .status/.code)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[anoix] web+api listening on :${PORT}, env=${ENV_ID}, dist=${DIST_DIR}`);
});
