/**
 * Weekly quota (natural week, Monday 00:00 Asia/Shanghai).
 */
import { pgGet, pgWrite } from './db.js';
import { weekStartDateString } from './pure.js';

export const QUOTA_LIMITS = {
  user: { nominations: 3, votes: 6 },
  anon: { nominations: 1, votes: 2 },
};

export async function quotaInfo(identityId, kind) {
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

export async function bumpQuota(identityId, type, n = 1) {
  const add = Math.max(1, Number(n) || 1);
  const ws = weekStartDateString();
  const rows = await pgGet(
    `/user_quota?identity_id=eq.${encodeURIComponent(identityId)}&week_start=eq.${ws}&select=nominations_used,votes_used&limit=1`,
  );
  if (rows?.length) {
    const r = rows[0];
    const body = type === 'nomination'
      ? { nominations_used: (r.nominations_used ?? 0) + add }
      : { votes_used: (r.votes_used ?? 0) + add };
    await pgWrite('PATCH', `/user_quota?identity_id=eq.${encodeURIComponent(identityId)}&week_start=eq.${ws}`, body);
  } else {
    await pgWrite('POST', '/user_quota', {
      identity_id: identityId,
      week_start: ws,
      nominations_used: type === 'nomination' ? add : 0,
      votes_used: type === 'vote' ? add : 0,
    });
  }
}

export async function unbumpQuota(identityId, type, n = 1) {
  const sub = Math.max(1, Number(n) || 1);
  const ws = weekStartDateString();
  const rows = await pgGet(
    `/user_quota?identity_id=eq.${encodeURIComponent(identityId)}&week_start=eq.${ws}&select=nominations_used,votes_used&limit=1`,
  );
  if (!rows?.length) return;
  const r = rows[0];
  if (type === 'vote') {
    await pgWrite('PATCH', `/user_quota?identity_id=eq.${encodeURIComponent(identityId)}&week_start=eq.${ws}`, {
      votes_used: Math.max(0, (r.votes_used ?? 0) - sub),
    });
  } else {
    await pgWrite('PATCH', `/user_quota?identity_id=eq.${encodeURIComponent(identityId)}&week_start=eq.${ws}`, {
      nominations_used: Math.max(0, (r.nominations_used ?? 0) - sub),
    });
  }
}