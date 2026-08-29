import { test } from 'node:test';
import assert from 'node:assert/strict';
import { assembleNominationStats } from './nominationStats.js';

const uuid = '550e8400-e29b-41d4-a716-446655440000';
const members = [
  { uid: uuid, username: '甲', user_no: '002' },
  { uid: 'u2', username: '乙', user_no: '001' },
];

test('assembleNominationStats: CloudBase uid in user_roles is a member, not 匿名', () => {
  const out = assembleNominationStats({
    members,
    pool: [
      { film_id: 'a', title: 'A', nominee_identity_id: uuid },
      { film_id: 'a', title: 'A', nominee_identity_id: 'cookie-anon' },
      { film_id: 'a', title: 'A', nominee_identity_id: null },
    ],
    weekVotes: [
      { film_id: 'a', identity_id: uuid, count: 3 },
      { film_id: 'a', identity_id: 'cookie-anon', count: 2 },
      { film_id: 'a', identity_id: 'u2', count: 1 },
    ],
  });
  assert.equal(out.films.length, 1);
  const film = out.films[0];
  assert.equal(film.anonymousNominations, 2);
  assert.equal(film.anonymousVotes, 2);
  assert.deepEqual(
    film.members.map((m) => ({ uid: m.uid, name: m.name, nominations: m.nominations, votes: m.votes })),
    [
      { uid: uuid, name: '甲', nominations: 1, votes: 3 },
      { uid: 'u2', name: '乙', nominations: 0, votes: 1 },
    ],
  );
});

test('assembleNominationStats: votes on films nobody nominated are omitted', () => {
  const out = assembleNominationStats({
    members,
    pool: [{ film_id: 'a', title: 'A', nominee_identity_id: 'u2' }],
    weekVotes: [
      { film_id: 'a', identity_id: 'cookie', count: 4 },
      { film_id: 'orphan', identity_id: uuid, count: 9 },
    ],
  });
  assert.equal(out.films.length, 1);
  assert.equal(out.films[0].filmId, 'a');
  assert.equal(out.totals.anonymousVotes, 4);
  assert.equal(out.totals.memberVotes, 0);
});

test('assembleNominationStats: pending TMDB rows group on tmdb_id; stacked counts sum', () => {
  const out = assembleNominationStats({
    members,
    pool: [
      { film_id: null, tmdb_id: 'tmdb-7', title: 'Pending', nominee_identity_id: 'ghost' },
      { film_id: 'tmdb-7', tmdb_id: 'tmdb-7', title: 'Promoted', nominee_identity_id: 'u2' },
    ],
    weekVotes: [
      { film_id: 'tmdb-7', identity_id: 'ghost', count: 2 },
      { film_id: 'tmdb-7', identity_id: 'ghost', count: 3 },
    ],
  });
  assert.equal(out.films.length, 1);
  assert.equal(out.films[0].filmId, 'tmdb-7');
  assert.equal(out.films[0].anonymousNominations, 1);
  assert.equal(out.films[0].anonymousVotes, 5);
  assert.equal(out.films[0].members[0].nominations, 1);
  assert.equal(out.totals.films, 1);
  assert.equal(out.totals.anonymousNominations, 1);
  assert.equal(out.totals.memberNominations, 1);
});
