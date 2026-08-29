import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  parseVideoUrl,
  youtubeThumbnail,
  formatDuration,
  presentChannelItem,
  assembleChannel,
  resolveVideoMeta,
} from './channel.js';

test('parseVideoUrl: YouTube watch / short / youtu.be', () => {
  assert.deepEqual(parseVideoUrl('https://www.youtube.com/watch?v=dQw4w9WgXcQ'), {
    ok: true,
    platform: 'youtube',
    videoKey: 'dQw4w9WgXcQ',
    canonicalUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    short: false,
  });
  assert.equal(parseVideoUrl('https://youtu.be/dQw4w9WgXcQ?t=12').videoKey, 'dQw4w9WgXcQ');
  assert.equal(parseVideoUrl('https://www.youtube.com/shorts/dQw4w9WgXcQ').videoKey, 'dQw4w9WgXcQ');
});

test('parseVideoUrl: Bilibili BV and av', () => {
  const bv = parseVideoUrl('https://www.bilibili.com/video/BV1xx411c7mD?p=1');
  assert.equal(bv.ok, true);
  assert.equal(bv.platform, 'bilibili');
  assert.equal(bv.videoKey, 'BV1xx411c7mD');
  assert.equal(bv.canonicalUrl, 'https://www.bilibili.com/video/BV1xx411c7mD');

  const av = parseVideoUrl('https://www.bilibili.com/video/av170001');
  assert.equal(av.platform, 'bilibili');
  assert.equal(av.videoKey, 'av170001');
});

test('parseVideoUrl: b23 short link needs follow; other https stays other', () => {
  const short = parseVideoUrl('https://b23.tv/abcdef');
  assert.equal(short.ok, true);
  assert.equal(short.platform, 'bilibili');
  assert.equal(short.short, true);
  assert.equal(short.videoKey, null);

  const other = parseVideoUrl('https://v.qq.com/x/page/foo.html');
  assert.equal(other.platform, 'other');
  assert.equal(other.canonicalUrl, 'https://v.qq.com/x/page/foo.html');
});

test('parseVideoUrl: empty and junk fail', () => {
  assert.equal(parseVideoUrl('').ok, false);
  assert.equal(parseVideoUrl('not a url').ok, false);
});

test('youtubeThumbnail: hqdefault from id', () => {
  assert.equal(
    youtubeThumbnail('dQw4w9WgXcQ'),
    'https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg',
  );
});

test('formatDuration: seconds to M:SS or H:MM:SS', () => {
  assert.equal(formatDuration(8), '0:08');
  assert.equal(formatDuration(522), '8:42');
  assert.equal(formatDuration(3661), '1:01:01');
  assert.equal(formatDuration(null), '');
});

test('presentChannelItem: prefers title_zh, keeps platform url', () => {
  const row = {
    id: 'c1',
    title: 'EN',
    title_zh: '中文',
    url: 'https://www.bilibili.com/video/BV1xx411c7mD',
    thumbnail: 'https://i0.hdslb.com/bfs/archive/x.jpg',
    platform: 'bilibili',
    duration: '8:42',
    sort_order: 2,
  };
  assert.deepEqual(presentChannelItem(row), {
    id: 'c1',
    title: 'EN',
    titleZh: '中文',
    thumbnail: 'https://i0.hdslb.com/bfs/archive/x.jpg',
    url: 'https://www.bilibili.com/video/BV1xx411c7mD',
    platform: 'bilibili',
    duration: '8:42',
  });
});

test('assembleChannel: hub url + sort_order', () => {
  const assembled = assembleChannel(
    { hub_url: ' https://space.bilibili.com/1 ' },
    [
      { id: 'b', title: 'B', sort_order: 2, url: 'u2', platform: 'other' },
      { id: 'a', title: 'A', sort_order: 1, url: 'u1', platform: 'bilibili' },
    ],
  );
  assert.equal(assembled.hubUrl, 'https://space.bilibili.com/1');
  assert.deepEqual(assembled.items.map((i) => i.id), ['a', 'b']);
});

test('resolveVideoMeta: YouTube thumb even if oembed fails', async () => {
  const meta = await resolveVideoMeta(
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    async () => { throw new Error('offline'); },
  );
  assert.equal(meta.ok, true);
  assert.equal(meta.platform, 'youtube');
  assert.equal(meta.thumbnail, youtubeThumbnail('dQw4w9WgXcQ'));
  assert.equal(meta.canonicalUrl, 'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
});

test('resolveVideoMeta: Bilibili view API fills title and cover', async () => {
  const fetchImpl = async (url) => {
    assert.equal(String(url).includes('bvid=BV1xx411c7mD'), true);
    return {
      ok: true,
      url: String(url),
      json: async () => ({
        code: 0,
        data: {
          bvid: 'BV1xx411c7mD',
          title: '测试稿件',
          pic: 'http://i0.hdslb.com/bfs/archive/cover.jpg',
          duration: 522,
        },
      }),
    };
  };
  const meta = await resolveVideoMeta('https://www.bilibili.com/video/BV1xx411c7mD', fetchImpl);
  assert.equal(meta.title, '测试稿件');
  assert.equal(meta.thumbnail, 'https://i0.hdslb.com/bfs/archive/cover.jpg');
  assert.equal(meta.duration, '8:42');
});
