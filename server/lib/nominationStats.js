/**
 * Admin-only nomination attribution: per nominated film, anonymous vs
 * logged-in (user_roles) nomination rows and stacked week-vote counts.
 */
import { displayRankName } from './ranking.js';

export function filmAttributionKey(row) {
  const fid = String(row?.film_id || '').trim();
  if (fid) return fid;
  const tmdb = String(row?.tmdb_id || '').trim();
  if (tmdb) return tmdb;
  return String(row?.title || '').trim();
}

function voteCount(raw) {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : 0;
}

function bump(map, uid, n) {
  map.set(uid, (map.get(uid) || 0) + n);
}

export function assembleNominationStats({ pool = [], weekVotes = [], members = [] } = {}) {
  const memberByUid = new Map();
  for (const m of members || []) {
    const uid = String(m?.uid || '').trim();
    if (uid) memberByUid.set(uid, m);
  }

  const groups = new Map();
  for (const p of pool || []) {
    const key = filmAttributionKey(p);
    if (!key) continue;
    let g = groups.get(key);
    if (!g) {
      g = {
        filmId: key,
        title: String(p.title || key),
        image: p.image || '',
        year: p.year || '',
        anonNom: 0,
        memberNom: new Map(),
        anonVotes: 0,
        memberVotes: new Map(),
      };
      groups.set(key, g);
    } else if (p.title && g.title === g.filmId) {
      g.title = String(p.title);
    }
    const ident = String(p.nominee_identity_id || '').trim();
    if (ident && memberByUid.has(ident)) bump(g.memberNom, ident, 1);
    else g.anonNom += 1;
  }

  for (const v of weekVotes || []) {
    const fid = String(v?.film_id || '').trim();
    const g = groups.get(fid);
    if (!g) continue;
    const n = voteCount(v?.count);
    if (!n) continue;
    const ident = String(v?.identity_id || '').trim();
    if (ident && memberByUid.has(ident)) bump(g.memberVotes, ident, n);
    else g.anonVotes += n;
  }

  const films = [...groups.values()].map((g) => {
    const uids = new Set([...g.memberNom.keys(), ...g.memberVotes.keys()]);
    const memberRows = [...uids]
      .map((uid) => ({
        uid,
        name: displayRankName(memberByUid.get(uid)),
        nominations: g.memberNom.get(uid) || 0,
        votes: g.memberVotes.get(uid) || 0,
      }))
      .sort(
        (a, b) =>
          b.votes - a.votes ||
          b.nominations - a.nominations ||
          a.name.localeCompare(b.name, 'zh') ||
          a.uid.localeCompare(b.uid),
      );
    return {
      filmId: g.filmId,
      title: g.title,
      image: g.image,
      year: g.year,
      anonymousNominations: g.anonNom,
      anonymousVotes: g.anonVotes,
      members: memberRows,
    };
  });

  films.sort((a, b) => {
    const votesA = a.anonymousVotes + a.members.reduce((s, m) => s + m.votes, 0);
    const nomsA = a.anonymousNominations + a.members.reduce((s, m) => s + m.nominations, 0);
    const votesB = b.anonymousVotes + b.members.reduce((s, m) => s + m.votes, 0);
    const nomsB = b.anonymousNominations + b.members.reduce((s, m) => s + m.nominations, 0);
    return votesB - votesA || nomsB - nomsA || a.title.localeCompare(b.title, 'zh');
  });

  const totals = {
    films: films.length,
    anonymousNominations: 0,
    anonymousVotes: 0,
    memberNominations: 0,
    memberVotes: 0,
  };
  for (const f of films) {
    totals.anonymousNominations += f.anonymousNominations;
    totals.anonymousVotes += f.anonymousVotes;
    for (const m of f.members) {
      totals.memberNominations += m.nominations;
      totals.memberVotes += m.votes;
    }
  }

  return { films, totals };
}
