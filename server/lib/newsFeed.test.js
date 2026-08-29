import { test } from 'node:test';
import assert from 'node:assert/strict';
import { homepageNews, applyHomepageReorder, presentNewsItem } from './newsFeed.js';

const now = Date.parse('2026-08-29T12:00:00+08:00');

function row(id, extra = {}) {
  return {
    id,
    title: id,
    status: 'published',
    published_at: '2026-01-01T00:00:00.000Z',
    pinned: false,
    sort_order: 0,
    ...extra,
  };
}

test('homepageNews: empty or missing rows → []', () => {
  assert.deepEqual(homepageNews(null, now), []);
  assert.deepEqual(homepageNews(undefined, now), []);
  assert.deepEqual(homepageNews([], now), []);
});

test('homepageNews: hides draft and archived', () => {
  const visible = homepageNews([
    row('draft', { status: 'draft' }),
    row('arch', { status: 'archived' }),
    row('live'),
  ], now);
  assert.deepEqual(visible.map((r) => r.id), ['live']);
});

test('homepageNews: scheduled uses published_at vs now; published without timestamp stays', () => {
  const visible = homepageNews([
    row('soon', { status: 'scheduled', published_at: '2026-12-01T00:00:00.000Z', sort_order: 1 }),
    row('due', { status: 'scheduled', published_at: '2026-01-01T00:00:00.000Z', sort_order: 2 }),
    row('plain', { status: 'published', published_at: null, sort_order: 3 }),
  ], now);
  assert.deepEqual(visible.map((r) => r.id), ['due', 'plain']);
});

test('homepageNews: pinned first, then sort_order', () => {
  const visible = homepageNews([
    row('c', { pinned: false, sort_order: 1 }),
    row('a', { pinned: true, sort_order: 9 }),
    row('b', { pinned: false, sort_order: 0 }),
    row('d', { pinned: true, sort_order: 2 }),
  ], now);
  assert.deepEqual(visible.map((r) => r.id), ['d', 'a', 'b', 'c']);
});

test('applyHomepageReorder: drop into pin zone pins; drop below unpins', () => {
  const visible = [
    row('p1', { pinned: true, sort_order: 0 }),
    row('p2', { pinned: true, sort_order: 1 }),
    row('u1', { pinned: false, sort_order: 2 }),
    row('u2', { pinned: false, sort_order: 3 }),
  ];
  const pinnedIn = applyHomepageReorder(visible, 'u1', 0);
  assert.deepEqual(pinnedIn.map((r) => r.id), ['u1', 'p1', 'p2', 'u2']);
  assert.equal(pinnedIn[0].pinned, true);
  assert.deepEqual(pinnedIn.map((r) => r.sort_order), [0, 1, 2, 3]);

  const unpinnedOut = applyHomepageReorder(visible, 'p1', 3);
  assert.deepEqual(unpinnedOut.map((r) => r.id), ['p2', 'u1', 'u2', 'p1']);
  assert.equal(unpinnedOut.find((r) => r.id === 'p1').pinned, false);
  assert.equal(unpinnedOut.find((r) => r.id === 'p2').pinned, true);
});

test('applyHomepageReorder: same index or missing id is a no-op', () => {
  const visible = [row('a', { sort_order: 0 }), row('b', { sort_order: 1 })];
  assert.equal(applyHomepageReorder(visible, 'a', 0), visible);
  assert.equal(applyHomepageReorder(visible, 'nope', 1), visible);
});

test('presentNewsItem: maps snake_case public fields; skips blank title', () => {
  assert.equal(presentNewsItem(null), null);
  assert.equal(presentNewsItem({ id: 'x', title: '' }), null);
  const item = presentNewsItem({
    id: 'n1',
    date: '2026.08.29',
    category: 'Info',
    title: '原文',
    title_zh: '中文',
    title_en: 'EN',
    content: 'body',
    content_zh: '正文',
    content_en: 'body en',
    image: 'https://img',
    link: 'https://example.com',
  });
  assert.deepEqual(item, {
    id: 'n1',
    date: '2026.08.29',
    category: 'Info',
    title: '原文',
    titleZh: '中文',
    titleEn: 'EN',
    content: 'body',
    contentZh: '正文',
    contentEn: 'body en',
    image: 'https://img',
    link: 'https://example.com',
  });
});
