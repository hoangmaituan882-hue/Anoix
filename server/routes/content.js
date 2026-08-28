import { asyncHandler } from '../lib/middleware.js';
import { ENV_ID, dbEnabled } from '../lib/config.js';
import { getAdminToken, pgGet, pgWrite, contentCache } from '../lib/db.js';
import { resolveIdentity } from '../lib/identity.js';
import { allowRate, clientIp } from '../auth.js';

/**
 * Public content + screening participation: health, films, news, screenings, rsvp.
 */
export function contentRoutes(app) {

  app.get('/api/health', async (_req, res) => {
    let db = 'ok';
    if (!dbEnabled) db = 'disabled';
    else { try { await getAdminToken(); } catch { db = 'degraded'; } }
    res.json({ ok: true, env: ENV_ID, db, time: new Date().toISOString() });
  });

  app.get('/api/films', asyncHandler(async (_req, res) => {
    const cached = contentCache.get('films');
    if (cached) return res.json(cached);
    const rows = await pgGet('/films?select=*&order=sort_order.asc');
    contentCache.set('films', rows ?? []);
    res.json(rows ?? []);
  }));

  app.get('/api/films/:id', asyncHandler(async (req, res) => {
    const rows = await pgGet(`/films?select=*&id=eq.${encodeURIComponent(req.params.id)}`);
    res.json(rows[0] ?? null);
  }));

  app.get('/api/news', asyncHandler(async (_req, res) => {
    const cached = contentCache.get('news');
    if (cached) return res.json(cached);
    const rows = await pgGet('/news?select=*&order=sort_order.asc');
    // Publish control: only show items that are published (or scheduled whose
    // time has arrived); pinned items float to the top. Lazy scheduling — no
    // cron needed, the time comparison does the job.
    const now = Date.now();
    const visible = (rows ?? [])
      .filter((r) => {
        if (r.status === 'draft' || r.status === 'archived') return false;
        if (!r.published_at) return r.status === 'published';
        return new Date(r.published_at).getTime() <= now;
      })
      .sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    contentCache.set('news', visible);
    res.json(visible);
  }));

  // ---- Screenings (archive) ----
  app.get('/api/screenings', asyncHandler(async (_req, res) => {
    const rows = await pgGet('/screenings?select=*&order=screen_date.desc');
    res.json(rows);
  }));

  app.get('/api/screenings/:id', asyncHandler(async (req, res) => {
    const rows = await pgGet(`/screenings?id=eq.${encodeURIComponent(req.params.id)}&select=*`);
    const s = rows?.[0];
    if (!s) return res.status(404).json({ error: 'not_found' });
    const ids = (s.film_ids || []).filter(Boolean);
    const films = ids.length
      ? await pgGet(`/films?id=in.(${ids.map(encodeURIComponent).join(',')})&select=id,title,title_zh,title_en,year,category,image`)
      : [];
    res.json({ ...s, films: films ?? [] });
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
