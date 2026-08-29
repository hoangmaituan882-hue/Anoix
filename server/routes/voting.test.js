/**
 * Integration test for the voting route — mocks the lib deps (db/identity/quota/auth)
 * and exercises the endpoint error branches through a real Express app.
 */
import { test, mock } from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { errorHandler } from '../lib/middleware.js';

// Shared mutable state the mocked deps read from — each test tweaks it.
const st = {
  identity: null,                       // resolveIdentity result
  quota: { remainingVotes: 6, remainingNominations: 3 },
  round: { id: 'r1', status: 'voting', deadline: null },
  option: { id: 1, round_id: 'r1' },
  pgWriteStatus: 200,                   // what pgWrite returns as [status]
  film: { id: 'f1', screening_date: null },
  screenings: [],
  weekVotes: [],
};

mock.module('../lib/db.js', {
  namedExports: {
    pgGet: mock.fn(async (path) => {
      const p = String(path);
      if (p.includes('film_week_votes')) return st.weekVotes ?? [];
      if (p.includes('nomination_rounds')) return st.round ? [st.round] : [];
      if (p.includes('nomination_options')) return st.option ? [st.option] : [];
      if (p.includes('/votes')) return st.round ? [] : [];
      if (p.includes('/films')) return st.film ? [st.film] : [];
      if (p.includes('screenings')) return st.screenings ?? [];
      return [];
    }),
    pgWrite: mock.fn(async () => [st.pgWriteStatus, {}]),
  },
});
mock.module('../lib/identity.js', {
  namedExports: {
    resolveIdentity: mock.fn(async () => st.identity),
    resolveVoter: mock.fn(async () => st.identity?.identityId ?? null),
  },
});
mock.module('../lib/quota.js', {
  namedExports: {
    QUOTA_LIMITS: { user: { nominations: 3, votes: 6 }, anon: { nominations: 1, votes: 2 } },
    quotaInfo: mock.fn(async () => ({ kind: 'anon', remainingVotes: st.quota.remainingVotes, remainingNominations: st.quota.remainingNominations })),
    bumpQuota: mock.fn(async () => {}),
    unbumpQuota: mock.fn(async () => {}),
  },
});
mock.module('../auth.js', {
  namedExports: {
    issueVoterCookie: () => {},
    allowRate: () => true,
    clientIp: () => '127.0.0.1',
  },
});

const { votingRoutes } = await import('./voting.js');

function buildApp() {
  const app = express();
  app.use(express.json());
  votingRoutes(app);
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

const postVote = (base, body) =>
  fetch(`${base}/api/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(async (r) => ({ status: r.status, body: await r.json() }));

test('POST /api/vote: empty body → 400 bad_request', async () => {
  await withServer(async (base) => {
    const r = await postVote(base, {});
    assert.equal(r.status, 400);
    assert.equal(r.body.error, 'bad_request');
  });
});

test('POST /api/vote: no identity → 401', async () => {
  st.identity = null;
  await withServer(async (base) => {
    const r = await postVote(base, { roundId: 'r1', optionId: 1 });
    assert.equal(r.status, 401);
    assert.equal(r.body.error, 'identity_required');
  });
});

test('POST /api/vote: quota exhausted → 429', async () => {
  st.identity = { identityId: 'u1', kind: 'user' };
  st.quota.remainingVotes = 0;
  await withServer(async (base) => {
    const r = await postVote(base, { roundId: 'r1', optionId: 1 });
    assert.equal(r.status, 429);
    assert.equal(r.body.error, 'quota_exceeded');
  });
});

test('POST /api/vote: round not voting → 409', async () => {
  st.identity = { identityId: 'u1', kind: 'user' };
  st.quota.remainingVotes = 6;
  st.round = { id: 'r1', status: 'collecting', deadline: null };
  await withServer(async (base) => {
    const r = await postVote(base, { roundId: 'r1', optionId: 1 });
    assert.equal(r.status, 409);
    assert.equal(r.body.error, 'not_voting');
  });
});

test('POST /api/vote: success → 200', async () => {
  st.identity = { identityId: 'u1', kind: 'user' };
  st.quota.remainingVotes = 6;
  st.round = { id: 'r1', status: 'voting', deadline: null };
  st.option = { id: 1, round_id: 'r1' };
  st.pgWriteStatus = 200;
  await withServer(async (base) => {
    const r = await postVote(base, { roundId: 'r1', optionId: 1 });
    assert.equal(r.status, 200);
    assert.deepEqual(r.body, { ok: true });
  });
});

test('GET /api/nominations: empty → 200', async () => {
  await withServer(async (base) => {
    const r = await fetch(`${base}/api/nominations`).then(async (x) => ({ status: x.status, body: await x.json() }));
    assert.equal(r.status, 200);
    assert.ok(Array.isArray(r.body));
  });
});

test('POST /api/vote filmId: stacks +1 → 200', async () => {
  st.identity = { identityId: 'u1', kind: 'user' };
  st.quota.remainingVotes = 6;
  st.film = { id: 'f1', screening_date: null };
  st.screenings = [];
  st.weekVotes = [];
  st.pgWriteStatus = 200;
  await withServer(async (base) => {
    const r = await postVote(base, { filmId: 'f1' });
    assert.equal(r.status, 200);
    assert.deepEqual(r.body, { ok: true, count: 1 });
  });
});

test('POST /api/vote filmId: already screened → 409', async () => {
  st.identity = { identityId: 'u1', kind: 'user' };
  st.quota.remainingVotes = 6;
  st.film = { id: 'f1', screening_date: null };
  st.screenings = [{ screen_date: '2020-01-01', film_ids: ['f1'] }];
  await withServer(async (base) => {
    const r = await postVote(base, { filmId: 'f1' });
    assert.equal(r.status, 409);
    assert.equal(r.body.error, 'already_screened');
  });
});

test('POST /api/vote filmId: missing film → 404', async () => {
  st.identity = { identityId: 'u1', kind: 'user' };
  st.quota.remainingVotes = 6;
  st.film = null;
  st.screenings = [];
  await withServer(async (base) => {
    const r = await postVote(base, { filmId: 'nope' });
    assert.equal(r.status, 404);
    assert.equal(r.body.error, 'film_not_found');
  });
});
