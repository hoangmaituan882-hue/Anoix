/**
 * Caller identity resolution: verify a Bearer token via the PG gateway, fall back
 * to the signed anonymous cookie. Also the admin-only gate.
 */
import { PG_BASE } from './config.js';
import { pgGet } from './db.js';
import { insertUserRole } from './users.js';
import { allowRate, clientIp, resolveVoterId } from '../auth.js';

// Resolve a caller's role by forwarding THEIR access token to the PG gateway.
// The gateway verifies the token; the user_roles self-read RLS policy returns
// only the caller's own row, so this is tamper-proof.
export async function callerRole(accessToken) {
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
export function decodeJwtSub(token) {
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
export async function callerIdentity(accessToken) {
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

export async function ensureUserMeta(uid) {
  const existing = await pgGet(`/user_roles?uid=eq.${encodeURIComponent(uid)}&select=uid`);
  if (existing?.length) return;
  await insertUserRole(uid, 'user', null);
}

/**
 * Resolve the request identity: a valid Bearer token → account uid, otherwise
 * the signed anonymous cookie. Returns { identityId, kind: 'user'|'anon' }.
 */
export async function resolveIdentity(req) {
  const authz = req.headers.authorization || '';
  if (authz.startsWith('Bearer ')) {
    const ident = await callerIdentity(authz.slice(7).trim());
    if (ident) return { identityId: ident.uid, kind: 'user' };
  }
  const cookieId = resolveVoterId(req);
  return cookieId ? { identityId: cookieId, kind: 'anon' } : null;
}

/** Ballot identity string (uid or anonymous cookie id). */
export async function resolveVoter(req) {
  const ident = await resolveIdentity(req);
  return ident ? ident.identityId : null;
}

// ---- Admin-only gate (verified role + rate limit). ----
export async function adminGate(req, res, next) {
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