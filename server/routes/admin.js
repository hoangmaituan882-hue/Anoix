/**
 * Admin endpoints (user management, nomination pool, scheduling, rounds, stats).
 * Admin-only via adminGate (rate-limited + verified role).
 */
export function adminRoutes(app, d) {
  const { ENV_ID, tcRequest, tcEnabled, pgGet, pgWrite, mapUser, nextUserNo, insertUserRole, adminGate } = d;

  app.get('/api/admin/users', adminGate, async (req, res, next) => {
    try {
      if (!tcEnabled()) return res.status(503).json({ error: 'user_management_unavailable' });
      const limit = Math.min(Math.max(Number(req.query.limit) || 50, 1), 100);
      const offset = Math.max(Number(req.query.offset) || 0, 0);
      const resp = await tcRequest('DescribeEndUsers', { EnvId: ENV_ID, Limit: limit, Offset: offset });
      const roles = await pgGet('/user_roles?select=uid,role,user_no,registered_at');
      const roleMap = new Map((roles || []).map((r) => [r.uid, r]));
      const users = (resp.Users || []).map((u) => mapUser(u, roleMap));
      res.json({ total: users.length, users });
    } catch (e) { next(e); }
  });

  app.post('/api/admin/users', adminGate, async (req, res, next) => {
    try {
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
    } catch (e) { next(e); }
  });

  app.patch('/api/admin/users/:uid', adminGate, async (req, res, next) => {
    try {
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
    } catch (e) { next(e); }
  });

  app.delete('/api/admin/users/:uid', adminGate, async (req, res, next) => {
    try {
      const uid = req.params.uid;
      await pgWrite('DELETE', `/user_roles?uid=eq.${encodeURIComponent(uid)}`);
      await tcRequest('DeleteEndUser', { EnvId: ENV_ID, UserList: [uid] });
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  app.post('/api/admin/options/:id/plan', adminGate, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'bad_request' });
      await pgWrite('PATCH', `/nomination_options?id=eq.${id}`, { planned: true });
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  app.get('/api/admin/pool', adminGate, async (_req, res, next) => {
    try {
      const rows = await pgGet('/nomination_pool?select=*&order=created_at.desc');
      res.json(rows ?? []);
    } catch (e) { next(e); }
  });

  app.post('/api/admin/pool/:id/promote', adminGate, async (req, res, next) => {
    try {
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
    } catch (e) { next(e); }
  });

  app.post('/api/admin/pool/:id/demote', adminGate, async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ error: 'bad_request' });
      await pgWrite('PATCH', `/nomination_pool?id=eq.${id}`, { status: 'pending', planned: false });
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  app.post('/api/admin/films/:id/schedule', adminGate, async (req, res, next) => {
    try {
      const id = req.params.id;
      const { screening_status, screening_date } = req.body ?? {};
      const valid = ['unscheduled', 'scheduled', 'screened'];
      if (!valid.includes(screening_status)) return res.status(400).json({ error: 'bad_status' });
      const body = { screening_status };
      body.screening_date = screening_date && typeof screening_date === 'string' ? screening_date : null;
      await pgWrite('PATCH', `/films?id=eq.${encodeURIComponent(id)}`, body);
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  app.post('/api/admin/rounds/:id/status', adminGate, async (req, res, next) => {
    try {
      const id = req.params.id;
      const { status, deadline } = req.body ?? {};
      const valid = ['draft', 'collecting', 'reviewing', 'voting', 'revealed', 'archived'];
      if (!valid.includes(status)) return res.status(400).json({ error: 'bad_status' });
      const body = { status };
      if (deadline !== undefined) body.deadline = deadline || null;
      await pgWrite('PATCH', `/nomination_rounds?id=eq.${encodeURIComponent(id)}`, body);
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  app.get('/api/admin/stats', adminGate, async (_req, res, next) => {
    try {
      const [pool, votes, options, rounds, films] = await Promise.all([
        pgGet('/nomination_pool?select=id,title,note,source,status,nominee_identity_id,created_at&order=created_at.desc&limit=500'),
        pgGet('/votes?select=round_id,option_id,voter_id,created_at&order=created_at.desc&limit=500'),
        pgGet('/nomination_options?select=id,round_id,film_id'),
        pgGet('/nomination_rounds?select=id,title'),
        pgGet('/films?select=id,title,title_zh,title_en'),
      ]);

      let userMap = new Map();
      try {
        const resp = await tcRequest('DescribeEndUsers', { EnvId: ENV_ID, Limit: 100, Offset: 0 });
        for (const u of resp.Users || []) userMap.set(u.UUId, u.UserName || u.Email || u.PhoneNumber || u.UUId);
      } catch { }

      const name = (id) => (id ? (userMap.get(id) || (String(id).length > 30 ? '匿名' : id)) : '匿名');
      const roundTitle = new Map((rounds || []).map((r) => [r.id, r.title]));
      const filmTitle = new Map((films || []).map((f) => [f.id, f.title_zh || f.title_en || f.title]));
      const optInfo = new Map((options || []).map((o) => [o.id, { round_id: o.round_id, film_id: o.film_id }]));

      const nominations = (pool || []).map((p) => ({
        id: p.id, title: p.title, note: p.note, source: p.source, status: p.status,
        nominee: name(p.nominee_identity_id), created_at: p.created_at,
      }));
      const votesList = (votes || []).map((v) => {
        const o = optInfo.get(v.option_id);
        return {
          round_id: v.round_id,
          round_title: o ? (roundTitle.get(o.round_id) || v.round_id) : v.round_id,
          film_id: o?.film_id ?? null,
          film_title: o?.film_id ? (filmTitle.get(o.film_id) || o.film_id) : '—',
          voter: name(v.voter_id),
          voted_at: v.created_at,
        };
      });

      res.json({ nominations, votes: votesList });
    } catch (e) { next(e); }
  });
}