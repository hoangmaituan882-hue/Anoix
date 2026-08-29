import { asyncHandler } from '../lib/middleware.js';
/**
 * Self-service profile endpoints: read own profile, update nickname/avatar,
 * change password, and my activity (nominations + votes).
 */

import { ENV_ID } from '../lib/config.js';
import { pgGet } from '../lib/db.js';
import { callerIdentity } from '../lib/identity.js';
import { mapUser } from '../lib/users.js';
import { shanghaiDateString, filmsByIdPath } from '../lib/catalog.js';
import { assembleMeStats, assembleMeActivity, firstScreenedByFilm, minutesToHours } from '../lib/meStats.js';
import { tcRequest } from '../tcapi.js';

const pickField = (v, max) => (typeof v === 'string' ? v.slice(0, max) : undefined);

export function meRoutes(app) {

  async function verifyUserPassword(username, password) {
    try {
      const r = await fetch(`https://${ENV_ID}.api.tcloudbasegateway.com/auth/v1/signin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!r.ok) return false;
      const j = await r.json();
      return Boolean(j.access_token || j.accessToken);
    } catch {
      return false;
    }
  }

  app.get('/api/me', asyncHandler(async (req, res) => {
    const authz = req.headers.authorization || '';
    if (!authz.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
    const ident = await callerIdentity(authz.slice(7).trim());
    if (!ident) return res.status(401).json({ error: 'unauthorized' });
    const resp = await tcRequest('DescribeEndUsers', { EnvId: ENV_ID, Limit: 100, Offset: 0 });
    const u = (resp.Users || []).find((x) => x.UUId === ident.uid);
    if (!u) return res.status(404).json({ error: 'user_not_found' });
    res.json(mapUser(u, new Map([[ident.uid, ident.role]])));
  }));

  app.patch('/api/me', asyncHandler(async (req, res) => {
    const authz = req.headers.authorization || '';
    if (!authz.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
    const ident = await callerIdentity(authz.slice(7).trim());
    if (!ident) return res.status(401).json({ error: 'unauthorized' });
    const { nickname, avatarUrl } = req.body ?? {};
    const patch = { EnvId: ENV_ID, Uid: ident.uid };
    if (pickField(nickname, 64) !== undefined) patch.NickName = pickField(nickname, 64);
    if (pickField(avatarUrl, 1024) !== undefined) patch.AvatarUrl = pickField(avatarUrl, 1024);
    if (patch.NickName !== undefined || patch.AvatarUrl !== undefined) {
      await tcRequest('ModifyUser', patch);
    }
    res.json({ ok: true });
  }));

  app.post('/api/me/password', asyncHandler(async (req, res) => {
    const authz = req.headers.authorization || '';
    if (!authz.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
    const ident = await callerIdentity(authz.slice(7).trim());
    if (!ident) return res.status(401).json({ error: 'unauthorized' });
    const { currentPassword, newPassword } = req.body ?? {};
    if (typeof currentPassword !== 'string' || typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'bad_request' });
    }
    const resp = await tcRequest('DescribeEndUsers', { EnvId: ENV_ID, Limit: 100, Offset: 0 });
    const u = (resp.Users || []).find((x) => x.UUId === ident.uid);
    const username = u?.UserName;
    if (!username) return res.status(400).json({ error: 'no_username_account' });
    if (!(await verifyUserPassword(username, currentPassword))) {
      return res.status(401).json({ error: 'wrong_current_password' });
    }
    await tcRequest('ModifyEndUserAccount', { EnvId: ENV_ID, Uuid: ident.uid, Password: newPassword });
    res.json({ ok: true });
  }));

  app.get('/api/me/stats', asyncHandler(async (req, res) => {
    const authz = req.headers.authorization || '';
    if (!authz.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
    const ident = await callerIdentity(authz.slice(7).trim());
    if (!ident) return res.status(401).json({ error: 'unauthorized' });
    const uid = ident.uid;
    const today = shanghaiDateString();

    const [screenings, watches, pool, weekVotes] = await Promise.all([
      pgGet('/screenings?select=screen_date,film_ids'),
      pgGet(`/watch_log?uid=eq.${encodeURIComponent(uid)}&select=film_id`),
      pgGet(`/nomination_pool?nominee_identity_id=eq.${encodeURIComponent(uid)}&select=film_id`),
      pgGet(`/film_week_votes?identity_id=eq.${encodeURIComponent(uid)}&select=count`),
    ]);

    const watchIds = (watches || []).map((w) => w.film_id);
    const poolFilmIds = (pool || []).map((p) => p.film_id);
    const filmPath = filmsByIdPath([...firstScreenedByFilm(screenings, today).keys()], 'id,duration');
    const films = filmPath ? (await pgGet(filmPath)) : [];
    const stats = assembleMeStats({
      today,
      screenings,
      films,
      watchIds,
      poolFilmIds,
      weekVotes,
    });
    res.json({
      ...stats,
      watchedHours: minutesToHours(stats.watchedMinutes),
      unwatchedHours: minutesToHours(stats.unwatchedMinutes),
      totalScreenedHours: minutesToHours(stats.totalScreenedMinutes),
    });
  }));

  // ---- My activity (nomination pool + stacked week votes) ----
  app.get('/api/me/activity', asyncHandler(async (req, res) => {
    const authz = req.headers.authorization || '';
    if (!authz.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
    const ident = await callerIdentity(authz.slice(7).trim());
    if (!ident) return res.status(401).json({ error: 'unauthorized' });
    const uid = ident.uid;
    const today = shanghaiDateString();

    const [pool, weekVotes, screenings] = await Promise.all([
      pgGet(`/nomination_pool?nominee_identity_id=eq.${encodeURIComponent(uid)}&select=id,film_id,tmdb_id,title,image,note,planned,status,source,created_at&order=created_at.desc`),
      pgGet(`/film_week_votes?identity_id=eq.${encodeURIComponent(uid)}&select=film_id,count,week_start`),
      pgGet('/screenings?select=screen_date,film_ids'),
    ]);
    const ids = [];
    for (const p of pool || []) if (p.film_id) ids.push(p.film_id);
    for (const v of weekVotes || []) if (v.film_id) ids.push(v.film_id);
    const filmPath = filmsByIdPath(ids);
    const films = filmPath ? await pgGet(filmPath) : [];
    res.json(assembleMeActivity({ today, pool, weekVotes, films, screenings }));
  }));
}
