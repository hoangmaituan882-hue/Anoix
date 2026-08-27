/**
 * Voting + nominations: ticket, vote (cast/status/revoke), quota, nominations
 * (rounds/continuous/direct/plaza). voterId is NEVER trusted from the body.
 */
import { issueVoterCookie } from '../auth.js';

export function votingRoutes(app, d) {
  const { pgGet, pgWrite, resolveIdentity, resolveVoter, quotaInfo, bumpQuota, unbumpQuota, allowRate, clientIp, QUOTA_LIMITS } = d;

  // ---- Nominations (rounds + options + film join + live vote counts) ----
  app.get('/api/nominations', async (_req, res, next) => {
    try {
      const [rounds, options, films, votes] = await Promise.all([
        pgGet('/nomination_rounds?select=*&order=created_at.desc'),
        pgGet('/nomination_options?select=*&order=id.asc'),
        pgGet('/films?select=id,title,title_zh,title_en,year,category,image'),
        pgGet('/votes?select=round_id,option_id'),
      ]);
      const filmById = new Map(films.map((f) => [f.id, f]));
      const voteCount = new Map(); // option_id -> count (live tally, no stale counter)
      for (const v of votes) voteCount.set(v.option_id, (voteCount.get(v.option_id) ?? 0) + 1);
      res.json(rounds.map((r) => ({
        ...r,
        options: options
          .filter((o) => o.round_id === r.id)
          .map((o) => ({
            ...o,
            votes_count: voteCount.get(o.id) ?? 0,
            film: o.film_id ? filmById.get(o.film_id) ?? null : null,
          })),
      })));
    } catch (e) { next(e); }
  });

  // ---- Issue an unforgeable anonymous voter cookie ----
  app.get('/api/vote/ticket', (_req, res) => {
    issueVoterCookie(res);
    res.json({ ok: true });
  });

  // ---- Voting (multi-vote within a round, weekly quota capped) ----
  app.post('/api/vote', async (req, res, next) => {
    try {
      const { roundId, optionId } = req.body ?? {};
      if (!roundId || !Number.isInteger(optionId) || optionId <= 0) {
        return res.status(400).json({ error: 'bad_request' });
      }
      if (!allowRate(`vote:${clientIp(req)}`, 30, 60_000)) {
        return res.status(429).json({ error: 'rate_limited' });
      }

      const ident = await resolveIdentity(req);
      if (!ident) {
        return res.status(401).json({ error: 'identity_required' });
      }
      const quota = await quotaInfo(ident.identityId, ident.kind);
      if (quota.remainingVotes <= 0) {
        return res.status(429).json({ error: 'quota_exceeded' });
      }

      const rounds = await pgGet(`/nomination_rounds?id=eq.${encodeURIComponent(roundId)}&select=id,status,deadline`);
      const round = rounds?.[0];
      if (!round) return res.status(404).json({ error: 'round_not_found' });
      if (round.status !== 'voting') return res.status(409).json({ error: 'not_voting' });
      if (round.deadline && new Date(round.deadline).getTime() < Date.now()) {
        return res.status(409).json({ error: 'deadline_passed' });
      }

      // The candidate must belong to this round — otherwise a voter could push
      // this round's vote onto a different (already revealed) round's option.
      const opts = await pgGet(`/nomination_options?id=eq.${optionId}&select=id,round_id`);
      const opt = opts?.[0];
      if (!opt) return res.status(404).json({ error: 'option_not_found' });
      if (opt.round_id !== roundId) return res.status(400).json({ error: 'option_not_in_round' });

      const [status] = await pgWrite('POST', '/votes', {
        round_id: roundId,
        option_id: optionId,
        voter_id: ident.identityId,
      });
      if (status === 409) return res.status(409).json({ error: 'already_voted' });
      if (status >= 400) return res.status(502).json({ error: 'vote_failed' });
      await bumpQuota(ident.identityId, 'vote');
      return res.json({ ok: true });
    } catch (e) { next(e); }
  });

  // ---- My vote status (token uid first, else signed cookie) ----
  app.get('/api/vote', async (req, res, next) => {
    try {
      const { roundId } = req.query;
      if (!roundId) return res.json({ voted: false, optionIds: [] });
      const voterId = await resolveVoter(req);
      if (!voterId) return res.json({ voted: false, optionIds: [] });
      const mine = await pgGet(
        `/votes?round_id=eq.${encodeURIComponent(String(roundId))}&voter_id=eq.${encodeURIComponent(voterId)}&select=option_id`,
      );
      return res.json({ voted: (mine || []).length > 0, optionIds: (mine || []).map((v) => v.option_id) });
    } catch (e) { next(e); }
  });

  // ---- Revoke (withdraw) a vote ----
  app.delete('/api/vote', async (req, res, next) => {
    try {
      const { roundId, optionId } = req.body ?? {};
      if (!roundId || !Number.isInteger(optionId) || optionId <= 0) {
        return res.status(400).json({ error: 'bad_request' });
      }
      if (!allowRate(`vote:${clientIp(req)}`, 30, 60_000)) {
        return res.status(429).json({ error: 'rate_limited' });
      }
      const ident = await resolveIdentity(req);
      if (!ident) return res.status(401).json({ error: 'identity_required' });

      const rounds = await pgGet(`/nomination_rounds?id=eq.${encodeURIComponent(roundId)}&select=id,status`);
      const round = rounds?.[0];
      if (!round) return res.status(404).json({ error: 'round_not_found' });
      if (round.status !== 'voting') return res.status(409).json({ error: 'not_voting' });

      const [status] = await pgWrite(
        'DELETE',
        `/votes?round_id=eq.${encodeURIComponent(roundId)}&voter_id=eq.${encodeURIComponent(ident.identityId)}&option_id=eq.${optionId}`,
      );
      if (status === 404) return res.status(404).json({ error: 'vote_not_found' });
      if (status >= 400) return res.status(502).json({ error: 'revoke_failed' });
      await unbumpQuota(ident.identityId, 'vote');
      return res.json({ ok: true });
    } catch (e) { next(e); }
  });

  // ---- Weekly quota (anonymous cookie vs logged-in uid) ----
  app.get('/api/quota', async (req, res, next) => {
    try {
      const ident = await resolveIdentity(req);
      if (!ident) {
        return res.json({
          kind: 'anon',
          nominationsUsed: 0,
          votesUsed: 0,
          nominationsLimit: QUOTA_LIMITS.anon.nominations,
          votesLimit: QUOTA_LIMITS.anon.votes,
          remainingNominations: QUOTA_LIMITS.anon.nominations,
          remainingVotes: QUOTA_LIMITS.anon.votes,
        });
      }
      res.json(await quotaInfo(ident.identityId, ident.kind));
    } catch (e) { next(e); }
  });

  // ---- Continuous nomination → pool (no round required; admin reviews later) ----
  app.post('/api/nominations', async (req, res, next) => {
    try {
      const ident = await resolveIdentity(req);
      if (!ident) return res.status(401).json({ error: 'identity_required' });
      if (!allowRate(`nom:${clientIp(req)}`, 20, 60_000)) return res.status(429).json({ error: 'rate_limited' });

      const { filmId, tmdb, note } = req.body ?? {};
      if (typeof note !== 'string' || note.trim().length === 0) {
        return res.status(400).json({ error: 'note_required' });
      }
      if (note.trim().length > 200) return res.status(400).json({ error: 'note_too_long' });

      const quota = await quotaInfo(ident.identityId, ident.kind);
      if (quota.remainingNominations <= 0) return res.status(429).json({ error: 'quota_exceeded' });

      const row = {
        note: note.trim(),
        nominee_identity_id: ident.identityId,
        source: 'user',
        status: 'pending',
        planned: false,
      };

      if (tmdb && tmdb.tmdbId) {
        row.tmdb_id = `tmdb-${tmdb.tmdbId}`;
        row.title = tmdb.title || tmdb.originalTitle || `tmdb-${tmdb.tmdbId}`;
        row.original_title = tmdb.originalTitle || null;
        row.year = tmdb.year || '';
        row.image = tmdb.posterUrl || '';
        row.overview = tmdb.overview || '';
        row.director = tmdb.director || null;
      } else if (typeof filmId === 'string' && filmId.trim()) {
        const fid = filmId.trim();
        const films = await pgGet(`/films?id=eq.${encodeURIComponent(fid)}&select=id,title,title_zh,title_en,year,image`);
        const f = films?.[0];
        if (!f) return res.status(404).json({ error: 'film_not_found' });
        row.film_id = fid;
        row.title = f.title_zh || f.title_en || f.title;
        row.year = f.year || '';
        row.image = f.image || '';
      } else {
        return res.status(400).json({ error: 'film_required' });
      }

      await pgWrite('POST', '/nomination_pool', row);
      await bumpQuota(ident.identityId, 'nomination');
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  // ---- Nominate a film directly into a specific round (admin/legacy) ----
  app.post('/api/nominations/:roundId/nominate', async (req, res, next) => {
    try {
      const ident = await resolveIdentity(req);
      if (!ident) return res.status(401).json({ error: 'identity_required' });
      if (!allowRate(`nom:${clientIp(req)}`, 20, 60_000)) return res.status(429).json({ error: 'rate_limited' });

      const roundId = req.params.roundId;
      const { filmId, tmdb, note } = req.body ?? {};
      if (typeof note !== 'string' || note.trim().length === 0) {
        return res.status(400).json({ error: 'note_required' });
      }
      if (note.trim().length > 200) return res.status(400).json({ error: 'note_too_long' });

      const rounds = await pgGet(`/nomination_rounds?id=eq.${encodeURIComponent(roundId)}&select=id,status`);
      const round = rounds?.[0];
      if (!round) return res.status(404).json({ error: 'round_not_found' });
      if (round.status !== 'collecting') return res.status(409).json({ error: 'not_collecting' });

      const quota = await quotaInfo(ident.identityId, ident.kind);
      if (quota.remainingNominations <= 0) return res.status(429).json({ error: 'quota_exceeded' });

      // Resolve film id: existing library film, or create one from TMDB scrape.
      let fid = typeof filmId === 'string' ? filmId.trim() : '';
      let source = 'library';
      if (tmdb && tmdb.tmdbId) {
        fid = `tmdb-${tmdb.tmdbId}`;
        source = 'tmdb';
        const existing = await pgGet(`/films?id=eq.${encodeURIComponent(fid)}&select=id`);
        if (!existing?.length) {
          await pgWrite('POST', '/films', {
            id: fid,
            title: tmdb.originalTitle || tmdb.title || fid,
            title_zh: tmdb.title || null,
            title_en: tmdb.originalTitle || null,
            year: tmdb.year || '',
            category: 'Movie',
            image: tmdb.posterUrl || '',
            description: tmdb.overview || '',
            description_zh: tmdb.overview || null,
            description_en: tmdb.overview || null,
            director: tmdb.director || null,
            is_new: false,
            sort_order: 0,
          });
        }
      }
      if (!fid) return res.status(400).json({ error: 'film_required' });

      const films = await pgGet(`/films?id=eq.${encodeURIComponent(fid)}&select=id`);
      if (!films?.length) return res.status(404).json({ error: 'film_not_found' });

      const nominator = ident.kind === 'user' ? '用户' : '匿名';
      await pgWrite('POST', '/nomination_options', {
        round_id: roundId,
        film_id: fid,
        nominator,
        nominee_identity_id: ident.identityId,
        source,
        note: note.trim(),
        votes_count: 0,
      });
      await bumpQuota(ident.identityId, 'nomination');
      res.json({ ok: true });
    } catch (e) { next(e); }
  });

  // ---- Nomination plaza (reads the pool; votes joined from round candidates) ----
  app.get('/api/nominations/plaza', async (req, res, next) => {
    try {
      const scope = req.query.scope === 'all' ? 'all' : 'week';
      const [pool, options, votes] = await Promise.all([
        pgGet('/nomination_pool?select=id,film_id,tmdb_id,title,image,year,planned,created_at&order=created_at.desc'),
        pgGet('/nomination_options?select=id,film_id'),
        pgGet('/votes?select=option_id'),
      ]);
      const optionFilm = new Map();
      for (const o of options || []) optionFilm.set(o.id, o.film_id);
      const votesByFilm = new Map();
      for (const v of votes || []) {
        const fid = optionFilm.get(v.option_id);
        if (fid) votesByFilm.set(fid, (votesByFilm.get(fid) ?? 0) + 1);
      }

      const weekStart = Date.now() - 7 * 24 * 3600 * 1000;
      const grouped = new Map();
      for (const p of pool || []) {
        const created = p.created_at ? new Date(p.created_at).getTime() : 0;
        if (scope === 'week' && created < weekStart) continue;
        const key = p.film_id || p.tmdb_id || p.title;
        let g = grouped.get(key);
        if (!g) {
          g = { filmId: key, title: p.title, image: p.image || '', year: p.year || '', nominations: 0, planned: false };
          grouped.set(key, g);
        }
        g.nominations += 1;
        g.planned = g.planned || Boolean(p.planned);
      }
      const items = Array.from(grouped.values()).map((g) => ({
        filmId: g.filmId,
        title: g.title,
        image: g.image,
        year: g.year,
        category: '',
        nominations: g.nominations,
        votes: votesByFilm.get(g.filmId) ?? 0,
        planned: g.planned,
      }));
      res.json({ items });
    } catch (e) { next(e); }
  });
}