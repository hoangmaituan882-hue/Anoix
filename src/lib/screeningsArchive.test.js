import { test } from 'node:test';
import assert from 'node:assert/strict';
import { presentLiveScreenings } from './screeningsArchive.js';

test('presentLiveScreenings: live rows only, never a seed mix', () => {
  const live = [{ id: 'club-1', title: '社内夜' }];
  assert.deepEqual(presentLiveScreenings(live), live);
  assert.deepEqual(presentLiveScreenings([]), []);
  assert.equal(presentLiveScreenings(null).length, 0);
  assert.equal(presentLiveScreenings(undefined).length, 0);
  assert.equal(presentLiveScreenings({ items: live }).length, 0);
});
