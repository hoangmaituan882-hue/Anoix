/**
 * GET /api/ranking — public lifetime board; optional Bearer fills `me`.
 */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { errorHandler } from '../lib/middleware.js';

const st = {
  ident: null,
  screenings: [],
  films: [],
  watches: [],
  members: [],
};

mock.module('../lib/identity.js', {
  namedExports: {
    callerIdentity: mock.fn(async () => st.ident),
  },
});
mock.module('../lib/db.js', {
  namedExports: {
    pgGet: mock.fn(async (path) => {
      const p = String(path);
      if (p.includes('screenings')) return st.screenings;
      if (p.includes('/films')) return st.films;
      if (p.includes('watch_log')) return st.watches;
      if (p.includes('user_roles')) return st.members;
      return [];
    }),
    contentCache: {
      get: () => undefined,
      set: () => {},
      clear: () => {},
    },
  },
});

const { rankingRoutes } = await import('./ranking.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  rankingRoutes(app);
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

function seedBoard() {
  st.screenings = [
    { screen_date: '2020-01-15', film_ids: ['a', 'b'] },
    { screen_date: '2099-01-01', film_ids: ['soon'] },
  ];
  st.films = [
    { id: 'a', duration: 120 },
    { id: 'b', duration: 60 },
    { id: 'soon', duration: 90 },
  ];
  st.members = [
    { uid: 'u1', username: '甲', user_no: '002' },
    { uid: 'u2', username: '乙', user_no: '001' },
    { uid: 'u3', username: null, user_no: '003' },
  ];
  st.watches = [
    { uid: 'u1', film_id: 'a' },
    { uid: 'u1', film_id: 'b' },
    { uid: 'u2', film_id: 'a' },
    { uid: 'anon', film_id: 'a' },
    { uid: 'u3', film_id: 'soon' },
  ];
}

test('GET /api/ranking: guest sees top board, me=null, anons omitted', async () => {
  st.ident = null;
  seedBoard();
  await withServer(async (base) => {
    const r = await fetch(`${base}/api/ranking`);
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body.total, 2);
    assert.equal(body.me, null);
    assert.deepEqual(body.top.map((row) => row.uid), ['u1', 'u2']);
    assert.equal(body.top[0].hours, 3);
    assert.equal(body.top[0].name, '甲');
    assert.equal(body.histogram.length, 26);
  });
});

test('GET /api/ranking: bearer fills me; invalid token still public', async () => {
  seedBoard();
  st.ident = { uid: 'u2', role: 'user' };
  await withServer(async (base) => {
    const r = await fetch(`${base}/api/ranking`, {
      headers: { Authorization: 'Bearer tok' },
    });
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body.me.rank, 2);
    assert.equal(body.me.filmsCount, 1);
  });

  st.ident = null;
  await withServer(async (base) => {
    const r = await fetch(`${base}/api/ranking`, {
      headers: { Authorization: 'Bearer bad' },
    });
    assert.equal(r.status, 200);
    assert.equal((await r.json()).me, null);
  });
});
