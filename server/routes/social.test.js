/**
 * GET /api/calendar — one event per club screening night.
 */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { errorHandler } from '../lib/middleware.js';

const st = { screenings: [], films: [] };

mock.module('../lib/db.js', {
  namedExports: {
    pgGet: mock.fn(async (path) => {
      const p = String(path);
      if (p.includes('screenings')) return st.screenings;
      if (p.includes('/films') || p.startsWith('/films')) return st.films;
      return [];
    }),
    pgWrite: mock.fn(async () => [200, {}]),
    pgUpsert: mock.fn(async () => [200, {}]),
    contentCache: { get: () => undefined, set: () => {}, delete: () => {}, clear: () => {} },
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

const { socialRoutes } = await import('./social.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  socialRoutes(app);
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

test('GET /api/calendar: one screening night, skip missing posters', async () => {
  st.screenings = [
    { id: 'n1', title: '', screen_date: '2026-08-01', venue: '厅A', theme: '', film_ids: ['a', 'gone'] },
  ];
  st.films = [{ id: 'a', title: 'A', title_zh: '甲', image: 'a.jpg', year: '2019' }];
  await withServer(async (base) => {
    const r = await fetch(`${base}/api/calendar`);
    assert.equal(r.status, 200);
    const body = await r.json();
    assert.equal(body.events.length, 1);
    assert.equal(body.events[0].id, 'n1');
    assert.equal(body.events[0].type, 'screening');
    assert.deepEqual(body.events[0].films.map((f) => f.id), ['a']);
    assert.equal(body.events[0].title, '2026年8月1日放映');
  });
});
