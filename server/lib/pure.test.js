import { test } from 'node:test';
import assert from 'node:assert/strict';
import { weekStartDateString, personaFor, nextUserNoFromList } from './pure.js';

test('weekStartDateString: Monday stays itself', () => {
  assert.equal(weekStartDateString(new Date('2026-08-24T03:00:00+08:00').getTime()), '2026-08-24');
});

test('weekStartDateString: a Wednesday rolls back to Monday', () => {
  assert.equal(weekStartDateString(new Date('2026-08-26T03:00:00+08:00').getTime()), '2026-08-24');
});

test('weekStartDateString: a Sunday rolls back to the previous Monday', () => {
  assert.equal(weekStartDateString(new Date('2026-08-30T03:00:00+08:00').getTime()), '2026-08-24');
});

test('personaFor: all-zero is the bystander', () => {
  assert.equal(personaFor(0, 0, 0), '旁观者 · 来年加油');
});

test('personaFor: single tag', () => {
  assert.equal(personaFor(5, 0, 0), '选片策展人');
  assert.equal(personaFor(0, 10, 0), '投票狂人');
  assert.equal(personaFor(0, 0, 5), '放映常客');
});

test('personaFor: multiple tags = 全能影迷', () => {
  assert.equal(personaFor(3, 6, 3), '全能影迷');
});

test('personaFor: low activity = 新晋影迷', () => {
  assert.equal(personaFor(1, 1, 1), '新晋影迷');
});

test('nextUserNoFromList: empty → 001', () => {
  assert.equal(nextUserNoFromList([]), '001');
});

test('nextUserNoFromList: 001,002 → 003', () => {
  assert.equal(nextUserNoFromList(['001', '002']), '003');
});

test('nextUserNoFromList: ignores non-numeric + sorts by numeric value', () => {
  assert.equal(nextUserNoFromList(['abc', '009', null, '100']), '101');
});