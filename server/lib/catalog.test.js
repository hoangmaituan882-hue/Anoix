import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  shanghaiDateString,
  latestPastClubDate,
  filmVoteGate,
  rankFeatured,
  sortScreenedDesc,
  matchFilmQuery,
  matchFilmCategory,
  paginate,
  clampAddVotes,
  placeFilmOnNight,
  moveFilmBetweenNights,
  reorderNight,
  filmScheduleFields,
  featuredIdsFromScreenings,
  assembleFeatured,
  filmListPath,
  filmsByIdPath,
  parseContentRangeTotal,
  rangeHeader,
  stampIsNew,
  FILM_CARD_COLUMNS,
} from './catalog.js';

test('shanghaiDateString: uses Asia/Shanghai calendar date', () => {
  assert.equal(shanghaiDateString(new Date('2026-08-29T01:00:00+08:00').getTime()), '2026-08-29');
  // still 28th in US, already 29th in Shanghai
  assert.equal(shanghaiDateString(new Date('2026-08-28T20:00:00-04:00').getTime()), '2026-08-29');
});

test('latestPastClubDate: ignores future nights and release-style dates not passed in', () => {
  const today = '2026-08-29';
  assert.equal(latestPastClubDate(['2026-09-18', '2026-08-20', '2026-06-01'], today), '2026-08-20');
  assert.equal(latestPastClubDate(['2026-09-18'], today), null);
  assert.equal(latestPastClubDate([], today), null);
});

test('filmVoteGate: past = closed, future-only = frozen, none = open', () => {
  const today = '2026-08-29';
  assert.equal(filmVoteGate(['2026-08-20'], today), 'screened');
  assert.equal(filmVoteGate(['2026-09-18'], today), 'frozen');
  assert.equal(filmVoteGate(['2026-08-20', '2026-09-18'], today), 'screened');
  assert.equal(filmVoteGate([], today), 'open');
});

test('rankFeatured: at most 12 past screenings, newest first, NEW on first two', () => {
  const today = '2026-08-29';
  const films = Array.from({ length: 15 }, (_, i) => ({
    id: `f${i}`,
    title: `T${i}`,
    year: '2020',
    category: 'Movie',
    image: '',
  }));
  const screenings = films.map((f, i) => ({
    screen_date: `2026-07-${String(i + 1).padStart(2, '0')}`,
    film_ids: [f.id],
  }));
  const featured = rankFeatured(films, screenings, today);
  assert.equal(featured.length, 12);
  assert.equal(featured[0].id, 'f14');
  assert.equal(featured[1].id, 'f13');
  assert.equal(featured[0].isNew, true);
  assert.equal(featured[1].isNew, true);
  assert.equal(featured[2].isNew, false);
});

test('rankFeatured: same night follows film_ids order', () => {
  const films = [
    { id: 'a', title: 'A', year: '2020', category: 'Movie', image: '' },
    { id: 'b', title: 'B', year: '2020', category: 'Movie', image: '' },
  ];
  const screenings = [{ screen_date: '2026-08-20', film_ids: ['b', 'a'] }];
  const featured = rankFeatured(films, screenings, '2026-08-29');
  assert.deepEqual(featured.map((f) => f.id), ['b', 'a']);
});

test('rankFeatured: future nights never appear', () => {
  const films = [{ id: 'soon', title: 'Soon', year: '2026', category: 'Movie', image: '' }];
  const screenings = [{ screen_date: '2026-09-18', film_ids: ['soon'] }];
  assert.deepEqual(rankFeatured(films, screenings, '2026-08-29'), []);
});

test('sortScreenedDesc: past dates first, never-screened last by year', () => {
  const latest = { old: '2025-01-01', new: '2026-08-20' };
  const films = [
    { id: 'never-old', year: '2010' },
    { id: 'old', year: '1999' },
    { id: 'never-new', year: '2024' },
    { id: 'new', year: '2001' },
  ];
  assert.deepEqual(sortScreenedDesc(films, latest).map((f) => f.id), [
    'new',
    'old',
    'never-new',
    'never-old',
  ]);
});

test('matchFilmQuery: titles, director, year', () => {
  const f = { title: 'プロメア', title_zh: '普罗米亚', title_en: 'Promare', director: '今石洋之', year: '2019' };
  assert.equal(matchFilmQuery(f, 'promare'), true);
  assert.equal(matchFilmQuery(f, '今石'), true);
  assert.equal(matchFilmQuery(f, '2019'), true);
  assert.equal(matchFilmQuery(f, 'dungeon'), false);
  assert.equal(matchFilmQuery(f, ''), true);
});

test('matchFilmCategory: tv / movie / original including Netflix', () => {
  assert.equal(matchFilmCategory({ category: 'TV Series' }, 'tv'), true);
  assert.equal(matchFilmCategory({ category: 'Movie' }, 'movie'), true);
  assert.equal(matchFilmCategory({ category: 'Netflix Series' }, 'original'), true);
  assert.equal(matchFilmCategory({ category: 'Original Animation' }, 'original'), true);
  assert.equal(matchFilmCategory({ category: 'Movie' }, 'tv'), false);
  assert.equal(matchFilmCategory({ category: 'Movie' }, 'all'), true);
});

test('paginate: offset + limit + total', () => {
  const items = [1, 2, 3, 4, 5];
  assert.deepEqual(paginate(items, 2, 2), { items: [3, 4], total: 5, offset: 2, limit: 2 });
});

test('clampAddVotes: default 1, cap at remaining, reject junk', () => {
  assert.deepEqual(clampAddVotes(undefined, 6), { ok: true, count: 1 });
  assert.deepEqual(clampAddVotes(3, 6), { ok: true, count: 3 });
  assert.deepEqual(clampAddVotes(9, 4), { ok: true, count: 4 });
  assert.equal(clampAddVotes(0, 6).ok, false);
  assert.equal(clampAddVotes(1, 0).ok, false);
  assert.equal(clampAddVotes(1.5, 6).ok, false);
});

test('placeFilmOnNight: creates a night when the date is empty', () => {
  const next = placeFilmOnNight([], 'promare', '2026-08-20');
  assert.equal(next.length, 1);
  assert.equal(next[0].screen_date, '2026-08-20');
  assert.deepEqual(next[0].film_ids, ['promare']);
});

test('placeFilmOnNight: appends to an existing night and can insert at index', () => {
  const start = [{ id: 'n1', screen_date: '2026-08-20', film_ids: ['a'] }];
  const appended = placeFilmOnNight(start, 'b', '2026-08-20');
  assert.deepEqual(appended[0].film_ids, ['a', 'b']);
  const front = placeFilmOnNight(appended, 'c', '2026-08-20', 0);
  assert.deepEqual(front[0].film_ids, ['c', 'a', 'b']);
});

test('moveFilmBetweenNights: removes from source and keeps other nights', () => {
  const start = [
    { id: 'n1', screen_date: '2026-08-20', film_ids: ['a', 'b'] },
    { id: 'n2', screen_date: '2026-09-18', film_ids: ['c'] },
  ];
  const next = moveFilmBetweenNights(start, 'a', '2026-08-20', '2026-09-18', 0);
  assert.deepEqual(next.find((s) => s.screen_date === '2026-08-20').film_ids, ['b']);
  assert.deepEqual(next.find((s) => s.screen_date === '2026-09-18').film_ids, ['a', 'c']);
});

test('reorderNight: replaces film_ids for that date only', () => {
  const start = [
    { id: 'n1', screen_date: '2026-08-20', film_ids: ['a', 'b'] },
    { id: 'n2', screen_date: '2026-08-21', film_ids: ['c'] },
  ];
  const next = reorderNight(start, '2026-08-20', ['b', 'a']);
  assert.deepEqual(next[0].film_ids, ['b', 'a']);
  assert.deepEqual(next[1].film_ids, ['c']);
});

test('featuredIdsFromScreenings: ranks ids from nights only, no film rows', () => {
  const today = '2026-08-29';
  const screenings = [
    { screen_date: '2026-08-20', film_ids: ['b', 'a'] },
    { screen_date: '2026-09-18', film_ids: ['soon'] },
    { screen_date: '2026-07-01', film_ids: ['old'] },
  ];
  const ranked = featuredIdsFromScreenings(screenings, today);
  assert.deepEqual(ranked.map((r) => r.id), ['b', 'a', 'old']);
  assert.equal(ranked[0].past, '2026-08-20');
  assert.equal(ranked.length, 3);
});

test('assembleFeatured: NEW on first two, skips missing ids, preserves night order', () => {
  const ranked = [
    { id: 'b', past: '2026-08-20', nightOrder: 0 },
    { id: 'missing', past: '2026-08-20', nightOrder: 1 },
    { id: 'a', past: '2026-08-20', nightOrder: 2 },
  ];
  const byId = new Map([
    ['a', { id: 'a', title: 'A' }],
    ['b', { id: 'b', title: 'B' }],
  ]);
  const cards = assembleFeatured(byId, ranked);
  assert.deepEqual(cards.map((c) => c.id), ['b', 'a']);
  assert.equal(cards[0].isNew, true);
  assert.equal(cards[1].isNew, true);
  assert.equal(cards[0].screeningDate, '2026-08-20');
});

test('filmListPath: paginated cards use denormalized screening_date, not select=*', () => {
  const path = filmListPath({ q: '', category: 'all', sort: 'screened_desc' });
  assert.equal(path.startsWith('/films?'), true);
  assert.equal(path.includes(`select=${FILM_CARD_COLUMNS}`), true);
  assert.match(path, /order=screening_date\.desc\.nullslast/);
  assert.equal(path.includes('select=*'), false);
  assert.equal(path.includes('or='), false);
});

test('filmListPath: q and category become PostgREST filters', () => {
  const qPath = filmListPath({ q: 'Promare', category: 'all', sort: 'year_desc' });
  assert.match(qPath, /title\.ilike\.\*Promare\*/);
  assert.match(qPath, /order=year\.desc/);
  const tv = filmListPath({ q: '', category: 'tv', sort: 'screened_desc' });
  assert.match(tv, /category\.ilike\.\*tv\*/);
  const original = filmListPath({ q: '今石', category: 'original', sort: 'year_asc' });
  assert.match(original, /and=\(or=/);
  assert.match(original, /category\.ilike\.\*original\*/);
  assert.match(original, /category\.ilike\.\*netflix\*/);
  assert.match(original, /order=year\.asc/);
});

test('filmListPath: strips PostgREST filter metacharacters from q', () => {
  const path = filmListPath({ q: 'foo*bar,(x)', category: 'all', sort: 'screened_desc' });
  assert.equal(path.includes('foo*bar'), false);
  assert.equal(path.includes('(x)'), false);
  assert.match(path, /title\.ilike\.\*foo bar x\*/);
});

test('filmsByIdPath: in-filter for ranked ids only', () => {
  assert.equal(filmsByIdPath([]), null);
  assert.equal(
    filmsByIdPath(['b', 'a']),
    `/films?select=${FILM_CARD_COLUMNS}&id=in.(b,a)`,
  );
});

test('parseContentRangeTotal + rangeHeader', () => {
  assert.equal(parseContentRangeTotal('0-23/200'), 200);
  assert.equal(parseContentRangeTotal('*/0'), 0);
  assert.equal(parseContentRangeTotal('0-0/1'), 1);
  assert.equal(parseContentRangeTotal('2-2/*'), null);
  assert.equal(parseContentRangeTotal(null), null);
  assert.deepEqual(rangeHeader(24, 24), { Range: '24-47' });
  assert.deepEqual(rangeHeader(0, 8), { Range: '0-7' });
});

test('stampIsNew: only the homepage pair', () => {
  const cards = stampIsNew([{ id: 'a' }, { id: 'b' }, { id: 'c' }], ['b', 'c']);
  assert.deepEqual(cards.map((c) => c.isNew), [false, true, true]);
});

test('filmScheduleFields: past / future-only / none', () => {
  const today = '2026-08-29';
  assert.deepEqual(filmScheduleFields(['2026-08-20'], today), {
    screening_date: '2026-08-20',
    screening_status: 'screened',
  });
  assert.deepEqual(filmScheduleFields(['2026-09-18'], today), {
    screening_date: null,
    screening_status: 'scheduled',
  });
  assert.deepEqual(filmScheduleFields([], today), {
    screening_date: null,
    screening_status: 'unscheduled',
  });
});
