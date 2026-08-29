import { asyncHandler } from '../lib/middleware.js';
import { issueVoterCookie, allowRate, clientIp } from '../auth.js';
import { pgGet, pgWrite } from '../lib/db.js';
import { resolveIdentity, resolveVoter } from '../lib/identity.js';
import { quotaInfo, bumpQuota, unbumpQuota, QUOTA_LIMITS } from '../lib/quota.js';
import { weekStartDateString } from '../lib/pure.js';
import {
  shanghaiDateString,
  filmVoteGate,
  clubIndexByFilm,
  paginate,
  clampAddVotes,
} from '../lib/catalog.js';

/**
 * Voting + nominations: ticket, vote (cast/status/revoke), quota, nominations
 * (rounds/continuous/direct/plaza). voterId is NEVER trusted from the body.
 */
export function votingRoutes(app) {

  // ---- Nominations (rounds + options + film join + live vote counts) ----
  app.get('/api/nominations', asyncHandler(async (_req, res) => {
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
  }));

  // ---- Issue an unforgeable anonymous voter cookie ----
  app.get('/api/vote/ticket', (_req, res) => {
    issueVoterCookie(res);
    res.json({ ok: true });
  });

  app.get('/api/vote/mine', asyncHandler(async (req, res) => {
    const ident = await resolveIdentity(req);
    if (!ident) return res.json({ items: [] });
    const ws = weekStartDateString();
    const rows = await pgGet(
      `/film_week_votes?identity_id=eq.${encodeURIComponent(ident.identityId)}&week_start=eq.${ws}&select=film_id,count`,
    );
    res.json({ items: (rows || []).map((r) => ({ filmId: r.film_id, count: r.count ?? 0 })) });
  }));

  // ---- Voting: filmId stacks weekly counts; roundId+optionId is legacy ----
  app.post('/api/vote', asyncHandler(async (req, res) => {
    const filmId = typeof req.body?.filmId === 'string' ? req.body.filmId.trim() : '';
    if (filmId) return postFilmVote(req, res, filmId);

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
  }));

  // ---- My vote status (token uid first, else signed cookie) ----
  app.get('/api/vote', asyncHandler(async (req, res) => {
    const { roundId } = req.query;
    if (!roundId) return res.json({ voted: false, optionIds: [] });
    const voterId = await resolveVoter(req);
    if (!voterId) return res.json({ voted: false, optionIds: [] });
    const mine = await pgGet(
      `/votes?round_id=eq.${encodeURIComponent(String(roundId))}&voter_id=eq.${encodeURIComponent(voterId)}&select=option_id`,
    );
    return res.json({ voted: (mine || []).length > 0, optionIds: (mine || []).map((v) => v.option_id) });
  }));

  // ---- Revoke (withdraw) a vote ----
  app.delete('/api/vote', asyncHandler(async (req, res) => {
    const filmId = typeof req.body?.filmId === 'string' ? req.body.filmId.trim() : '';
    if (filmId) return deleteFilmVote(req, res, filmId);

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
  }));

  // ---- Weekly quota (anonymous cookie vs logged-in uid) ----
  app.get('/api/quota', asyncHandler(async (req, res) => {
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
  }));

  // ---- Continuous nomination → pool (no round required; admin reviews later) ----
  app.post('/api/nominations', asyncHandler(async (req, res) => {
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
      const ws = weekStartDateString();
      const weekStartIso = encodeURIComponent(`${ws}T00:00:00+08:00`);
      const dup = await pgGet(
        `/nomination_pool?nominee_identity_id=eq.${encodeURIComponent(ident.identityId)}&film_id=eq.${encodeURIComponent(fid)}&created_at=gte.${weekStartIso}&select=id&limit=1`,
      );
      if (dup?.length) return res.status(409).json({ error: 'already_nominated_this_week' });
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
  }));

  // ---- Nominate a film directly into a specific round (admin/legacy) ----
  app.post('/api/nominations/:roundId/nominate', asyncHandler(async (req, res) => {
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
  }));

  // ---- Nomination plaza (pool + stacked film_week_votes) ----
  app.get('/api/nominations/plaza', asyncHandler(async (req, res) => {
    const scope = req.query.scope === 'all' ? 'all' : 'week';
    const ws = weekStartDateString();
    const voteQuery = scope === 'week'
      ? `/film_week_votes?week_start=eq.${ws}&select=film_id,count`
      : '/film_week_votes?select=film_id,count';
    const [pool, voteRows] = await Promise.all([
      pgGet('/nomination_pool?select=id,film_id,tmdb_id,title,image,year,planned,created_at&order=created_at.desc'),
      pgGet(voteQuery),
    ]);
    const votesByFilm = new Map();
    for (const v of voteRows || []) {
      const fid = v.film_id;
      if (!fid) continue;
      votesByFilm.set(fid, (votesByFilm.get(fid) ?? 0) + (v.count ?? 0));
    }

    const weekStartMs = new Date(`${ws}T00:00:00+08:00`).getTime();
    const grouped = new Map();
    for (const p of pool || []) {
      const created = p.created_at ? new Date(p.created_at).getTime() : 0;
      if (scope === 'week' && created < weekStartMs) continue;
      const key = p.film_id || p.tmdb_id || p.title;
      let g = grouped.get(key);
      if (!g) {
        g = { filmId: key, title: p.title, image: p.image || '', year: p.year || '', nominations: 0, planned: false };
        grouped.set(key, g);
      }
      g.nominations += 1;
      g.planned = g.planned || Boolean(p.planned);
    }
    const missing = [...votesByFilm.keys()].filter((id) => !grouped.has(id));
    if (missing.length) {
      const extra = await pgGet(
        `/films?id=in.(${missing.map(encodeURIComponent).join(',')})&select=id,title,title_zh,title_en,year,image`,
      );
      for (const f of extra || []) {
        grouped.set(f.id, {
          filmId: f.id,
          title: f.title_zh || f.title_en || f.title,
          image: f.image || '',
          year: f.year || '',
          nominations: 0,
          planned: false,
        });
      }
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
    items.sort((a, b) => b.votes - a.votes || b.nominations - a.nominations);
    const limit = req.query.limit != null ? Number(req.query.limit) : items.length;
    const offset = Number(req.query.offset) || 0;
    res.json(paginate(items, offset, Number.isFinite(limit) && limit > 0 ? limit : items.length || 1));
  }));
}

async function datesForFilm(filmId) {
  const [screenings, films] = await Promise.all([
    pgGet('/screenings?select=screen_date,film_ids'),
    pgGet(`/films?id=eq.${encodeURIComponent(filmId)}&select=id,screening_date`),
  ]);
  const rec = clubIndexByFilm(screenings ?? []).get(filmId);
  const dates = rec ? [...rec.dates] : [];
  if (films?.[0]?.screening_date) dates.push(films[0].screening_date);
  return dates;
}

async function postFilmVote(req, res, filmId) {
  if (!allowRate(`vote:${clientIp(req)}`, 30, 60_000)) {
    return res.status(429).json({ error: 'rate_limited' });
  }
  const ident = await resolveIdentity(req);
  if (!ident) return res.status(401).json({ error: 'identity_required' });
  const quota = await quotaInfo(ident.identityId, ident.kind);
  const clamped = clampAddVotes(req.body?.count, quota.remainingVotes);
  if (!clamped.ok) {
    return res.status(clamped.error === 'quota_exceeded' ? 429 : 400).json({ error: clamped.error });
  }

  const films = await pgGet(`/films?id=eq.${encodeURIComponent(filmId)}&select=id`);
  if (!films?.length) return res.status(404).json({ error: 'film_not_found' });

  const gate = filmVoteGate(await datesForFilm(filmId), shanghaiDateString());
  if (gate === 'screened') return res.status(409).json({ error: 'already_screened' });
  if (gate === 'frozen') return res.status(409).json({ error: 'frozen' });

  const ws = weekStartDateString();
  const existing = await pgGet(
    `/film_week_votes?identity_id=eq.${encodeURIComponent(ident.identityId)}&film_id=eq.${encodeURIComponent(filmId)}&week_start=eq.${ws}&select=count&limit=1`,
  );
  const prev = existing?.[0]?.count ?? 0;
  const next = prev + clamped.count;
  if (prev > 0) {
    const [status] = await pgWrite(
      'PATCH',
      `/film_week_votes?identity_id=eq.${encodeURIComponent(ident.identityId)}&film_id=eq.${encodeURIComponent(filmId)}&week_start=eq.${ws}`,
      { count: next, updated_at: new Date().toISOString() },
    );
    if (status >= 400) return res.status(502).json({ error: 'vote_failed' });
  } else {
    const [status] = await pgWrite('POST', '/film_week_votes', {
      identity_id: ident.identityId,
      film_id: filmId,
      week_start: ws,
      count: next,
    });
    if (status >= 400) return res.status(502).json({ error: 'vote_failed' });
  }
  await bumpQuota(ident.identityId, 'vote', clamped.count);
  return res.json({ ok: true, count: next });
}

async function deleteFilmVote(req, res, filmId) {
  if (!allowRate(`vote:${clientIp(req)}`, 30, 60_000)) {
    return res.status(429).json({ error: 'rate_limited' });
  }
  const ident = await resolveIdentity(req);
  if (!ident) return res.status(401).json({ error: 'identity_required' });
  const ws = weekStartDateString();
  const existing = await pgGet(
    `/film_week_votes?identity_id=eq.${encodeURIComponent(ident.identityId)}&film_id=eq.${encodeURIComponent(filmId)}&week_start=eq.${ws}&select=count&limit=1`,
  );
  const prev = existing?.[0]?.count ?? 0;
  if (prev < 1) return res.status(404).json({ error: 'vote_not_found' });
  if (prev === 1) {
    const [status] = await pgWrite(
      'DELETE',
      `/film_week_votes?identity_id=eq.${encodeURIComponent(ident.identityId)}&film_id=eq.${encodeURIComponent(filmId)}&week_start=eq.${ws}`,
    );
    if (status >= 400) return res.status(502).json({ error: 'revoke_failed' });
  } else {
    const [status] = await pgWrite(
      'PATCH',
      `/film_week_votes?identity_id=eq.${encodeURIComponent(ident.identityId)}&film_id=eq.${encodeURIComponent(filmId)}&week_start=eq.${ws}`,
      { count: prev - 1, updated_at: new Date().toISOString() },
    );
    if (status >= 400) return res.status(502).json({ error: 'revoke_failed' });
  }
  await unbumpQuota(ident.identityId, 'vote', 1);
  return res.json({ ok: true, count: prev - 1 });
}
