/**
 * Per-user club stats: unique past-night films (first screening date wins),
 * watch_log intersection, nomination-pool unique ids, week-vote SUM(count).
 */

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
