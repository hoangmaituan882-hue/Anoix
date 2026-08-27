import express from 'express';
import path from 'node:path';
import { tmdbRouter } from './tmdb.js';
import { allowRate, clientIp } from './auth.js';
import { corsMiddleware, securityHeaders, errorHandler } from './lib/middleware.js';
import { DIST_DIR, PORT, ENV_ID } from './lib/config.js';
import { contentRoutes } from './routes/content.js';
import { votingRoutes } from './routes/voting.js';
import { adminRoutes } from './routes/admin.js';
import { socialRoutes } from './routes/social.js';
import { meRoutes } from './routes/me.js';

const app = express();
app.use(express.json());
app.use(corsMiddleware);
app.use(securityHeaders);

contentRoutes(app);
votingRoutes(app);
adminRoutes(app);
socialRoutes(app);
meRoutes(app);

// ---- TMDB proxy (open to all for nomination scraping; rate-limited) ----
function tmdbGate(req, res, next) {
  if (!allowRate(`tmdb:${clientIp(req)}`, 20, 60_000)) {
    return res.status(429).json({ error: 'rate_limited' });
  }
  next();
}
app.use('/api/tmdb', tmdbGate, tmdbRouter);

// ---- Static frontend + SPA fallback (after API routes) ----
app.use(express.static(DIST_DIR));
app.get(/^(?!\/api).*/, (_req, res) => {
  res.sendFile(path.join(DIST_DIR, 'index.html'));
});

// Unified JSON error handler (routes call next(e); tcRequest sets .status/.code)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[anoix] web+api listening on :${PORT}, env=${ENV_ID}, dist=${DIST_DIR}`);
});