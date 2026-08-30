/**
 * Batch TMDB enrichment for imported screening-history films.
 * Search each film by title → best match → backfill image / rating (if null) /
 * year / description via the PG gateway.
 *
 * Run: node scripts/enrich-films.mjs
 * Env (from .env): TMDB_API_KEY, CLOUDBASE_ENV_ID, ADMIN_USERNAME, ADMIN_PASSWORD
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

function loadEnv() {
  const raw = fs.readFileSync(path.join(root, '.env'), 'utf8');
  const out = {};
  for (const line of raw.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) out[m[1]] = m[2];
  }
  return out;
}

const env = { ...loadEnv(), ...process.env };
const KEY = env.TMDB_API_KEY;
const ENV_ID = env.CLOUDBASE_ENV_ID;
const USER = env.ADMIN_USERNAME;
const PASS = env.ADMIN_PASSWORD;
if (!KEY || !ENV_ID || !USER || !PASS) {
  console.error('missing env: TMDB_API_KEY / CLOUDBASE_ENV_ID / ADMIN_USERNAME / ADMIN_PASSWORD');
  process.exit(1);
}

const PG = `https://${ENV_ID}.api.tcloudbasegateway.com/v1/rdb/rest/v1`;
const TMDB = 'https://api.themoviedb.org/3';
const IMG = 'https://image.tmdb.org/t/p/w500';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function signin() {
  const r = await fetch(`https://${ENV_ID}.api.tcloudbasegateway.com/auth/v1/signin`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: USER, password: PASS }),
  });
  const j = await r.json();
  if (!j.access_token) throw new Error('signin failed: ' + JSON.stringify(j));
  return j.access_token;
}

async function tmdbSearch(q) {
  const url = `${TMDB}/search/multi?query=${encodeURIComponent(q)}&language=zh-CN&api_key=${KEY}`;
  const r = await fetch(url, { signal: AbortSignal.timeout(12000) });
  if (!r.ok) return [];
  const j = await r.json();
  return (j.results || []).map((m) => ({
    title: m.title || m.name || '',
    year: (m.release_date || m.first_air_date || '').slice(0, 4),
    overview: m.overview || '',
    poster: m.poster_path ? `${IMG}${m.poster_path}` : null,
    rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : null,
  }));
}

async function pgGet(path, token) {
  const r = await fetch(`${PG}${path}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!r.ok) throw new Error(`PG GET ${r.status}`);
  return r.json();
}

async function pgPatch(id, body, token) {
  const r = await fetch(`${PG}/films?id=eq.${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', Prefer: 'return=minimal' },
    body: JSON.stringify(body),
  });
  return r.ok;
}

const token = await signin();
const films = await pgGet('/films?select=id,title,rating,image,year&order=sort_order.asc', token);
console.log(`films: ${films.length}`);

let updated = 0, matched = 0, skipped = 0, failed = 0;
const miss = [];
for (const f of films) {
  const results = await tmdbSearch(f.title);
  const best = results[0];
  if (!best) { skipped++; miss.push(`${f.title} (无结果)`); await sleep(260); continue; }
  if (!best.poster) { skipped++; miss.push(`${f.title} (无海报)`); await sleep(260); continue; }

  const body = {
    image: best.poster,
    year: best.year || null,
    description: best.overview || null,
  };
  // only fill rating when the imported film has none (keep existing 豆瓣 rating)
  if (f.rating == null) body.rating = best.rating ?? null;

  const ok = await pgPatch(f.id, body, token);
  if (ok) { updated++; matched++; }
  else { failed++; miss.push(`${f.title} (PATCH 失败)`); }

  if (updated % 20 === 0) console.log(`  ${updated}/${films.length} ...`);
  await sleep(260); // TMDB rate limit (40 req / 10s)
}

console.log(`\n完成: 更新 ${updated} | 无海报/无结果跳过 ${skipped} | 失败 ${failed}`);
if (miss.length) console.log('跳过/失败明细:\n' + miss.join('\n'));
