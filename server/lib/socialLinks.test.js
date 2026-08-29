import { test } from 'node:test';
import assert from 'node:assert/strict';
import { inferSocialIcon, presentSocialLink, assembleSocialLinks } from './socialLinks.js';

test('presentSocialLink: requires name and https url', () => {
  assert.equal(presentSocialLink({ id: '1', name: 'X', url: 'http://x.com/a' }), null);
  assert.equal(presentSocialLink({ id: '1', name: '', url: 'https://x.com/a' }), null);
  assert.equal(presentSocialLink({ id: '1', name: 'X', url: 'not-a-url' }), null);
  const row = presentSocialLink({
    id: 'x',
    name: '  X  ',
    url: 'https://x.com/trigger_inc',
    desc_zh: '工作室最新动态与周边商品预告发布于此',
    desc_en: 'Official news',
    desc_ja: '最新情報',
  });
  assert.equal(row.name, 'X');
  assert.equal(row.descZh, '工作室最新动态与周边商品预告发布于此');
  assert.equal(row.icon, 'X');
});

test('inferSocialIcon: host then name', () => {
  assert.equal(inferSocialIcon('https://www.instagram.com/trigger_inc/', ''), 'Instagram');
  assert.equal(inferSocialIcon('https://example.com/x', 'Patreon'), 'Heart');
  assert.equal(inferSocialIcon('https://club.example/join', 'B站'), 'Link');
});

test('assembleSocialLinks: drops junk, sorts by sort_order, count follows rows', () => {
  const { items } = assembleSocialLinks([
    { id: 'b', name: 'YouTube', url: 'https://www.youtube.com/user/studiotrigger', sort_order: 2, desc_zh: '幕后' },
    { id: 'skip', name: 'Bad', url: 'ftp://nope', sort_order: 0 },
    { id: 'a', name: 'X', url: 'https://x.com/trigger_inc', sort_order: 0, desc_zh: '动态' },
  ]);
  assert.deepEqual(items.map((x) => x.id), ['a', 'b']);
  assert.equal(items.length, 2);
});

test('assembleSocialLinks: empty table is zero tiles', () => {
  assert.deepEqual(assembleSocialLinks([]).items, []);
  assert.deepEqual(assembleSocialLinks(null).items, []);
});
