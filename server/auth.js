/**
 * Shared auth helpers for the Anoix service:
 *  - HMAC-signed anonymous voter cookies (unforgeable identity)
 *  - a tiny in-memory fixed-window rate limiter
 *
 * Voter identity is NEVER trusted from the request body. It must be the
 * HMAC-signed cookie this service issued; the cookie's embedded id is what is
 * stored as `votes.voter_id`, so a client cannot mint fresh identities.
 */
import crypto from 'node:crypto';

const ENV_ID = process.env.CLOUDBASE_ENV_ID;
const VOTE_SECRET =
  process.env.VOTE_SECRET || process.env.ADMIN_PASSWORD || ENV_ID || 'insecure-dev-vote-secret';

export const VOTE_COOKIE = 'anoix_voter';
const VOTE_COOKIE_MAX_AGE = 60 * 60 * 24 * 400; // ~13 months

// ---- HMAC-signed anonymous voter cookies ----
function hmac(value) {
  return crypto.createHmac('sha256', VOTE_SECRET).update(value).digest('base64url');
}

export function signVoterId(id) {
  return `${id}.${hmac(id)}`;
}

/** Returns the embedded id when the token is authentic, else null. */
export function verifyVoterId(token) {
  if (typeof token !== 'string') return null;
  const idx = token.lastIndexOf('.');
  if (idx <= 0 || idx === token.length - 1) return null;
  const id = token.slice(0, idx);
  const sig = token.slice(idx + 1);
  const a = Buffer.from(sig);
  const b = Buffer.from(hmac(id));
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return id;
}

export function issueVoterCookie(res) {
  const token = signVoterId(crypto.randomUUID());
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${VOTE_COOKIE}=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${VOTE_COOKIE_MAX_AGE}${secure}`,
  );
}

export function parseCookies(req) {
  const out = {};
  const raw = req.headers.cookie || '';
  for (const part of raw.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    if (k) out[k] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

/** Resolve the voter id from the signed cookie, or null when absent/invalid. */
export function resolveVoterId(req) {
  return verifyVoterId(parseCookies(req)[VOTE_COOKIE]);
}

// ---- in-memory fixed-window rate limiter ----
const buckets = new Map();

/** Returns true when the key is within its window limit. */
export function allowRate(key, limit, windowMs) {
  const now = Date.now();
  const b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  b.count += 1;
  return b.count <= limit;
}

export function clientIp(req) {
  const xff = req.headers['x-forwarded-for'];
  const ip = (Array.isArray(xff) ? xff[0] : String(xff || '')).split(',')[0].trim();
  return ip || req.socket?.remoteAddress || 'unknown';
}
