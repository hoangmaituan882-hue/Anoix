/**
 * TMDB proxy endpoints — server-side TMDB calls with a configurable base URL.
 *
 * The TMDB API domain (api.themoviedb.org) is blocked from mainland servers,
 * so TMDB_API_BASE_URL can be pointed at a reachable mirror/reverse proxy;
 * the image domain stays configurable too (though image.tmdb.org is reachable).
 * The API key lives only here — never shipped to the browser.
 */
import express from 'express';

const TMDB_API_BASE_URL = (process.env.TMDB_API_BASE_URL || 'https://api.themoviedb.org/3').replace(/\/$/, '');
const TMDB_IMAGE_BASE_URL = (process.env.TMDB_IMAGE_BASE_URL || 'https://image.tmdb.org/t/p').replace(/\/$/, '');
const TMDB_API_KEY = process.env.TMDB_API_KEY || '';

const SEARCH_MEDIA = ['movie', 'tv', 'multi'];

function tmdbFetch(path) {
  if (!TMDB_API_KEY) {
    const err = new Error('TMDB_API_KEY not configured');
    err.status = 503;
    throw err;
  }
  const sep = path.includes('?') ? '&' : '?';
  const url = `${TMDB_API_BASE_URL}${path}${sep}api_key=${TMDB_API_KEY}&language=zh-CN`;
  return fetch(url, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(12000),
  });
}

function posterUrl(posterPath) {
  return posterPath ? `${TMDB_IMAGE_BASE_URL}/w500${posterPath}` : null;
}

function mapSearchItem(m, mediaType) {
  return {
    tmdbId: m.id,
    mediaType,
    title: m.title || m.name || '',
    originalTitle: m.original_title || m.original_name || '',
    year: (m.release_date || m.first_air_date || '').slice(0, 4),
    overview: m.overview || '',
    posterUrl: posterUrl(m.poster_path),
    rating: m.vote_average ? Math.round(m.vote_average * 10) / 10 : null,
  };
}

export const tmdbRouter = express.Router();

// GET /api/tmdb/search?q=&media_type=movie|tv|multi (mounted behind adminGate)
tmdbRouter.get('/search', async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    const mediaType = String(req.query.media_type || 'movie');
    if (!q) return res.json({ results: [] });
    if (!SEARCH_MEDIA.includes(mediaType)) return res.status(400).json({ error: 'bad_media_type' });

    let results = [];
    if (mediaType === 'movie' || mediaType === 'multi') {
      const r = await tmdbFetch(`/search/movie?query=${encodeURIComponent(q)}`);
      if (r.ok) {
        const data = await r.json();
        results = results.concat((data.results || []).map((m) => mapSearchItem(m, 'movie')));
      }
    }
    if (mediaType === 'tv' || mediaType === 'multi') {
      const r = await tmdbFetch(`/search/tv?query=${encodeURIComponent(q)}`);
      if (r.ok) {
        const data = await r.json();
        results = results.concat((data.results || []).map((m) => mapSearchItem(m, 'tv')));
      }
    }
    results.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    res.json({ results: results.slice(0, 10) });
  } catch (e) {
    next(e);
  }
});

// GET /api/tmdb/detail/:id?media_type=movie|tv (mounted behind adminGate)
tmdbRouter.get('/detail/:id', async (req, res, next) => {
  try {
    const id = req.params.id;
    const mediaType = String(req.query.media_type || 'movie');
    if (mediaType !== 'movie' && mediaType !== 'tv') return res.status(400).json({ error: 'bad_media_type' });

    const r = await tmdbFetch(`/${mediaType}/${id}?append_to_response=credits`);
    if (!r.ok) {
      const err = new Error(`TMDB detail ${r.status}`);
      err.status = r.status === 404 ? 404 : 502;
      throw err;
    }
    const d = await r.json();
    const crew = d.credits?.crew || [];
    const director = crew.find((c) => c.job === 'Director')?.name;
    res.json({
      tmdbId: d.id,
      mediaType,
      title: d.title || d.name || '',
      originalTitle: d.original_title || d.original_name || '',
      year: (d.release_date || d.first_air_date || '').slice(0, 4),
      overview: d.overview || '',
      tagline: d.tagline || '',
      posterUrl: posterUrl(d.poster_path),
      rating: d.vote_average ? Math.round(d.vote_average * 10) / 10 : null,
      director,
    });
  } catch (e) {
    next(e);
  }
});
