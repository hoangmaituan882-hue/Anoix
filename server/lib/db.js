/**
 * CloudBase PostgreSQL access layer: admin session token, pgGet/pgWrite/pgUpsert
 * (with gateway 5xx backoff retry), and the short-TTL content cache.
 */
import cloudbase from '@cloudbase/js-sdk';
import { ENV_ID, ADMIN_USERNAME, ADMIN_PASSWORD, PG_BASE, dbEnabled } from './config.js';

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

export async function pgGet(path, _retried = false, _attempt = 0) {
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