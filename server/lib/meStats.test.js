import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assembleMeStats, minutesToHours } from './meStats.js';

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
