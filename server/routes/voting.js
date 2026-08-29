import { asyncHandler } from '../lib/middleware.js';
import { issueVoterCookie, allowRate, clientIp } from '../auth.js';
import { pgGet, pgWrite } from '../lib/db.js';
import { resolveIdentity } from '../lib/identity.js';
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
 * Voting + nominations: ticket, weekly film stack votes, quota, pool, plaza.
 * voterId is NEVER trusted from the body. No named round machine.
 */
export function votingRoutes(app) {

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

  // ---- Voting: weekly stack on filmId only ----
  app.post('/api/vote', asyncHandler(async (req, res) => {
    const filmId = typeof req.body?.filmId === 'string' ? req.body.filmId.trim() : '';
    if (!filmId) return res.status(400).json({ error: 'bad_request' });
    return postFilmVote(req, res, filmId);
  }));

  // ---- Revoke one stacked vote this week ----
  app.delete('/api/vote', asyncHandler(async (req, res) => {
    const filmId = typeof req.body?.filmId === 'string' ? req.body.filmId.trim() : '';
    if (!filmId) return res.status(400).json({ error: 'bad_request' });
    return deleteFilmVote(req, res, filmId);
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
