import cloudbase from '@cloudbase/js-sdk';

/**
 * CloudBase JS SDK singleton (PG mode).
 * Reads the env id from VITE_CLOUDBASE_ENV_ID (.env, gitignored).
 */
const app = cloudbase.init({
  env: import.meta.env.VITE_CLOUDBASE_ENV_ID as string,
  // Publishable key — public anon credential for browser PG access (RLS-scoped).
  accessKey: import.meta.env.VITE_CLOUDBASE_ACCESS_KEY as string,
});

export const cbApp = app;
export const auth = app.auth;
export const rdb = app.rdb();
