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

export const FILM_CARD_COLUMNS =
  'id,title,title_zh,title_en,year,category,image,landscape_image,director,screening_date,screening_status';

/** Rank past club nights to at most 12 ids — no film table required. */
export function featuredIdsFromScreenings(screenings, today) {
  const index = clubIndexByFilm(screenings);
  const ranked = [];
  for (const [id, rec] of index) {
    const past = latestPastClubDate(rec.dates, today);
    if (!past) continue;
    ranked.push({
      id,
      past,
      nightOrder: rec.order.get(past) ?? 0,
    });
  }
  ranked.sort((a, b) => {
    if (a.past !== b.past) return a.past < b.past ? 1 : -1;
    return a.nightOrder - b.nightOrder;
  });
  return ranked.slice(0, 12);
}

export function assembleFeatured(filmsById, ranked) {
  const cards = [];
  for (const row of ranked || []) {
    const film = filmsById instanceof Map ? filmsById.get(row.id) : filmsById?.[row.id];
    if (!film) continue;
    cards.push({
      ...film,
      isNew: cards.length < 2,
      screeningDate: row.past,
    });
  }
  return cards;
}

export function rankFeatured(films, screenings, today) {
  const ranked = featuredIdsFromScreenings(screenings, today);
  const byId = new Map((films || []).map((f) => [f.id, f]));
  return assembleFeatured(byId, ranked);
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

function ilikeTerm(q) {
  return String(q || '')
    .replace(/[%*,()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function ilikeOr(fields, term) {
  return `or=(${fields.map((f) => `${f}.ilike.*${term}*`).join(',')})`;
}

export function filmListPath({ q = '', category = 'all', sort = 'screened_desc', select = FILM_CARD_COLUMNS } = {}) {
  const parts = [`select=${select}`];
  const term = ilikeTerm(q);
  const cat = String(category || 'all').toLowerCase();
  const qFilter = term
    ? ilikeOr(['title', 'title_zh', 'title_en', 'director', 'year'], term)
    : '';
  let catFilter = '';
  if (cat === 'tv' || cat === 'movie') catFilter = `category.ilike.*${cat}*`;
  else if (cat === 'original') catFilter = 'or=(category.ilike.*original*,category.ilike.*netflix*)';

  if (qFilter && catFilter) parts.push(`and=(${qFilter},${catFilter})`);
  else if (qFilter) parts.push(qFilter);
  else if (catFilter) parts.push(catFilter);

  if (sort === 'year_asc') parts.push('order=year.asc.nullslast');
  else if (sort === 'year_desc') parts.push('order=year.desc.nullslast');
  else parts.push('order=screening_date.desc.nullslast,year.desc.nullslast');
  return `/films?${parts.join('&')}`;
}

export function filmsByIdPath(ids, select = FILM_CARD_COLUMNS) {
  const clean = [...new Set((ids || []).filter(Boolean).map((id) => String(id)))];
  if (!clean.length) return null;
  return `/films?select=${select}&id=in.(${clean.map(encodeURIComponent).join(',')})`;
}

export function parseContentRangeTotal(header) {
  if (!header) return null;
  const m = String(header).trim().match(/\/(\d+|\*)\s*$/);
  if (!m || m[1] === '*') return null;
  return Number(m[1]);
}

export function rangeHeader(offset, limit) {
  const off = Math.max(0, Number(offset) || 0);
  const lim = Math.max(1, Number(limit) || 24);
  return { Range: `${off}-${off + lim - 1}` };
}

export function stampIsNew(cards, newIds) {
  const set = new Set(newIds || []);
  return (cards || []).map((c) => ({ ...c, isNew: set.has(c.id) }));
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
      title: screeningAutoTitle(day) || day,
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

/** One screening night = one round. Status is derived from the calendar date. */
export function screeningRoundStatus(screenDate, today) {
  const day = String(screenDate || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return 'unscheduled';
  const t = String(today || '').slice(0, 10);
  if (day < t) return 'screened';
  if (day === t) return 'tonight';
  return 'upcoming';
}

export function screeningAutoTitle(screenDate) {
  const day = String(screenDate || '').slice(0, 10);
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(day);
  if (!m) return '';
  return `${m[1]}年${Number(m[2])}月${Number(m[3])}日放映`;
}

function isGenericRoundTitle(title, screenDate) {
  const t = String(title || '').trim();
  if (!t) return true;
  if (/社区选片|投票轮次/.test(t)) return true;
  const day = String(screenDate || '').slice(0, 10);
  return Boolean(day) && t === day;
}

/** Keep a custom nickname; otherwise show the date-derived round label. */
export function displayScreeningTitle(row) {
  const date = String(row?.screen_date || '').slice(0, 10);
  const title = String(row?.title || '').trim();
  if (!isGenericRoundTitle(title, date)) return title;
  return screeningAutoTitle(date);
}
