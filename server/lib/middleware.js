/**
 * Express middleware — extracted so index.js stays a thin route/runtime shell.
 */

/** Public read API. Echo the request origin (instead of a wildcard) so the
 *  signed voter cookie works cross-origin in local dev; same-origin production
 *  traffic is unaffected. */
export function corsMiddleware(req, res, next) {
  const origin = req.headers.origin;
  res.setHeader('Access-Control-Allow-Origin', origin || '*');
  if (origin) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
}

/** Hardening headers. */
export function securityHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  next();
}

/** Unified JSON error handler (routes call next(e); tcRequest sets .status/.code). */
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  const status = typeof err?.status === 'number' ? err.status : 500;
  const body = { error: err?.code || (status >= 500 ? 'server_error' : 'error') };
  if (status >= 500 && err?.message) body.message = err.message;
  if (!res.headersSent) res.status(status).json(body);
}

/** Wrap an async route handler so thrown/rejected errors flow to next(err). */
export function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}