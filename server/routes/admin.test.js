/**
 * GET /api/admin/stats — per nominated film, anon vs user_roles attribution.
 */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { errorHandler } from '../lib/middleware.js';

const uuid = '550e8400-e29b-41d4-a716-446655440000';
const st = {
  admin: true,
  pool: [],
  weekVotes: [],
  members: [],
  social: [],
};
const writes = [];
const cacheDeletes = [];

mock.module('../lib/config.js', {
  namedExports: { ENV_ID: 'test-env' },
});
mock.module('../tcapi.js', {
  namedExports: {
    tcRequest: mock.fn(async () => ({ Users: [] })),
    tcEnabled: () => false,
  },
});
mock.module('../lib/users.js', {
  namedExports: { mapUser: () => ({}), insertUserRole: async () => true },
});
mock.module('../lib/channel.js', {
  namedExports: { resolveVideoMeta: async () => ({ ok: false }) },
});
mock.module('../lib/identity.js', {
  namedExports: {
    adminGate: (req, res, next) => {
      if (!st.admin) return res.status(403).json({ error: 'not_admin' });
      next();
    },
  },
});
mock.module('../lib/db.js', {
  namedExports: {
    pgGet: mock.fn(async (path) => {
      const p = String(path);
      if (p.includes('nomination_pool')) return st.pool;
      if (p.includes('film_week_votes')) return st.weekVotes;
      if (p.includes('user_roles')) return st.members;
      if (p.includes('social_links')) return st.social;
      return [];
    }),
    pgWrite: mock.fn(async (method, path, body) => {
      writes.push({ method, path, body });
      return [201];
    }),
    contentCache: {
      get: () => undefined,
      set: () => {},
      delete: (k) => { cacheDeletes.push(k); },
      clear: () => {},
    },
  },
});

const { adminRoutes } = await import('./admin.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  adminRoutes(app);
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

test('GET /api/admin/stats: non-admin → 403', async () => {
  st.admin = false;
  await withServer(async (base) => {
    const r = await fetch(`${base}/api/admin/stats`);
    assert.equal(r.status, 403);
  });
});

test('GET /api/admin/stats: per-film anon vs member counts from pool + week votes', async () => {
  st.admin = true;
  st.members = [{ uid: uuid, username: '甲', user_no: '002' }];
  st.pool = [
    { film_id: 'a', tmdb_id: null, title: 'Alpha', image: '', year: '2020', nominee_identity_id: uuid },
    { film_id: 'a', tmdb_id: null, title: 'Alpha', image: '', year: '2020', nominee_identity_id: 'cookie' },
  ];
  st.weekVotes = [
    { film_id: 'a', identity_id: uuid, count: 4 },
    { film_id: 'a', identity_id: 'cookie', count: 2 },
  ];
  await withServer(async (base) => {
    const r = await fetch(`${base}/api/admin/stats`);
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body.totals.anonymousNominations, 1);
    assert.equal(body.totals.memberNominations, 1);
    assert.equal(body.totals.anonymousVotes, 2);
    assert.equal(body.totals.memberVotes, 4);
    assert.equal(body.films[0].filmId, 'a');
    assert.equal(body.films[0].anonymousNominations, 1);
    assert.equal(body.films[0].members[0].name, '甲');
    assert.equal(body.nominations, undefined);
    assert.equal(body.votes, undefined);
  });
});

test('POST /api/admin/social-links: http url → 400', async () => {
  st.admin = true;
  await withServer(async (base) => {
    const r = await fetch(`${base}/api/admin/social-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'X', url: 'http://x.com/a' }),
    });
    assert.equal(r.status, 400);
    assert.equal((await r.json()).error, 'bad_url');
  });
});

test('POST /api/admin/social-links: https tile → 200', async () => {
  st.admin = true;
  st.social = [];
  await withServer(async (base) => {
    const r = await fetch(`${base}/api/admin/social-links`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'X',
        url: 'https://x.com/trigger_inc',
        descZh: '工作室最新动态与周边商品预告发布于此',
      }),
    });
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body.ok, true);
    assert.match(body.id, /^sns-/);
  });
});

test('PATCH /api/admin/social-links/:id: missing → 404', async () => {
  st.admin = true;
  st.social = [];
  await withServer(async (base) => {
    const r = await fetch(`${base}/api/admin/social-links/nope`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'X', url: 'https://x.com/a' }),
    });
    assert.equal(r.status, 404);
  });
});

test('POST /api/admin/news/flush: busts news cache', async () => {
  st.admin = true;
  cacheDeletes.length = 0;
  await withServer(async (base) => {
    const r = await fetch(`${base}/api/admin/news/flush`, { method: 'POST' });
    assert.equal(r.status, 200);
    assert.deepEqual(await r.json(), { ok: true });
  });
  assert.ok(cacheDeletes.includes('news'));
});

test('POST /api/admin/news/reorder: empty ids → 400', async () => {
  st.admin = true;
  await withServer(async (base) => {
    const r = await fetch(`${base}/api/admin/news/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: [] }),
    });
    assert.equal(r.status, 400);
  });
});

test('POST /api/admin/news/reorder: writes sort_order and busts cache', async () => {
  st.admin = true;
  writes.length = 0;
  cacheDeletes.length = 0;
  await withServer(async (base) => {
    const r = await fetch(`${base}/api/admin/news/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids: ['b', 'a'] }),
    });
    assert.equal(r.status, 200);
  });
  assert.equal(writes.length, 2);
  assert.equal(writes[0].path.includes('id=eq.b'), true);
  assert.equal(writes[0].body.sort_order, 0);
  assert.equal(writes[1].path.includes('id=eq.a'), true);
  assert.equal(writes[1].body.sort_order, 1);
  assert.ok(cacheDeletes.includes('news'));
});
