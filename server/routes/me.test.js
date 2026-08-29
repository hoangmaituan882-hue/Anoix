/**
 * GET /api/me/stats — logged-in club duration / nomination / week-vote totals.
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
  pool: [],
  weekVotes: [],
};

mock.module('../lib/config.js', {
  namedExports: { ENV_ID: 'test-env' },
});
mock.module('../tcapi.js', {
  namedExports: { tcRequest: mock.fn(async () => ({ Users: [] })) },
});
mock.module('../lib/users.js', {
  namedExports: { mapUser: () => ({}) },
});
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
      if (p.includes('nomination_pool')) return st.pool;
      if (p.includes('film_week_votes')) return st.weekVotes;
      return [];
    }),
  },
});

const { meRoutes } = await import('./me.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  meRoutes(app);
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

test('GET /api/me/stats: no bearer → 401', async () => {
  st.ident = { uid: 'u1', role: 'user' };
  await withServer(async (base) => {
    const r = await fetch(`${base}/api/me/stats`);
    assert.equal(r.status, 401);
    assert.equal((await r.json()).error, 'unauthorized');
  });
});

test('GET /api/me/stats: unique past nights + watch intersection + week votes', async () => {
  st.ident = { uid: 'u1', role: 'user' };
  st.screenings = [
    { screen_date: '2020-01-15', film_ids: ['a', 'b'] },
    { screen_date: '2020-02-01', film_ids: ['a'] },
    { screen_date: '2099-01-01', film_ids: ['soon'] },
  ];
  st.films = [
    { id: 'a', duration: 100 },
    { id: 'b', duration: 50 },
  ];
  st.watches = [{ film_id: 'a' }, { film_id: 'home' }];
  st.pool = [{ film_id: 'a' }, { film_id: 'a' }, { film_id: 'c' }];
  st.weekVotes = [{ count: 2 }, { count: 4 }];

  await withServer(async (base) => {
    const r = await fetch(`${base}/api/me/stats`, {
      headers: { Authorization: 'Bearer tok' },
    });
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body.totalScreenedCount, 2);
    assert.equal(body.totalScreenedMinutes, 150);
    assert.equal(body.watchedCount, 1);
    assert.equal(body.watchedMinutes, 100);
    assert.equal(body.unwatchedCount, 1);
    assert.equal(body.unwatchedMinutes, 50);
    assert.equal(body.nominations, 2);
    assert.equal(body.votes, 6);
    assert.deepEqual(body.monthly, [
      { yearMonth: '2020-01', minutes: 150, filmCount: 2 },
    ]);
  });
});
