/**
 * Content catalog routes — featured must fetch ranked ids only;
 * paged list must use Range against denormalized screening_date.
 */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { errorHandler } from '../lib/middleware.js';

const pgCalls = [];
const pageCalls = [];
const cache = new Map();

mock.module('../lib/db.js', {
  namedExports: {
    getAdminToken: mock.fn(async () => 'token'),
    pgGet: mock.fn(async (path) => {
      pgCalls.push(String(path));
      const p = String(path);
      if (p.includes('channel_settings')) {
        return [{ id: 'home', hub_url: 'https://space.bilibili.com/1' }];
      }
      if (p.includes('social_links')) {
        return [{
          id: 'x',
          name: 'X',
          url: 'https://x.com/trigger_inc',
          desc_zh: '工作室最新动态与周边商品预告发布于此',
          desc_en: 'Official news',
          desc_ja: '最新情報',
          sort_order: 0,
        }];
      }
      if (p.includes('channel_videos')) {
        return [{
          id: 'c1',
          title: '稿件',
          title_zh: '中文稿',
          url: 'https://www.bilibili.com/video/BV1xx411c7mD',
          thumbnail: 'http://cover',
          platform: 'bilibili',
          duration: '1:00',
          sort_order: 0,
        }];
      }
      if (p.includes('/news')) {
        return [
          { id: 'draft', title: 'Draft', status: 'draft', pinned: false, sort_order: 0, published_at: null },
          { id: 'live', title: 'Live', status: 'published', pinned: false, sort_order: 2, published_at: null },
          { id: 'pin', title: 'Pin', status: 'published', pinned: true, sort_order: 9, published_at: null },
        ];
      }
      if (p.includes('screenings')) {
        if (p.includes('select=*')) {
          return [
            {
              id: 'n1',
              title: 'TRIGGER 社区选片与投票轮次',
              screen_date: '2026-08-23',
              film_ids: ['b'],
            },
          ];
        }
        return [
          { id: 'past', title: '', screen_date: '2020-01-15', film_ids: ['b', 'a'] },
          { id: 'soon-night', title: '今石夜', screen_date: '2099-01-01', film_ids: ['soon', 'a'] },
        ];
      }
      if (p.includes('id=in')) {
        return [
          { id: 'a', title: 'A', year: '2019', category: 'Movie', image: '' },
          { id: 'b', title: 'B', year: '2018', category: 'Movie', image: '' },
          { id: 'soon', title: 'Soon', title_zh: '未映', year: '2026', category: 'Movie', image: 'soon.jpg' },
        ];
      }
      if (p.startsWith('/films') && p.includes('id=eq.')) {
        const id = decodeURIComponent(p.split('id=eq.')[1].split('&')[0]);
        const films = {
          a: { id: 'a', title: 'A', is_new: false },
          b: { id: 'b', title: 'B', is_new: false },
          c: { id: 'c', title: 'C', is_new: true },
        };
        return films[id] ? [films[id]] : [];
      }
      return [
        { id: 'a', title: 'A', year: '2019', category: 'Movie', image: '' },
        { id: 'b', title: 'B', year: '2018', category: 'Movie', image: '' },
        { id: 'c', title: 'C', year: '2017', category: 'Movie', image: '' },
      ];
    }),
    pgGetPage: mock.fn(async (path, offset, limit) => {
      pageCalls.push({ path: String(path), offset, limit });
      return {
        rows: [{ id: 'b', title: 'B', year: '2018', category: 'Movie', image: '' }],
        total: 99,
        offset,
        limit,
      };
    }),
    pgWrite: mock.fn(async () => [200, {}]),
    contentCache: {
      get: (k) => cache.get(k),
      set: (k, v) => cache.set(k, v),
      delete: (k) => cache.delete(k),
      clear: () => cache.clear(),
    },
  },
});
mock.module('../lib/identity.js', {
  namedExports: {
    resolveIdentity: mock.fn(async () => null),
  },
});
mock.module('../auth.js', {
  namedExports: {
    allowRate: () => true,
    clientIp: () => '127.0.0.1',
  },
});

const { contentRoutes } = await import('./content.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  contentRoutes(app);
  app.use(errorHandler);
  return app;
}

async function withServer(fn) {
  const app = buildApp();
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  try {
    return await fn(base);
  } finally {
    await new Promise((r) => server.close(r));
  }
}

test('GET /api/films/featured fetches only ranked ids, not the whole catalog', async () => {
  pgCalls.length = 0;
  await withServer(async (base) => {
    const r = await fetch(`${base}/api/films/featured`);
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.deepEqual(body.map((f) => f.id), ['b', 'a']);
    assert.equal(body[0].isNew, true);
    assert.equal(body[1].isNew, true);
  });
  const filmGets = pgCalls.filter((p) => p.startsWith('/films'));
  assert.equal(filmGets.length, 1);
  assert.equal(filmGets[0].includes('id=in.'), true);
  assert.equal(filmGets[0].includes('select=*'), false);
});

test('GET /api/films/:id stamps NEW from featured pair, not films.is_new', async () => {
  await withServer(async (base) => {
    const b = await fetch(`${base}/api/films/b`).then((r) => r.json());
    const c = await fetch(`${base}/api/films/c`).then((r) => r.json());
    assert.equal(b.isNew, true);
    assert.equal(c.isNew, false);
    assert.equal(c.is_new, true);
  });
});

test('GET /api/films?limit= pages via pgGetPage on screening_date', async () => {
  pageCalls.length = 0;
  pgCalls.length = 0;
  await withServer(async (base) => {
    const r = await fetch(`${base}/api/films?limit=8&offset=24&q=promare&category=movie`);
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body.total, 99);
    assert.equal(body.offset, 24);
    assert.equal(body.limit, 8);
    assert.equal(body.items.length, 1);
  });
  assert.equal(pageCalls.length, 1);
  assert.equal(pageCalls[0].offset, 24);
  assert.equal(pageCalls[0].limit, 8);
  assert.equal(pageCalls[0].path.includes('screening_date.desc'), true);
  assert.equal(pageCalls[0].path.includes('category.ilike.*movie*'), true);
  assert.equal(pageCalls[0].path.includes('title.ilike.*promare*'), true);
  const fullCatalog = pgCalls.filter((p) => p.startsWith('/films') && !p.includes('id=in'));
  assert.equal(fullCatalog.length, 0);
});

test('GET /api/screenings folds generic round slogans into the date title', async () => {
  await withServer(async (base) => {
    const r = await fetch(`${base}/api/screenings`);
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body[0].title, '2026年8月23日放映');
    assert.ok(body[0].round_status);
  });
});

test('GET /api/screenings/upcoming: one node per future night, posters in film_ids order', async () => {
  await withServer(async (base) => {
    const r = await fetch(`${base}/api/screenings/upcoming`);
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body.nights.length, 1);
    assert.equal(body.nights[0].id, 'soon-night');
    assert.equal(body.nights[0].status, 'upcoming');
    assert.deepEqual(body.nights[0].films.map((f) => f.id), ['soon', 'a']);
    assert.equal(body.nights[0].films[0].titleZh, '未映');
  });
});

test('GET /api/channel assembles hub url and clip cards', async () => {
  cache.clear();
  await withServer(async (base) => {
    const r = await fetch(`${base}/api/channel`);
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body.hubUrl, 'https://space.bilibili.com/1');
    assert.equal(body.items[0].id, 'c1');
    assert.equal(body.items[0].titleZh, '中文稿');
    assert.equal(body.items[0].platform, 'bilibili');
  });
});

test('GET /api/social-links assembles https tiles in sort order', async () => {
  cache.clear();
  await withServer(async (base) => {
    const r = await fetch(`${base}/api/social-links`);
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body.items.length, 1);
    assert.equal(body.items[0].id, 'x');
    assert.equal(body.items[0].name, 'X');
    assert.equal(body.items[0].icon, 'X');
  });
});

test('GET /api/news: published only, pinned first then sort_order', async () => {
  cache.clear();
  await withServer(async (base) => {
    const r = await fetch(`${base}/api/news`);
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.deepEqual(body.map((n) => n.id), ['pin', 'live']);
  });
});
