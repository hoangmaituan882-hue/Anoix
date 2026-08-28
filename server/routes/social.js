import { asyncHandler } from '../lib/middleware.js';
import { personaFor } from '../lib/pure.js';
import { pgGet, pgWrite, pgUpsert, contentCache } from '../lib/db.js';
import { resolveIdentity } from '../lib/identity.js';
import { allowRate, clientIp } from '../auth.js';

/**
 * Social / community endpoints: notifications, favorites, calendar, watch log,
 * year-in-review, goods. Bound to the caller identity (uid or anon cookie).
 */
export function socialRoutes(app) {

  // ---- Notifications (list / mark read) ----
  app.get('/api/notifications', asyncHandler(async (req, res) => {
    const ident = await resolveIdentity(req);
    if (!ident) return res.json([]);
    const rows = await pgGet(`/notifications?uid=eq.${encodeURIComponent(ident.identityId)}&select=*&order=created_at.desc&limit=50`);
    res.json(rows ?? []);
  }));

  app.post('/api/notifications/read', asyncHandler(async (req, res) => {
    const ident = await resolveIdentity(req);
    if (!ident) return res.status(401).json({ error: 'identity_required' });
    if (!allowRate(`notif:${clientIp(req)}`, 30, 60_000)) return res.status(429).json({ error: 'rate_limited' });
    const { id } = req.body ?? {};
    if (id != null) {
      await pgWrite('PATCH', `/notifications?uid=eq.${encodeURIComponent(ident.identityId)}&id=eq.${Number(id)}`, { read: true });
    } else {
      await pgWrite('PATCH', `/notifications?uid=eq.${encodeURIComponent(ident.identityId)}`, { read: true });
    }
    res.json({ ok: true });
  }));

  // ---- Favorites (list / add / remove) ----
  app.get('/api/favorites', asyncHandler(async (req, res) => {
    const ident = await resolveIdentity(req);
    if (!ident) return res.json([]);
    const rows = await pgGet(`/favorites?uid=eq.${encodeURIComponent(ident.identityId)}&select=*&order=created_at.desc`);
    const ids = (rows ?? []).map((r) => r.film_id).filter(Boolean);
    const films = ids.length
      ? await pgGet(`/films?id=in.(${ids.map(encodeURIComponent).join(',')})&select=id,title,title_zh,title_en,year,category,image`)
      : [];
    res.json(films ?? []);
  }));

  app.post('/api/favorites', asyncHandler(async (req, res) => {
    const ident = await resolveIdentity(req);
    if (!ident) return res.status(401).json({ error: 'identity_required' });
    if (!allowRate(`fav:${clientIp(req)}`, 30, 60_000)) return res.status(429).json({ error: 'rate_limited' });
    const { filmId } = req.body ?? {};
    if (!filmId) return res.status(400).json({ error: 'film_required' });
    const [status] = await pgWrite('POST', '/favorites', { uid: ident.identityId, film_id: filmId });
    if (status === 409) return res.json({ ok: true }); // already favorited
    if (status >= 400) return res.status(502).json({ error: 'favorite_failed' });
    res.json({ ok: true });
  }));

  app.delete('/api/favorites/:filmId', asyncHandler(async (req, res) => {
    const ident = await resolveIdentity(req);
    if (!ident) return res.status(401).json({ error: 'identity_required' });
    if (!allowRate(`fav:${clientIp(req)}`, 30, 60_000)) return res.status(429).json({ error: 'rate_limited' });
    await pgWrite('DELETE', `/favorites?uid=eq.${encodeURIComponent(ident.identityId)}&film_id=eq.${encodeURIComponent(req.params.filmId)}`);
    res.json({ ok: true });
  }));

  // ---- Calendar: future live-stream / screening schedule ----
  app.get('/api/calendar', asyncHandler(async (_req, res) => {
    const [screenings, scheduled, films] = await Promise.all([
      pgGet('/screenings?select=id,title,screen_date,venue,theme,film_ids&order=screen_date.asc'),
      pgGet('/films?select=id,title,title_zh,title_en,image,year,screening_date&screening_status=eq.scheduled&order=screening_date.asc'),
      pgGet('/films?select=id,title,title_zh,title_en,image,year'),
    ]);
    const filmMap = new Map((films || []).map((f) => [f.id, f]));
    const events = [];
    for (const s of screenings || []) {
      if (!s.screen_date) continue;
      events.push({
        date: s.screen_date,
        type: 'screening',
        id: s.id,
        title: s.title,
        venue: s.venue || '',
        theme: s.theme || '',
        films: (s.film_ids || []).map((id) => {
          const f = filmMap.get(id);
          return { id, title: f ? (f.title_zh || f.title_en || f.title) : id, image: f?.image || '', year: f?.year || '' };
        }),
      });
    }
    for (const f of scheduled || []) {
      if (!f.screening_date) continue;
      events.push({
        date: f.screening_date,
        type: 'film',
        id: f.id,
        title: f.title_zh || f.title_en || f.title,
        image: f.image || '',
        year: f.year || '',
        venue: '',
        theme: '',
        films: [],
      });
    }
    res.json({ events });
  }));

  // ---- Watch log + rating + review ----
  app.get('/api/watch', asyncHandler(async (req, res) => {
    const ident = await resolveIdentity(req);
    if (!ident) return res.json([]);
    const rows = await pgGet(`/watch_log?uid=eq.${encodeURIComponent(ident.identityId)}&select=*&order=watched_at.desc`);
    const ids = (rows ?? []).map((r) => r.film_id).filter(Boolean);
    const films = ids.length
      ? await pgGet(`/films?id=in.(${ids.map(encodeURIComponent).join(',')})&select=id,title,title_zh,title_en,image,year`)
      : [];
    const filmMap = new Map((films ?? []).map((f) => [f.id, f]));
    res.json((rows ?? []).map((w) => {
      const f = filmMap.get(w.film_id);
      return { ...w, film_title: f ? (f.title_zh || f.title_en || f.title) : w.film_id, image: f?.image || '', year: f?.year || '' };
    }));
  }));

  app.put('/api/watch/:filmId', asyncHandler(async (req, res) => {
    const ident = await resolveIdentity(req);
    if (!ident) return res.status(401).json({ error: 'identity_required' });
    if (!allowRate(`watch:${clientIp(req)}`, 30, 60_000)) return res.status(429).json({ error: 'rate_limited' });
    const filmId = req.params.filmId;
    const { rating, review } = req.body ?? {};
    const r = Math.max(0, Math.min(5, Math.round(Number(rating) || 0)));
    const body = {
      film_id: filmId,
      uid: ident.identityId,
      rating: r,
      review: typeof review === 'string' ? review.trim().slice(0, 200) || null : null,
      watched_at: new Date().toISOString(),
    };
    // Atomic upsert on the (film_id, uid) UNIQUE key.
    const [status] = await pgUpsert('/watch_log', body);
    if (status >= 400) return res.status(502).json({ error: 'watch_failed' });
    res.json({ ok: true });
  }));

  app.delete('/api/watch/:filmId', asyncHandler(async (req, res) => {
    const ident = await resolveIdentity(req);
    if (!ident) return res.status(401).json({ error: 'identity_required' });
    if (!allowRate(`watch:${clientIp(req)}`, 30, 60_000)) return res.status(429).json({ error: 'rate_limited' });
    await pgWrite('DELETE', `/watch_log?film_id=eq.${encodeURIComponent(req.params.filmId)}&uid=eq.${encodeURIComponent(ident.identityId)}`);
    res.json({ ok: true });
  }));

  // ---- Year in review (aggregate the caller's annual participation) ----
  app.get('/api/me/year-review', asyncHandler(async (req, res) => {
    const ident = await resolveIdentity(req);
    if (!ident) return res.status(401).json({ error: 'identity_required' });
    const uid = ident.identityId;
    const year = Number(req.query.year) || new Date().getFullYear();
    const start = `${year}-01-01`;
    const end = `${year + 1}-01-01`; // exclusive upper bound (lt)

    const [noms, votes, watches, favs, rsvps] = await Promise.all([
      pgGet(`/nomination_pool?nominee_identity_id=eq.${encodeURIComponent(uid)}&created_at=gte.${start}&created_at=lt.${end}&select=id,title,image,planned,status`),
      pgGet(`/votes?voter_id=eq.${encodeURIComponent(uid)}&created_at=gte.${start}&created_at=lt.${end}&select=round_id,option_id`),
      pgGet(`/watch_log?uid=eq.${encodeURIComponent(uid)}&watched_at=gte.${start}&watched_at=lt.${end}&select=film_id,rating,review`),
      pgGet(`/favorites?uid=eq.${encodeURIComponent(uid)}&select=film_id`),
      pgGet(`/rsvps?uid=eq.${encodeURIComponent(uid)}&created_at=gte.${start}&created_at=lt.${end}&select=screening_id`),
    ]);

    const watchIds = (watches || []).map((w) => w.film_id).filter(Boolean);
    const films = watchIds.length
      ? await pgGet(`/films?id=in.(${watchIds.map(encodeURIComponent).join(',')})&select=id,title,title_zh,title_en,image,year`)
      : [];
    const filmMap = new Map((films || []).map((f) => [f.id, f]));

    const nominatedFilms = (noms || []).map((n) => ({ title: n.title, image: n.image || '', planned: Boolean(n.planned), status: n.status }));
    const watchedFilms = (watches || []).map((w) => {
      const f = filmMap.get(w.film_id);
      return { title: f ? (f.title_zh || f.title_en || f.title) : w.film_id, image: f?.image || '', rating: w.rating || 0 };
    });
    const avgRating = watchedFilms.length
      ? Math.round((watchedFilms.reduce((s, w) => s + w.rating, 0) / watchedFilms.length) * 10) / 10
      : 0;
    const rounds = new Set((votes || []).map((v) => v.round_id)).size;

    res.json({
      year,
      nominations: nominatedFilms.length,
      nominatedFilms,
      votes: (votes || []).length,
      rounds,
      watches: watchedFilms.length,
      avgRating,
      watchedFilms,
      favorites: (favs || []).length,
      rsvps: (rsvps || []).length,
      persona: personaFor(nominatedFilms.length, (votes || []).length, watchedFilms.length),
    });
  }));

  // ---- Goods (merchandise) public read ----
  app.get('/api/goods', asyncHandler(async (_req, res) => {
    const cached = contentCache.get('goods');
    if (cached) return res.json(cached);
    const rows = await pgGet('/goods?select=*&order=sort_order.asc');
    contentCache.set('goods', rows ?? []);
    res.json(rows ?? []);
  }));
}
