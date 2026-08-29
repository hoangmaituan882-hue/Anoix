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
      if (p.includes('screenings')) {
        return [
          { screen_date: '2020-01-15', film_ids: ['b', 'a'] },
          { screen_date: '2099-01-01', film_ids: ['soon'] },
        ];
      }
      if (p.includes('id=in')) {
        return [
          { id: 'a', title: 'A', year: '2019', category: 'Movie', image: '' },
          { id: 'b', title: 'B', year: '2018', category: 'Movie', image: '' },
        ];
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
