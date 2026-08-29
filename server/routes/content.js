import { asyncHandler } from '../lib/middleware.js';
import { ENV_ID, dbEnabled } from '../lib/config.js';
import { getAdminToken, pgGet, pgGetPage, pgWrite, contentCache } from '../lib/db.js';
import { resolveIdentity } from '../lib/identity.js';
import { allowRate, clientIp } from '../auth.js';
import {
  shanghaiDateString,
  featuredIdsFromScreenings,
  assembleFeatured,
  filmsByIdPath,
  filmListPath,
  stampIsNew,
  displayScreeningTitle,
  screeningRoundStatus,
  assembleUpcomingNights,
  FILM_CARD_COLUMNS,
} from '../lib/catalog.js';
import { assembleChannel } from '../lib/channel.js';
import { assembleSocialLinks } from '../lib/socialLinks.js';
import { homepageNews } from '../lib/newsFeed.js';

/**
 * Public content + screening participation: health, films, news, screenings, rsvp.
 */
function presentScreening(row, today) {
  return {
    ...row,
    title: displayScreeningTitle(row) || row.title,
    round_status: screeningRoundStatus(row.screen_date, today),
  };
}

export function contentRoutes(app) {

  app.get('/api/health', async (_req, res) => {
    let db = 'ok';
    if (!dbEnabled) db = 'disabled';
    else { try { await getAdminToken(); } catch { db = 'degraded'; } }
    res.json({ ok: true, env: ENV_ID, db, time: new Date().toISOString() });
  });

  app.get('/api/films/featured', asyncHandler(async (_req, res) => {
    const screenings = await pgGet('/screenings?select=screen_date,film_ids');
    const ranked = featuredIdsFromScreenings(screenings ?? [], shanghaiDateString());
    const path = filmsByIdPath(ranked.map((r) => r.id));
    if (!path) return res.json([]);
    const films = await pgGet(path);
    const byId = new Map((films ?? []).map((f) => [f.id, f]));
    res.json(assembleFeatured(byId, ranked));
  }));

  app.get('/api/films', asyncHandler(async (req, res) => {
    const hasPage = req.query.limit != null || req.query.q || req.query.category || req.query.sort;
    if (!hasPage) {
      const cached = contentCache.get('films');
      if (cached) return res.json(cached);
      const rows = await pgGet('/films?select=*&order=sort_order.asc');
      contentCache.set('films', rows ?? []);
      return res.json(rows ?? []);
    }

    const q = String(req.query.q || '');
    const category = String(req.query.category || 'all');
    const sort = String(req.query.sort || 'screened_desc');
    const limit = Math.min(48, Math.max(1, Number(req.query.limit) || 24));
    const offset = Math.max(0, Number(req.query.offset) || 0);

    const page = await pgGetPage(filmListPath({ q, category, sort }), offset, limit);
    const screenings = await pgGet('/screenings?select=screen_date,film_ids');
    const newIds = featuredIdsFromScreenings(screenings ?? [], shanghaiDateString())
      .slice(0, 2)
      .map((r) => r.id);
    res.json({
      items: stampIsNew(page.rows, newIds),
      total: page.total,
      offset: page.offset,
      limit: page.limit,
    });
  }));

  app.get('/api/films/:id', asyncHandler(async (req, res) => {
    const rows = await pgGet(`/films?select=*&id=eq.${encodeURIComponent(req.params.id)}`);
    const film = rows[0] ?? null;
    if (!film) return res.json(null);
    const screenings = await pgGet('/screenings?select=screen_date,film_ids');
    const newIds = featuredIdsFromScreenings(screenings ?? [], shanghaiDateString())
      .slice(0, 2)
      .map((r) => r.id);
    res.json(stampIsNew([film], newIds)[0]);
  }));

  app.get('/api/news', asyncHandler(async (_req, res) => {
    const cached = contentCache.get('news');
    if (cached) return res.json(cached);
    const rows = await pgGet('/news?select=*&order=sort_order.asc');
    const visible = homepageNews(rows ?? []);
    contentCache.set('news', visible);
    res.json(visible);
  }));

  // ---- Screenings (archive): one night = one round; title/status derived from date ----
  app.get('/api/screenings/upcoming', asyncHandler(async (_req, res) => {
    const today = shanghaiDateString();
    const rows = await pgGet('/screenings?select=id,title,screen_date,film_ids,venue,theme&order=screen_date.asc');
    const ids = [];
    const seen = new Set();
    for (const row of rows ?? []) {
      const status = screeningRoundStatus(row.screen_date, today);
      if (status !== 'tonight' && status !== 'upcoming') continue;
      for (const raw of row.film_ids || []) {
        const id = String(raw || '').trim();
        if (!id || seen.has(id)) continue;
        seen.add(id);
        ids.push(id);
      }
    }
    const path = filmsByIdPath(ids, FILM_CARD_COLUMNS);
    const films = path ? await pgGet(path) : [];
    res.json(assembleUpcomingNights({ screenings: rows, films: films ?? [], today }));
  }));

  app.get('/api/screenings', asyncHandler(async (_req, res) => {
    const rows = await pgGet('/screenings?select=*&order=screen_date.desc');
    const today = shanghaiDateString();
    res.json((rows ?? []).map((r) => presentScreening(r, today)));
  }));

  app.get('/api/screenings/:id', asyncHandler(async (req, res) => {
    const rows = await pgGet(`/screenings?id=eq.${encodeURIComponent(req.params.id)}&select=*`);
    const s = rows?.[0];
    if (!s) return res.status(404).json({ error: 'not_found' });
    const ids = (s.film_ids || []).filter(Boolean);
    const films = ids.length
      ? await pgGet(`/films?id=in.(${ids.map(encodeURIComponent).join(',')})&select=id,title,title_zh,title_en,year,category,image`)
      : [];
    res.json({ ...presentScreening(s, shanghaiDateString()), films: films ?? [] });
  }));

  app.get('/api/channel', asyncHandler(async (_req, res) => {
    const cached = contentCache.get('channel');
    if (cached) return res.json(cached);
    const [settings, videos] = await Promise.all([
      pgGet('/channel_settings?id=eq.home&select=*'),
      pgGet('/channel_videos?select=*&order=sort_order.asc'),
    ]);
    const body = assembleChannel(settings?.[0], videos);
    contentCache.set('channel', body);
    res.json(body);
  }));

  app.get('/api/social-links', asyncHandler(async (_req, res) => {
    const cached = contentCache.get('social');
    if (cached) return res.json(cached);
    const rows = await pgGet('/social_links?select=id,name,url,desc_zh,desc_en,desc_ja,sort_order&order=sort_order.asc');
    const body = assembleSocialLinks(rows);
    contentCache.set('social', body);
    res.json(body);
  }));

  // ---- Participation (rsvp) ----
  app.get('/api/rsvp/:screeningId', asyncHandler(async (req, res) => {
    const ident = await resolveIdentity(req);
    const rows = await pgGet(`/rsvps?screening_id=eq.${encodeURIComponent(req.params.screeningId)}&select=uid`);
    const list = rows ?? [];
    const rsvped = ident ? list.some((r) => r.uid === ident.identityId) : false;
    res.json({ rsvped, count: list.length });
  }));

  app.post('/api/rsvp/:screeningId', asyncHandler(async (req, res) => {
    const ident = await resolveIdentity(req);
    if (!ident) return res.status(401).json({ error: 'identity_required' });
    if (!allowRate(`rsvp:${clientIp(req)}`, 20, 60_000)) return res.status(429).json({ error: 'rate_limited' });
    const sid = req.params.screeningId;
    const scr = await pgGet(`/screenings?id=eq.${encodeURIComponent(sid)}&select=id`);
    if (!scr?.length) return res.status(404).json({ error: 'screening_not_found' });
    const [status] = await pgWrite('POST', '/rsvps', { screening_id: sid, uid: ident.identityId });
    if (status === 409) return res.json({ ok: true }); // already participating
    if (status >= 400) return res.status(502).json({ error: 'rsvp_failed' });
    res.json({ ok: true });
  }));

  app.delete('/api/rsvp/:screeningId', asyncHandler(async (req, res) => {
    const ident = await resolveIdentity(req);
    if (!ident) return res.status(401).json({ error: 'identity_required' });
    if (!allowRate(`rsvp:${clientIp(req)}`, 20, 60_000)) return res.status(429).json({ error: 'rate_limited' });
    await pgWrite('DELETE', `/rsvps?screening_id=eq.${encodeURIComponent(req.params.screeningId)}&uid=eq.${encodeURIComponent(ident.identityId)}`);
    res.json({ ok: true });
  }));
}
