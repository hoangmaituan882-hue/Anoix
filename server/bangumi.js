/**
 * Bangumi (bgm.tv) proxy endpoints — server-side scraping for anime/subject data.
 * Uses the anibt.net reverse proxies (mainland-reachable); the API base and
 * image host are configurable via env for a different mirror.
 */
import express from 'express';

const BANGUMI_API_BASE_URL = (process.env.BANGUMI_API_BASE_URL || 'https://bgmapi.anibt.net').replace(/\/$/, '');
const BANGUMI_IMAGE_BASE_URL = (process.env.BANGUMI_IMAGE_BASE_URL || 'https://bgmimg.anibt.net').replace(/\/$/, '');

// Bangumi requires a non-empty User-Agent.
function bangumiFetch(path, init = {}) {
  return fetch(`${BANGUMI_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'User-Agent': 'anoix/1.0 (screening archive)',
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  });
}

/** Rewrite any bgm image host → the configured image proxy. */
function imageUrl(u) {
  if (!u) return null;
  return u.replace(/^https?:\/\/[^/]+/, BANGUMI_IMAGE_BASE_URL);
}

function mapSubject(m) {
  return {
    bgmId: m.id,
    title: m.name_cn || m.name || '',
    originalTitle: m.name || '',
    year: (m.date || '').slice(0, 4),
    posterUrl: imageUrl(m.images?.large || m.images?.common || null),
    rating: m.rating?.score != null ? Math.round(m.rating.score * 10) / 10 : null,
    summary: m.summary || '',
  };
}

export const bangumiRouter = express.Router();

// GET /api/bangumi/search?q=  (mounted behind bangumiGate)
// type: 2 = anime, 6 = real (live-action), 1 = book — search both anime + film.
bangumiRouter.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (!q) return res.json({ results: [] });
    const r = await bangumiFetch('/v0/search/subjects', {
      method: 'POST',
      body: JSON.stringify({ keyword: q, filter: { type: [2, 6] } }),
      signal: AbortSignal.timeout(12000),
    });
    if (!r.ok) return res.json({ results: [] });
    const data = await r.json();
    res.json({ results: (data.data || []).slice(0, 10).map(mapSubject) });
  } catch (e) { next(e); }
});

// GET /api/bangumi/detail/:id
bangumiRouter.get('/detail/:id', async (req, res, next) => {
  try {
    const r = await bangumiFetch(`/v0/subjects/${req.params.id}`, { signal: AbortSignal.timeout(12000) });
    if (!r.ok) {
      const err = new Error(`Bangumi detail ${r.status}`);
      err.status = r.status === 404 ? 404 : 502;
      throw err;
    }
    const d = await r.json();
    res.json({ ...mapSubject(d), tags: (d.tags || []).map((t) => t.name) });
  } catch (e) { next(e); }
});