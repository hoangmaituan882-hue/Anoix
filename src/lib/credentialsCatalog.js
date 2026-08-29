/**
 * Credentials coverflow: resolve watches against live catalog rows by id.
 */

const FALLBACK_IMAGE = '/assets/riffle/image-005.webp';

export function uniqueFilmIds(watches) {
  const ids = [];
  const seen = new Set();
  for (const w of watches || []) {
    const id = w?.film_id ? String(w.film_id) : '';
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
  }
  return ids;
}

function displayTitle(film, lang) {
  if (!film) return '';
  if (lang === 'zh') return film.titleZh || film.title || '';
  if (lang === 'en') return film.titleEn || film.title || '';
  return film.title || film.titleZh || '';
}

function filmImage(film) {
  return film?.landscapeImage || film?.image || '';
}

export function buildCoverflowSlides({
  watches = [],
  films = [],
  library = [],
  lang = 'zh',
  limit = 5,
} = {}) {
  const cap = Math.max(1, Number(limit) || 5);
  const byId = new Map((films || []).filter((f) => f?.id).map((f) => [f.id, f]));
  const slides = [];
  const used = new Set();

  for (const w of watches || []) {
    if (slides.length >= cap) break;
    const filmId = w?.film_id ? String(w.film_id) : '';
    if (!filmId) continue;
    const film = byId.get(filmId);
    slides.push({
      id: `watch-${w.id || filmId}`,
      filmId,
      title: displayTitle(film, lang) || w.film_title || '已看佳作',
      author: `★ ${w.rating || 5}.0 · 个人已看履历`,
      image: filmImage(film) || w.image || FALLBACK_IMAGE,
      videoUrl: film?.trailerUrl || undefined,
      isWatched: true,
    });
    used.add(filmId);
  }

  for (const film of library || []) {
    if (slides.length >= cap) break;
    if (!film?.id || used.has(film.id)) continue;
    slides.push({
      id: `work-${film.id}`,
      filmId: film.id,
      title: displayTitle(film, lang) || film.title,
      author: film.director
        ? `${film.director} · ${film.year || ''}`.trim()
        : `${film.year || ''} · Studio TRIGGER`.trim(),
      image: filmImage(film) || FALLBACK_IMAGE,
      videoUrl: film.trailerUrl || undefined,
      isWatched: false,
    });
    used.add(film.id);
  }

  return slides;
}
