/**
 * Per-user club stats: unique past-night films (first screening date wins),
 * watch_log intersection, nomination-pool unique ids, week-vote SUM(count).
 */

import { clubIndexByFilm, filmVoteGate } from './catalog.js';

function filmMinutes(raw) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function minutesToHours(minutes) {
  return Math.round((Number(minutes) || 0) / 6) / 10;
}

/**
 * First past club date per film. Tonight and future nights are ignored.
 * `today` is YYYY-MM-DD in Asia/Shanghai.
 */
export function firstScreenedByFilm(screenings, today) {
  const nights = [];
  for (const row of screenings || []) {
    const date = String(row?.screen_date || '').slice(0, 10);
    if (date.length < 10 || date >= today) continue;
    nights.push({ date, ids: Array.isArray(row.film_ids) ? row.film_ids : [] });
  }
  nights.sort((a, b) => a.date.localeCompare(b.date));
  const first = new Map();
  for (const night of nights) {
    for (const raw of night.ids) {
      const id = String(raw || '').trim();
      if (!id || first.has(id)) continue;
      first.set(id, night.date);
    }
  }
  return first;
}

export function assembleMeStats({
  today,
  screenings = [],
  films = [],
  watchIds = [],
  poolFilmIds = [],
  weekVotes = [],
} = {}) {
  const first = firstScreenedByFilm(screenings, today);
  const durationById = new Map();
  for (const f of films || []) {
    if (f?.id) durationById.set(String(f.id), filmMinutes(f.duration));
  }
  const watchedSet = new Set((watchIds || []).map((id) => String(id || '').trim()).filter(Boolean));

  let watchedMinutes = 0;
  let unwatchedMinutes = 0;
  let watchedCount = 0;
  let unwatchedCount = 0;
  const monthMap = new Map();

  for (const [id, date] of first) {
    const mins = durationById.get(id) ?? 0;
    const ym = date.slice(0, 7);
    const bucket = monthMap.get(ym) || { yearMonth: ym, minutes: 0, filmCount: 0 };
    bucket.minutes += mins;
    bucket.filmCount += 1;
    monthMap.set(ym, bucket);
    if (watchedSet.has(id)) {
      watchedMinutes += mins;
      watchedCount += 1;
    } else {
      unwatchedMinutes += mins;
      unwatchedCount += 1;
    }
  }

  const monthly = [...monthMap.values()].sort((a, b) => a.yearMonth.localeCompare(b.yearMonth));
  const nomSet = new Set();
  for (const raw of poolFilmIds || []) {
    const id = String(raw || '').trim();
    if (id) nomSet.add(id);
  }
  let votes = 0;
  for (const row of weekVotes || []) {
    const n = Number(row?.count);
    if (Number.isFinite(n) && n > 0) votes += n;
  }

  return {
    watchedMinutes,
    unwatchedMinutes,
    totalScreenedMinutes: watchedMinutes + unwatchedMinutes,
    watchedCount,
    unwatchedCount,
    totalScreenedCount: first.size,
    nominations: nomSet.size,
    votes,
    monthly,
  };
}

function filmLabel(film, fallback) {
  if (film) return String(film.title_zh || film.title_en || film.title || fallback || '');
  return String(fallback || '');
}

/**
 * Profile / drawer activity: nomination_pool rows + lifetime film_week_votes.
 * Does not read the old round `votes` / `nomination_options` tables.
 */
export function assembleMeActivity({
  today,
  pool = [],
  weekVotes = [],
  films = [],
  screenings = [],
} = {}) {
  const filmMap = new Map((films || []).filter((f) => f?.id).map((f) => [String(f.id), f]));
  const index = clubIndexByFilm(screenings);
  const plannedByFilm = new Set();
  for (const p of pool || []) {
    const id = String(p?.film_id || '').trim();
    if (id && p.planned) plannedByFilm.add(id);
  }

  const nominations = (pool || []).map((p) => {
    const filmId = String(p?.film_id || '').trim();
    const film = filmId ? filmMap.get(filmId) : null;
    return {
      id: p.id,
      filmId: filmId || String(p?.tmdb_id || ''),
      filmTitle: filmLabel(film, p?.title),
      image: String(film?.image || p?.image || ''),
      note: String(p?.note || ''),
      planned: Boolean(p?.planned),
      status: String(p?.status || 'pending'),
      source: String(p?.source || 'user'),
      createdAt: p?.created_at || '',
    };
  });
  nominations.sort((a, b) => {
    const ta = String(a.createdAt || '');
    const tb = String(b.createdAt || '');
    if (ta !== tb) return ta < tb ? 1 : -1;
    return String(b.id).localeCompare(String(a.id));
  });

  const voteMap = new Map();
  for (const row of weekVotes || []) {
    const filmId = String(row?.film_id || '').trim();
    const n = Number(row?.count);
    if (!filmId || !Number.isFinite(n) || n <= 0) continue;
    const cur = voteMap.get(filmId) || { filmId, count: 0, weeks: 0, lastWeek: '' };
    cur.count += n;
    cur.weeks += 1;
    const ws = String(row?.week_start || '');
    if (ws > cur.lastWeek) cur.lastWeek = ws;
    voteMap.set(filmId, cur);
  }

  const votes = [...voteMap.values()].map((v) => {
    const film = filmMap.get(v.filmId);
    const dates = index.get(v.filmId)?.dates || [];
    return {
      filmId: v.filmId,
      filmTitle: filmLabel(film, v.filmId),
      image: String(film?.image || ''),
      count: v.count,
      weeks: v.weeks,
      planned: plannedByFilm.has(v.filmId),
      gate: filmVoteGate(dates, today),
      lastWeek: v.lastWeek,
    };
  });
  votes.sort((a, b) => b.count - a.count || String(b.lastWeek).localeCompare(String(a.lastWeek)));

  return { nominations, votes };
}
