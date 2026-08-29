import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assembleMeStats, assembleMeActivity, minutesToHours } from './meStats.js';

const TODAY = '2026-08-29';

function stats(partial = {}) {
  return assembleMeStats({
    today: TODAY,
    screenings: [],
    films: [],
    watchIds: [],
    poolFilmIds: [],
    weekVotes: [],
    ...partial,
  });
}

test('assembleMeStats: ignores tonight and future nights', () => {
  const out = stats({
    screenings: [
      { screen_date: '2026-08-29', film_ids: ['today'] },
      { screen_date: '2026-09-06', film_ids: ['soon'] },
      { screen_date: '2026-08-20', film_ids: ['past'] },
    ],
    films: [
      { id: 'today', duration: 100 },
      { id: 'soon', duration: 90 },
      { id: 'past', duration: 45 },
    ],
  });
  assert.equal(out.totalScreenedCount, 1);
  assert.equal(out.totalScreenedMinutes, 45);
  assert.equal(out.unwatchedCount, 1);
  assert.equal(out.watchedCount, 0);
});

test('assembleMeStats: same film on two nights counts once at first date', () => {
  const out = stats({
    screenings: [
      { screen_date: '2026-07-11', film_ids: ['a', 'b'] },
      { screen_date: '2026-08-08', film_ids: ['a'] },
    ],
    films: [
      { id: 'a', duration: 120 },
      { id: 'b', duration: 60 },
    ],
    watchIds: ['a'],
  });
  assert.equal(out.totalScreenedCount, 2);
  assert.equal(out.totalScreenedMinutes, 180);
  assert.equal(out.watchedCount, 1);
  assert.equal(out.watchedMinutes, 120);
  assert.equal(out.unwatchedCount, 1);
  assert.equal(out.unwatchedMinutes, 60);
  assert.deepEqual(out.monthly, [
    { yearMonth: '2026-07', minutes: 180, filmCount: 2 },
  ]);
});

test('assembleMeStats: missing duration is 0 minutes but still counts as a film', () => {
  const out = stats({
    screenings: [{ screen_date: '2026-06-01', film_ids: ['x'] }],
    films: [{ id: 'x', duration: null }],
    watchIds: ['x'],
  });
  assert.equal(out.totalScreenedCount, 1);
  assert.equal(out.totalScreenedMinutes, 0);
  assert.equal(out.watchedCount, 1);
  assert.equal(out.watchedMinutes, 0);
});

test('assembleMeStats: watch_log titles not in past club nights do not count as watched', () => {
  const out = stats({
    screenings: [{ screen_date: '2026-06-01', film_ids: ['club'] }],
    films: [{ id: 'club', duration: 80 }, { id: 'home', duration: 90 }],
    watchIds: ['home'],
  });
  assert.equal(out.watchedCount, 0);
  assert.equal(out.unwatchedCount, 1);
  assert.equal(out.unwatchedMinutes, 80);
});

test('assembleMeStats: nominations unique film_id; votes SUM(count)', () => {
  const out = stats({
    poolFilmIds: ['a', 'b', 'a', '', null],
    weekVotes: [{ count: 3 }, { count: 2 }, { count: 0 }],
  });
  assert.equal(out.nominations, 2);
  assert.equal(out.votes, 5);
});

test('minutesToHours: one decimal, minutes based', () => {
  assert.equal(minutesToHours(90), 1.5);
  assert.equal(minutesToHours(0), 0);
  assert.equal(minutesToHours(61), 1);
});

test('assembleMeActivity: nominations from pool rows, not round options', () => {
  const { nominations, votes } = assembleMeActivity({
    today: TODAY,
    pool: [
      { id: 1, film_id: 'a', title: '池内名', note: '想看', planned: true, status: 'promoted', source: 'user', created_at: '2026-08-01T00:00:00Z' },
      { id: 2, film_id: null, tmdb_id: 't7', title: '待入库', note: '', planned: false, status: 'pending', image: 'p.jpg', created_at: '2026-08-20T00:00:00Z' },
    ],
    films: [{ id: 'a', title: 'A', title_zh: '甲', image: 'a.jpg' }],
    weekVotes: [],
    screenings: [],
  });
  assert.equal(nominations.length, 2);
  assert.equal(nominations[0].id, 2);
  assert.equal(nominations[0].filmTitle, '待入库');
  assert.equal(nominations[1].filmTitle, '甲');
  assert.equal(nominations[1].planned, true);
  assert.deepEqual(votes, []);
});

test('assembleMeActivity: votes SUM week counts per film; gate from club nights', () => {
  const { votes } = assembleMeActivity({
    today: TODAY,
    pool: [{ id: 1, film_id: 'a', planned: true }],
    films: [{ id: 'a', title: 'A', title_zh: '甲', image: 'a.jpg' }],
    weekVotes: [
      { film_id: 'a', count: 3, week_start: '2026-08-24' },
      { film_id: 'a', count: 2, week_start: '2026-08-17' },
      { film_id: 'b', count: 1, week_start: '2026-08-24' },
    ],
    screenings: [{ screen_date: '2026-08-20', film_ids: ['a'] }],
  });
  assert.equal(votes[0].filmId, 'a');
  assert.equal(votes[0].count, 5);
  assert.equal(votes[0].weeks, 2);
  assert.equal(votes[0].planned, true);
  assert.equal(votes[0].gate, 'screened');
  assert.equal(votes[1].filmId, 'b');
  assert.equal(votes[1].count, 1);
  assert.equal(votes[1].gate, 'open');
});
