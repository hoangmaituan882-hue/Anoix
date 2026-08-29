/**
 * CloudBase PostgreSQL access layer: admin session token, pgGet/pgWrite/pgUpsert
 * (with gateway 5xx backoff retry), and the short-TTL content cache.
 */
import cloudbase from '@cloudbase/js-sdk';
import { ENV_ID, ADMIN_USERNAME, ADMIN_PASSWORD, PG_BASE, dbEnabled } from './config.js';
import { parseContentRangeTotal, rangeHeader } from './catalog.js';

const cb = ENV_ID ? cloudbase.init({ env: ENV_ID }) : null;
let cachedToken = null;
let tokenExpireAt = 0;

export async function getAdminToken(force = false) {
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

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const GATEWAY_RETRYABLE = new Set([502, 503, 504]);

async function pgFetch(path, extraHeaders = {}, _retried = false, _attempt = 0) {
  if (!dbEnabled) {
    const err = new Error('data APIs disabled: missing admin credentials');
    err.status = 503;
    throw err;
  }
  const token = await getAdminToken(_retried);
  const r = await fetch(`${PG_BASE}${path}`, {
    headers: { Authorization: `Bearer ${token}`, ...extraHeaders },
  });
  if (r.status === 401 && !_retried) {
    return pgFetch(path, extraHeaders, true, _attempt);
  }
  if (GATEWAY_RETRYABLE.has(r.status) && _attempt < 2) {
    await sleep(200 * (_attempt + 1));
    return pgFetch(path, extraHeaders, _retried, _attempt + 1);
  }
  return r;
}

function throwPg(r, body) {
  const err = new Error(`PG ${r.status}: ${String(body || '').slice(0, 200)}`);
  err.status = r.status;
  throw err;
}

export async function pgGet(path, _retried = false, _attempt = 0) {
  const r = await pgFetch(path, {}, _retried, _attempt);
  if (!r.ok) throwPg(r, await r.text());
  return r.json();
}

/** Range GET with Prefer: count=exact. 416 (past the end) → empty page + total. */
export async function pgGetPage(path, offset, limit, _retried = false, _attempt = 0) {
  const off = Math.max(0, Number(offset) || 0);
  const lim = Math.max(1, Math.min(48, Number(limit) || 24));
  const r = await pgFetch(
    path,
    { ...rangeHeader(off, lim), Prefer: 'count=exact' },
    _retried,
    _attempt,
  );
  if (r.status === 416) {
    return {
      rows: [],
      total: parseContentRangeTotal(r.headers.get('content-range')) ?? 0,
      offset: off,
      limit: lim,
    };
  }
  if (!r.ok) throwPg(r, await r.text());
  const rows = await r.json();
  const list = Array.isArray(rows) ? rows : [];
  return {
    rows: list,
    total: parseContentRangeTotal(r.headers.get('content-range')) ?? list.length + off,
    offset: off,
    limit: lim,
  };
}

/** Write helper (same auth, returns [status, body]) without throwing on 4xx. */
export async function pgWrite(method, path, body, _retried = false, _attempt = 0) {
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
export async function pgUpsert(path, body, _retried = false, _attempt = 0) {
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
export function ttlCache(ttlMs) {
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
export const contentCache = ttlCache(15_000); // 15s TTL for films/news/goods