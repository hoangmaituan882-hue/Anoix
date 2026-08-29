/**
 * Club watcher ranking: logged-in users who watched ≥1 past club film.
 * Sort: watched minutes desc, film count desc, user_no asc.
 */
import { firstScreenedByFilm, minutesToHours } from './meStats.js';

const BARS = 26;

export function displayRankName(member) {
  const name = String(member?.username || '').trim();
  if (name) return name;
  const no = String(member?.user_no || '').trim();
  if (no) return `NO.${no}`;
  return '影迷';
}

function filmMinutes(raw) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

export function hoursHistogram(hoursList, buckets = BARS) {
  const hours = (hoursList || []).map((h) => Number(h) || 0);
  const maxHours = hours.reduce((m, h) => (h > m ? h : m), 0);
  const counts = Array.from({ length: buckets }, () => 0);
  const span = maxHours > 0 ? maxHours : 1;
  for (const h of hours) {
    const idx = Math.min(buckets - 1, Math.floor((h / span) * buckets));
    counts[h >= span ? buckets - 1 : idx] += 1;
  }
  return { counts, maxHours };
}

function bucketIndex(hours, maxHours, buckets = BARS) {
  if (maxHours <= 0) return 0;
  const h = Number(hours) || 0;
  if (h >= maxHours) return buckets - 1;
  return Math.min(buckets - 1, Math.floor((h / maxHours) * buckets));
}

function percentileLabel(rank, total) {
  if (!rank || !total) return null;
  return `TOP ${((rank / total) * 100).toFixed(1)}%`;
}

function beatRatio(rank, total) {
  if (!rank || !total) return 0;
  return Math.round(((total - rank) / total) * 1000) / 10;
}

export function assembleRanking({
  today,
  screenings = [],
  films = [],
  members = [],
  watchLogs = [],
  viewerId = null,
  topN = 20,
  buckets = BARS,
} = {}) {
  const first = firstScreenedByFilm(screenings, today);
  const durationById = new Map();
  for (const f of films || []) {
    if (f?.id) durationById.set(String(f.id), filmMinutes(f.duration));
  }

  const memberByUid = new Map();
  for (const m of members || []) {
    const uid = String(m?.uid || '').trim();
    if (uid) memberByUid.set(uid, m);
  }

  const watched = new Map();
  for (const row of watchLogs || []) {
    const uid = String(row?.uid || '').trim();
    const filmId = String(row?.film_id || '').trim();
    if (!uid || !filmId || !memberByUid.has(uid) || !first.has(filmId)) continue;
    let set = watched.get(uid);
    if (!set) {
      set = new Set();
      watched.set(uid, set);
    }
    set.add(filmId);
  }

  const rows = [];
  for (const [uid, set] of watched) {
    if (set.size < 1) continue;
    let minutes = 0;
    for (const id of set) minutes += durationById.get(id) ?? 0;
    const member = memberByUid.get(uid) || {};
    rows.push({
      uid,
      name: displayRankName(member),
      userNo: String(member.user_no || ''),
      minutes,
      hours: minutesToHours(minutes),
      filmsCount: set.size,
    });
  }

  rows.sort((a, b) => {
    if (b.minutes !== a.minutes) return b.minutes - a.minutes;
    if (b.filmsCount !== a.filmsCount) return b.filmsCount - a.filmsCount;
    return String(a.userNo).localeCompare(String(b.userNo), 'en', { numeric: true });
  });

  const ranked = rows.map((r, i) => ({
    rank: i + 1,
    uid: r.uid,
    name: r.name,
    hours: r.hours,
    filmsCount: r.filmsCount,
  }));

  const hist = hoursHistogram(ranked.map((r) => r.hours), buckets);
  const n = ranked.length;
  const top = ranked.slice(0, Math.max(1, Number(topN) || 20));

  let me = null;
  if (viewerId) {
    const uid = String(viewerId);
    const hit = ranked.find((r) => r.uid === uid);
    if (hit) {
      me = {
        rank: hit.rank,
        hours: hit.hours,
        filmsCount: hit.filmsCount,
        percentile: percentileLabel(hit.rank, n),
        beatRatio: beatRatio(hit.rank, n),
        bucketIndex: bucketIndex(hit.hours, hist.maxHours, buckets),
      };
    } else {
      me = {
        rank: null,
        hours: 0,
        filmsCount: 0,
        percentile: null,
        beatRatio: 0,
        bucketIndex: 0,
      };
    }
  }

  return {
    total: n,
    top,
    histogram: hist.counts,
    histogramMaxHours: hist.maxHours,
    me,
  };
}
