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

// Public read API — open CORS (admin write endpoints will tighten this later)
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
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
  const token = await getAdminToken();
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
async function pgWrite(method, path, body) {
  const token = await getAdminToken();
  const r = await fetch(`${PG_BASE}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
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

// ---- Voting (server-side boundary; UNIQUE(round_id, voter_id) is the guard) ----
app.post('/api/vote', async (req, res, next) => {
  try {
    const { roundId, optionId, voterId } = req.body ?? {};
    if (!roundId || !optionId || !voterId || typeof voterId !== 'string' || voterId.length < 8) {
      return res.status(400).json({ error: 'bad_request' });
    }
    const rounds = await pgGet(`/nomination_rounds?id=eq.${encodeURIComponent(roundId)}&select=id,status,deadline`);
    const round = rounds?.[0];
    if (!round) return res.status(404).json({ error: 'round_not_found' });
    if (round.status !== 'voting') return res.status(409).json({ error: 'not_voting' });
    if (round.deadline && new Date(round.deadline).getTime() < Date.now()) {
      return res.status(409).json({ error: 'deadline_passed' });
    }
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

// ---- My vote status (anonymous voter id) ----
app.get('/api/vote', async (req, res, next) => {
  try {
    const { roundId, voterId } = req.query;
    if (!roundId || !voterId) return res.json({ voted: false, optionId: null });
    const mine = await pgGet(
      `/votes?round_id=eq.${encodeURIComponent(String(roundId))}&voter_id=eq.${encodeURIComponent(String(voterId))}&select=option_id&limit=1`
    );
    return res.json({ voted: mine.length > 0, optionId: mine[0]?.option_id ?? null });
  } catch (e) { next(e); }
});

// ---- TMDB proxy (configurable base URL, key stays server-side) ----
app.use(tmdbRouter);

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
