import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  displayRankName,
  hoursHistogram,
  assembleRanking,
} from './ranking.js';

const today = '2026-08-29';
const screenings = [
  { screen_date: '2026-08-20', film_ids: ['a', 'b'] },
  { screen_date: '2026-09-01', film_ids: ['soon'] },
];
const films = [
  { id: 'a', duration: 120 },
  { id: 'b', duration: 60 },
  { id: 'soon', duration: 90 },
];
const members = [
  { uid: 'u1', username: '甲', user_no: '002' },
  { uid: 'u2', username: '乙', user_no: '001' },
  { uid: 'u3', username: null, user_no: '003' },
];

test('displayRankName: username then NO.xxx', () => {
  assert.equal(displayRankName({ username: '甲', user_no: '002' }), '甲');
  assert.equal(displayRankName({ username: '  ', user_no: '003' }), 'NO.003');
  assert.equal(displayRankName({}), '影迷');
});

test('assembleRanking: only logged-in watchers of past club films, hours then count then user_no', () => {
  const board = assembleRanking({
    today,
    screenings,
    films,
    members,
    watchLogs: [
      { uid: 'u1', film_id: 'a' },
      { uid: 'u1', film_id: 'b' },
      { uid: 'u2', film_id: 'a' },
      { uid: 'anon', film_id: 'a' },
      { uid: 'u3', film_id: 'soon' },
    ],
    viewerId: 'u2',
    topN: 20,
  });
  assert.equal(board.total, 2);
  assert.deepEqual(board.top.map((r) => r.uid), ['u1', 'u2']);
  assert.equal(board.top[0].rank, 1);
  assert.equal(board.top[0].hours, 3);
  assert.equal(board.top[0].filmsCount, 2);
  assert.equal(board.top[1].hours, 2);
  assert.equal(board.me.rank, 2);
  assert.equal(board.me.filmsCount, 1);
});

test('assembleRanking: equal hours break on film count then user_no', () => {
  const board = assembleRanking({
    today,
    screenings,
    films,
    members,
    watchLogs: [
      { uid: 'u1', film_id: 'a' },
      { uid: 'u2', film_id: 'a' },
    ],
    topN: 20,
  });
  assert.deepEqual(board.top.map((r) => r.uid), ['u2', 'u1']);
});

test('assembleRanking: viewer with zero club watches is unranked; guests get me=null', () => {
  const unranked = assembleRanking({
    today,
    screenings,
    films,
    members,
    watchLogs: [{ uid: 'u1', film_id: 'a' }],
    viewerId: 'u3',
    topN: 20,
  });
  assert.equal(unranked.me.rank, null);
  assert.equal(unranked.me.filmsCount, 0);

  const guest = assembleRanking({
    today,
    screenings,
    films,
    members,
    watchLogs: [{ uid: 'u1', film_id: 'a' }],
    topN: 3,
  });
  assert.equal(guest.me, null);
  assert.equal(guest.top.length, 1);
});

test('hoursHistogram: 26 buckets, max hours maps to last bar', () => {
  const { counts, maxHours } = hoursHistogram([0, 10, 20], 26);
  assert.equal(counts.length, 26);
  assert.equal(maxHours, 20);
  assert.equal(counts.reduce((a, b) => a + b, 0), 3);
  assert.equal(counts[25] > 0, true);
});
