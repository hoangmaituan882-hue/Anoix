/**
 * Public lifetime club-watcher ranking. Optional Bearer fills `me`.
 */
import { asyncHandler } from '../lib/middleware.js';
import { pgGet, contentCache } from '../lib/db.js';
import { callerIdentity } from '../lib/identity.js';
import { shanghaiDateString, filmsByIdPath } from '../lib/catalog.js';
import { firstScreenedByFilm } from '../lib/meStats.js';
import { assembleRanking } from '../lib/ranking.js';

const TOP_N = 20;
const SRC_LIMIT = 10000;

async function loadRankingSource(today) {
  const cacheKey = `ranking:src:${today}`;
  const hit = contentCache.get(cacheKey);
  if (hit) return hit;

  const [screenings, members, watches] = await Promise.all([
    pgGet('/screenings?select=screen_date,film_ids'),
    pgGet(`/user_roles?select=uid,username,user_no&limit=${SRC_LIMIT}`),
    pgGet(`/watch_log?select=uid,film_id&limit=${SRC_LIMIT}`),
  ]);
  const filmPath = filmsByIdPath(
    [...firstScreenedByFilm(screenings, today).keys()],
    'id,duration',
  );
  const films = filmPath ? await pgGet(filmPath) : [];
  const src = {
    screenings: screenings || [],
    members: members || [],
    watchLogs: watches || [],
    films: films || [],
  };
  contentCache.set(cacheKey, src);
  return src;
}

export function rankingRoutes(app) {
  app.get('/api/ranking', asyncHandler(async (req, res) => {
    const today = shanghaiDateString();
    let viewerId = null;
    const authz = req.headers.authorization || '';
    if (authz.startsWith('Bearer ')) {
      const ident = await callerIdentity(authz.slice(7).trim());
      if (ident) viewerId = ident.uid;
    }
    const src = await loadRankingSource(today);
    res.json(assembleRanking({
      today,
      ...src,
      viewerId,
      topN: TOP_N,
    }));
  }));
}
