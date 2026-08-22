/**
 * Anoix API service (CloudBase CloudRun container).
 *
 * Public read APIs over CloudBase PG via the PostgREST-style REST endpoint,
 * authenticated server-side with the API Key (service_role) — browsers never
 * touch database credentials.
 *
 * Env:
 *   CLOUDBASE_ENV_ID   - environment id
 *   CLOUDBASE_API_KEY  - service_role API key (secret, server only)
 *   PORT               - listen port (CloudRun sets this)
 */
import express from 'express';

const ENV_ID = process.env.CLOUDBASE_ENV_ID;
const API_KEY = process.env.CLOUDBASE_API_KEY;
const PG_BASE = `https://${ENV_ID}.api.tcloudbasegateway.com/v1/rdb/rest/v1`;
const PORT = Number(process.env.PORT || 8080);

if (!ENV_ID || !API_KEY) {
  console.error('Missing CLOUDBASE_ENV_ID or CLOUDBASE_API_KEY');
  process.exit(1);
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

async function pgGet(path) {
  const r = await fetch(`${PG_BASE}${path}`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  });
  if (!r.ok) {
    const body = await r.text();
    const err = new Error(`PG ${r.status}: ${body.slice(0, 200)}`);
    err.status = r.status;
    throw err;
  }
  return r.json();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, env: ENV_ID, time: new Date().toISOString() });
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
    res.json(rows);
  } catch (e) { next(e); }
});

// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[api]', err.message);
  res.status(err.status || 502).json({ error: 'upstream_error', detail: err.message });
});

app.listen(PORT, () => {
  console.log(`[anoix-api] listening on :${PORT}, env=${ENV_ID}`);
});
