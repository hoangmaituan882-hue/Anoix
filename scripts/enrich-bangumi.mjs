/**
 * Batch Bangumi enrichment for films TMDB missed (image IS NULL).
 * Search each film → best match → backfill image / rating (if null) / year / summary.
 *
 * Run: node scripts/enrich-bangumi.mjs
 * The bangumi reverse proxy (bgmapi.anibt.net) is mainland-reachable — no proxy needed.
 */
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const ENV_ID = process.env.CLOUDBASE_ENV_ID || 'a213-d4gzgo1mn873d99da';
const USER = process.env.ADMIN_USERNAME || 'admin';
const PASS = process.env.ADMIN_PASSWORD || 'Asd123456';
const BGMI = (process.env.BANGUMI_API_BASE_URL || 'https://bgmapi.anibt.net').replace(/\/$/, '');
const PG = `https://${ENV_ID}.api.tcloudbasegateway.com/v1/rdb/rest/v1`;
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

async function bgmSearch(q) {
  const r = await fetch(`${BGMI}/v0/search/subjects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'anoix/1.0' },
    body: JSON.stringify({ keyword: q, filter: { type: [2, 6] } }),
    signal: AbortSignal.timeout(12000),
  });
  if (!r.ok) return [];
  const j = await r.json();
  return (j.data || []).map((m) => ({
    title: m.name_cn || m.name || '',
    year: (m.date || '').slice(0, 4),
    poster: m.images?.large || m.images?.common || null,
    rating: m.rating?.score != null ? Math.round(m.rating.score * 10) / 10 : null,
    summary: m.summary || '',
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
const films = await pgGet('/films?select=id,title,rating&image=is.null&order=sort_order.asc', token);
console.log(`films without image: ${films.length}`);

let ok = 0, skip = 0;
const miss = [];
for (const f of films) {
  const results = await bgmSearch(f.title);
  const best = results[0];
  if (!best || !best.poster) { skip++; miss.push(`${f.title} (无海报/无结果)`); await sleep(300); continue; }

  const body = {
    image: best.poster,
    year: best.year || null,
    description: best.summary || null,
  };
  if (f.rating == null) body.rating = best.rating ?? null;

  const done = await pgPatch(f.id, body, token);
  if (done) { ok++; console.log(`  ✔ ${f.title} → ${best.title} (${best.year}${best.rating ? `, ${best.rating}` : ''})`); }
  else miss.push(`${f.title} (PATCH 失败)`);
  await sleep(300);
}
console.log(`\n完成: 更新 ${ok} | 跳过 ${skip}`);
if (miss.length) console.log('跳过/失败:\n' + miss.join('\n'));
