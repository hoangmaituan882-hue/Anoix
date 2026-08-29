import { asyncHandler } from '../lib/middleware.js';
import { ENV_ID } from '../lib/config.js';
import { pgGet, pgWrite, contentCache } from '../lib/db.js';
import { mapUser, insertUserRole } from '../lib/users.js';
import { adminGate } from '../lib/identity.js';
import { tcRequest, tcEnabled } from '../tcapi.js';
import { resolveVideoMeta } from '../lib/channel.js';
import { assembleNominationStats } from '../lib/nominationStats.js';
import { socialPayload } from '../lib/socialLinks.js';

/**
 * Admin endpoints (user management, nomination pool, scheduling, stats).
 * Admin-only via adminGate (rate-limited + verified role).
 */
export function adminRoutes(app) {

  app.get('/api/admin/users', adminGate, asyncHandler(async (req, res) => {
    if (!tcEnabled()) return res.status(503).json({ error: 'user_management_unavailable' });
    const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
    const offset = Math.max(Number(req.query.offset) || 0, 0);
    const resp = await tcRequest('DescribeEndUsers', { EnvId: ENV_ID, Limit: limit, Offset: offset });
    const roles = await pgGet('/user_roles?select=uid,role,user_no,registered_at');
    const roleMap = new Map((roles || []).map((r) => [r.uid, r]));
    const users = (resp.Users || []).map((u) => mapUser(u, roleMap));
    res.json({ total: users.length, users });
  }));

  app.post('/api/admin/users', adminGate, asyncHandler(async (req, res) => {
    const { username, password, role } = req.body ?? {};
    const name = typeof username === 'string' ? username.trim() : '';
    if (!name || typeof password !== 'string' || password.length < 6) {
      return res.status(400).json({ error: 'bad_request' });
    }
    const resp = await tcRequest('CreateEndUserAccount', { EnvId: ENV_ID, Username: name, Password: password });
    const uid = resp?.User?.UUId || resp?.UUId || null;
    if (uid) {
      await insertUserRole(uid, role === 'admin' ? 'admin' : 'user', name);
    }
    res.json({ ok: true, uid });
  }));

  app.patch('/api/admin/users/:uid', adminGate, asyncHandler(async (req, res) => {
    const uid = req.params.uid;
    const { role, disabled, password } = req.body ?? {};

    if (role === 'admin') {
      await pgWrite('POST', '/user_roles', { uid, role: 'admin' });
    } else if (role === 'user') {
      await pgWrite('DELETE', `/user_roles?uid=eq.${encodeURIComponent(uid)}`);
    }
    if (typeof disabled === 'boolean') {
      await tcRequest('ModifyEndUser', { EnvId: ENV_ID, UUId: uid, Status: disabled ? 'DISABLE' : 'ENABLE' });
    }
    if (typeof password === 'string' && password.length >= 6) {
      try {
        await tcRequest('ModifyEndUserAccount', { EnvId: ENV_ID, Uuid: uid, Password: password });
      } catch (e) {
        if (e?.code === 'InvalidParameter' || /not exist/i.test(e?.message || '')) {
          const err = new Error('该用户已被封禁，请先解封后再重置密码');
          err.status = 409;
          throw err;
        }
        throw e;
      }
    }
    res.json({ ok: true });
  }));

  app.delete('/api/admin/users/:uid', adminGate, asyncHandler(async (req, res) => {
    const uid = req.params.uid;
    await pgWrite('DELETE', `/user_roles?uid=eq.${encodeURIComponent(uid)}`);
    await tcRequest('DeleteEndUser', { EnvId: ENV_ID, UserList: [uid] });
    res.json({ ok: true });
  }));

  app.get('/api/admin/pool', adminGate, asyncHandler(async (_req, res) => {
    const rows = await pgGet('/nomination_pool?select=*&order=created_at.desc');
    res.json(rows ?? []);
  }));

  app.post('/api/admin/pool/:id/promote', adminGate, asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'bad_request' });
    const rows = await pgGet(`/nomination_pool?id=eq.${id}&select=*`);
    const p = rows?.[0];
    if (!p) return res.status(404).json({ error: 'not_found' });

    let fid = p.film_id;
    if (!fid && p.tmdb_id) {
      fid = p.tmdb_id;
      const existing = await pgGet(`/films?id=eq.${encodeURIComponent(fid)}&select=id`);
      if (!existing?.length) {
        await pgWrite('POST', '/films', {
          id: fid,
          title: p.original_title || p.title || fid,
          title_zh: p.title || null,
          title_en: p.original_title || null,
          year: p.year || '',
          category: 'Movie',
          image: p.image || '',
          description: p.overview || '',
          description_zh: p.overview || null,
          description_en: p.overview || null,
          director: p.director || null,
          is_new: false,
          sort_order: 0,
        });
      }
    }
    if (!fid) return res.status(400).json({ error: 'no_film' });
    await pgWrite('PATCH', `/nomination_pool?id=eq.${id}`, { status: 'promoted', film_id: fid, planned: true });
    if (p.nominee_identity_id) {
      await pgWrite('POST', '/notifications', {
        uid: p.nominee_identity_id,
        type: 'promoted',
        title: '你的提名已通过',
        body: `《${p.title}》已被管理员勾选入库`,
      }).catch(() => {});
    }
    res.json({ ok: true, filmId: fid });
  }));

  app.post('/api/admin/pool/:id/demote', adminGate, asyncHandler(async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'bad_request' });
    await pgWrite('PATCH', `/nomination_pool?id=eq.${id}`, { status: 'pending', planned: false });
    res.json({ ok: true });
  }));

  app.post('/api/admin/films/:id/schedule', adminGate, asyncHandler(async (req, res) => {
    const id = req.params.id;
    const { screening_status, screening_date } = req.body ?? {};
    const valid = ['unscheduled', 'scheduled', 'screened'];
    if (!valid.includes(screening_status)) return res.status(400).json({ error: 'bad_status' });
    const body = { screening_status };
    body.screening_date = screening_date && typeof screening_date === 'string' ? screening_date : null;
    await pgWrite('PATCH', `/films?id=eq.${encodeURIComponent(id)}`, body);
    res.json({ ok: true });
  }));

  app.get('/api/admin/stats', adminGate, asyncHandler(async (_req, res) => {
    const [pool, weekVotes, members] = await Promise.all([
      pgGet('/nomination_pool?select=film_id,tmdb_id,title,image,year,nominee_identity_id'),
      pgGet('/film_week_votes?select=identity_id,film_id,count'),
      pgGet('/user_roles?select=uid,username,user_no'),
    ]);
    res.json(assembleNominationStats({ pool, weekVotes, members }));
  }));

  app.get('/api/admin/social-links', adminGate, asyncHandler(async (_req, res) => {
    const rows = await pgGet('/social_links?select=*&order=sort_order.asc');
    res.json(rows ?? []);
  }));

  app.post('/api/admin/social-links', adminGate, asyncHandler(async (req, res) => {
    const parsed = socialPayload(null, req.body ?? {});
    if (!parsed.ok) return res.status(400).json({ error: parsed.error });
    const last = await pgGet('/social_links?select=sort_order&order=sort_order.desc&limit=1');
    const sort_order = Number(last?.[0]?.sort_order);
    const id = `sns-${Date.now()}`;
    await pgWrite('POST', '/social_links', {
      id,
      ...parsed.body,
      sort_order: Number.isFinite(sort_order) ? sort_order + 1 : 0,
    });
    contentCache.delete('social');
    res.json({ ok: true, id });
  }));

  app.patch('/api/admin/social-links/:id', adminGate, asyncHandler(async (req, res) => {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'bad_request' });
    const rows = await pgGet(`/social_links?id=eq.${encodeURIComponent(id)}&select=*&limit=1`);
    const current = rows?.[0];
    if (!current) return res.status(404).json({ error: 'not_found' });
    const parsed = socialPayload(current, req.body ?? {});
    if (!parsed.ok) return res.status(400).json({ error: parsed.error });
    await pgWrite('PATCH', `/social_links?id=eq.${encodeURIComponent(id)}`, {
      ...parsed.body,
      updated_at: new Date().toISOString(),
    });
    contentCache.delete('social');
    res.json({ ok: true });
  }));

  app.delete('/api/admin/social-links/:id', adminGate, asyncHandler(async (req, res) => {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'bad_request' });
    await pgWrite('DELETE', `/social_links?id=eq.${encodeURIComponent(id)}`);
    contentCache.delete('social');
    res.json({ ok: true });
  }));

  app.post('/api/admin/social-links/reorder', adminGate, asyncHandler(async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((x) => String(x || '').trim()).filter(Boolean) : [];
    if (!ids.length) return res.status(400).json({ error: 'bad_request' });
    await Promise.all(ids.map((id, i) =>
      pgWrite('PATCH', `/social_links?id=eq.${encodeURIComponent(id)}`, { sort_order: i, updated_at: new Date().toISOString() }),
    ));
    contentCache.delete('social');
    res.json({ ok: true });
  }));

  app.post('/api/admin/channel/resolve', adminGate, asyncHandler(async (req, res) => {
    const url = typeof req.body?.url === 'string' ? req.body.url.trim() : '';
    const meta = await resolveVideoMeta(url);
    if (!meta.ok) return res.status(400).json({ error: meta.error || 'bad_url' });
    res.json(meta);
  }));

  app.post('/api/admin/news/flush', adminGate, asyncHandler(async (_req, res) => {
    contentCache.delete('news');
    res.json({ ok: true });
  }));

  app.post('/api/admin/news/reorder', adminGate, asyncHandler(async (req, res) => {
    const ids = Array.isArray(req.body?.ids) ? req.body.ids.map((x) => String(x || '').trim()).filter(Boolean) : [];
    if (!ids.length) return res.status(400).json({ error: 'bad_request' });
    await Promise.all(ids.map((id, i) =>
      pgWrite('PATCH', `/news?id=eq.${encodeURIComponent(id)}`, { sort_order: i }),
    ));
    contentCache.delete('news');
    res.json({ ok: true });
  }));
}
