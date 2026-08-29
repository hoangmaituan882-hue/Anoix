/**
 * Catalog ranking / search / weekly-vote helpers (no I/O).
 * Club screening dates only — never theatrical release_date.
 */

/** Asia/Shanghai calendar date as YYYY-MM-DD. */
export function shanghaiDateString(now = Date.now()) {
  const sh = new Date(now + 8 * 3600 * 1000);
  return new Date(Date.UTC(sh.getUTCFullYear(), sh.getUTCMonth(), sh.getUTCDate()))
    .toISOString()
    .slice(0, 10);
}

export function latestPastClubDate(dates, today) {
  let best = null;
  for (const raw of dates || []) {
    const day = String(raw || '').slice(0, 10);
    if (day.length < 10) continue;
    if (day <= today && (!best || day > best)) best = day;
  }
  return best;
}

/** open | frozen (future night only) | screened (any past night). */
export function filmVoteGate(dates, today) {
  let past = false;
  let future = false;
  for (const raw of dates || []) {
    const day = String(raw || '').slice(0, 10);
    if (day.length < 10) continue;
    if (day <= today) past = true;
    else future = true;
  }
  if (past) return 'screened';
  if (future) return 'frozen';
  return 'open';
}

export function clubIndexByFilm(screenings) {
  const map = new Map();
  for (const s of screenings || []) {
    const day = String(s.screen_date || '').slice(0, 10);
    if (!day) continue;
    const ids = Array.isArray(s.film_ids) ? s.film_ids : [];
    ids.forEach((id, idx) => {
      if (!id) return;
      let rec = map.get(id);
      if (!rec) {
        rec = { dates: [], order: new Map() };
        map.set(id, rec);
      }
      rec.dates.push(day);
      if (!rec.order.has(day) || idx < rec.order.get(day)) rec.order.set(day, idx);
    });
  }
  return map;
}

export function rankFeatured(films, screenings, today) {
  const index = clubIndexByFilm(screenings);
  const ranked = [];
  for (const film of films || []) {
    const rec = index.get(film.id);
    if (!rec) continue;
    const past = latestPastClubDate(rec.dates, today);
    if (!past) continue;
    ranked.push({
      film,
      past,
      nightOrder: rec.order.get(past) ?? 0,
    });
  }
  ranked.sort((a, b) => {
    if (a.past !== b.past) return a.past < b.past ? 1 : -1;
    return a.nightOrder - b.nightOrder;
  });
  return ranked.slice(0, 12).map((row, i) => ({
    ...row.film,
    isNew: i < 2,
    screeningDate: row.past,
  }));
}

export function yearNum(str) {
  const m = String(str || '').match(/\d{4}/);
  return m ? parseInt(m[0], 10) : 0;
}

export function sortScreenedDesc(films, latestById) {
  return [...(films || [])].sort((a, b) => {
    const da = latestById[a.id] || null;
    const db = latestById[b.id] || null;
    if (da && db && da !== db) return da < db ? 1 : -1;
    if (da && !db) return -1;
    if (!da && db) return 1;
    return yearNum(b.year) - yearNum(a.year);
  });
}

export function matchFilmQuery(film, q) {
  const s = String(q || '').trim().toLowerCase();
  if (!s) return true;
  const fields = [
    film.title,
    film.title_zh,
    film.titleZh,
    film.title_en,
    film.titleEn,
    film.director,
    film.year,
  ];
  return fields.some((v) => v && String(v).toLowerCase().includes(s));
}

export function matchFilmCategory(film, category) {
  const cat = String(category || 'all').toLowerCase();
  if (!cat || cat === 'all') return true;
  const raw = String(film.category || '').toLowerCase();
  if (cat === 'tv') return raw.includes('tv');
  if (cat === 'movie') return raw.includes('movie');
  if (cat === 'original') return raw.includes('original') || raw.includes('netflix');
  return raw.includes(cat);
}

export function paginate(items, offset, limit) {
  const list = items || [];
  const off = Math.max(0, Number(offset) || 0);
  const lim = Math.max(1, Number(limit) || 24);
  return {
    items: list.slice(off, off + lim),
    total: list.length,
    offset: off,
    limit: lim,
  };
}

export function clampAddVotes(requested, remaining) {
  const rem = Number(remaining) || 0;
  if (rem < 1) return { ok: false, error: 'quota_exceeded' };
  const n = requested === undefined || requested === null ? 1 : requested;
  if (!Number.isInteger(n) || n < 1) return { ok: false, error: 'bad_request' };
  return { ok: true, count: Math.min(n, rem) };
}

function cloneScreenings(screenings) {
  return (screenings || []).map((s) => ({ ...s, film_ids: [...(s.film_ids || [])] }));
}

function dayOf(s) {
  return String(s.screen_date || '').slice(0, 10);
}

/** Add a film to a calendar night (creates the night if missing). Does not remove other dates. */
export function placeFilmOnNight(screenings, filmId, date, insertIndex) {
  const day = String(date || '').slice(0, 10);
  const next = cloneScreenings(screenings);
  let night = next.find((s) => dayOf(s) === day);
  if (!night) {
    night = {
      id: `night-${day}`,
      title: day,
      screen_date: day,
      venue: null,
      theme: null,
      recap: null,
      film_ids: [],
    };
    next.push(night);
  }
  const ids = night.film_ids.filter((id) => id !== filmId);
  const idx = insertIndex == null ? ids.length : Math.max(0, Math.min(ids.length, Number(insertIndex) || 0));
  ids.splice(idx, 0, filmId);
  night.film_ids = ids;
  return next;
}

/** Move one occurrence from fromDate (optional) onto toDate. */
export function moveFilmBetweenNights(screenings, filmId, fromDate, toDate, insertIndex) {
  let next = cloneScreenings(screenings);
  const from = fromDate ? String(fromDate).slice(0, 10) : '';
  if (from) {
    next = next.map((s) => {
      if (dayOf(s) !== from) return s;
      return { ...s, film_ids: (s.film_ids || []).filter((id) => id !== filmId) };
    });
  }
  return placeFilmOnNight(next, filmId, toDate, insertIndex);
}

export function reorderNight(screenings, date, orderedIds) {
  const day = String(date || '').slice(0, 10);
  const next = cloneScreenings(screenings);
  const night = next.find((s) => dayOf(s) === day);
  if (!night) return next;
  night.film_ids = [...(orderedIds || [])];
  return next;
}

/** Denormalize films.screening_date (latest past only) + screening_status. */
export function filmScheduleFields(dates, today) {
  const gate = filmVoteGate(dates, today);
  return {
    screening_date: latestPastClubDate(dates, today),
    screening_status: gate === 'screened' ? 'screened' : gate === 'frozen' ? 'scheduled' : 'unscheduled',
  };
}
