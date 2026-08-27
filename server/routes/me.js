/**
 * Self-service profile endpoints: read own profile, update nickname/avatar,
 * change password, and my activity (nominations + votes).
 */

const pickField = (v, max) => (typeof v === 'string' ? v.slice(0, max) : undefined);

export function meRoutes(app, d) {
  const { ENV_ID, tcRequest, pgGet, callerIdentity, mapUser } = d;

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

  app.get('/api/me', async (req, res, next) => {
    try {
      const authz = req.headers.authorization || '';
      if (!authz.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
      const ident = await callerIdentity(authz.slice(7).trim());
      if (!ident) return res.status(401).json({ error: 'unauthorized' });
      const resp = await tcRequest('DescribeEndUsers', { EnvId: ENV_ID, Limit: 100, Offset: 0 });
      const u = (resp.Users || []).find((x) => x.UUId === ident.uid);
      if (!u) return res.status(404).json({ error: 'user_not_found' });
      res.json(mapUser(u, new Map([[ident.uid, ident.role]])));
    } catch (e) { next(e); }
  });

  app.patch('/api/me', async (req, res, next) => {
    try {
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
    } catch (e) { next(e); }
  });

  app.post('/api/me/password', async (req, res, next) => {
    try {
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
    } catch (e) { next(e); }
  });

  // ---- My activity (nominations + votes, with planned/approved status) ----
  app.get('/api/me/activity', async (req, res, next) => {
    try {
      const authz = req.headers.authorization || '';
      if (!authz.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' });
      const ident = await callerIdentity(authz.slice(7).trim());
      if (!ident) return res.status(401).json({ error: 'unauthorized' });

      const [myOptions, myVotes, rounds, allOptions, films] = await Promise.all([
        pgGet(`/nomination_options?nominee_identity_id=eq.${encodeURIComponent(ident.uid)}&select=id,round_id,film_id,note,created_at,planned,source&order=created_at.desc`),
        pgGet(`/votes?voter_id=eq.${encodeURIComponent(ident.uid)}&select=round_id,option_id,created_at&order=created_at.desc`),
        pgGet('/nomination_rounds?select=id,title,status'),
        pgGet('/nomination_options?select=id,film_id,planned'),
        pgGet('/films?select=id,title,title_zh,title_en,year,image'),
      ]);
      const roundMap = new Map((rounds || []).map((r) => [r.id, r]));
      const optionMap = new Map((allOptions || []).map((o) => [o.id, o]));
      const filmMap = new Map((films || []).map((f) => [f.id, f]));

      const nominations = (myOptions || []).map((o) => {
        const round = roundMap.get(o.round_id);
        const film = filmMap.get(o.film_id);
        return {
          id: o.id,
          roundId: o.round_id,
          roundTitle: round?.title || o.round_id,
          roundStatus: round?.status || 'revealed',
          filmId: o.film_id,
          filmTitle: film ? (film.title_zh || film.title_en || film.title) : o.film_id,
          image: film?.image || '',
          note: o.note || '',
          planned: Boolean(o.planned),
          source: o.source || 'admin',
          createdAt: o.created_at,
        };
      });

      const votes = (myVotes || []).map((v) => {
        const round = roundMap.get(v.round_id);
        const option = optionMap.get(v.option_id);
        const film = option ? filmMap.get(option.film_id) : null;
        return {
          roundId: v.round_id,
          roundTitle: round?.title || v.round_id,
          roundStatus: round?.status || 'revealed',
          filmId: option?.film_id,
          filmTitle: film ? (film.title_zh || film.title_en || film.title) : '—',
          image: film?.image || '',
          planned: Boolean(option?.planned),
          votedAt: v.created_at,
        };
      });

      res.json({ nominations, votes });
    } catch (e) { next(e); }
  });
}