import cloudbase from '@cloudbase/js-sdk';

/**
 * CloudBase JS SDK singleton.
 * Reads the env id from VITE_CLOUDBASE_ENV_ID (.env, gitignored).
 * Data reads go through the CloudRun API service (see repository.ts);
 * this client exists for the stage-4 admin auth flow (auth.signInWithPassword).
 */
const app = cloudbase.init({
  env: import.meta.env.VITE_CLOUDBASE_ENV_ID as string,
});

export const cbApp = app;
export const auth = app.auth;
