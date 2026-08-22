import cloudbase from '@cloudbase/js-sdk';

/**
 * CloudBase JS SDK singleton.
 * Env id is public information — baked in as the default so container builds
 * without a .env still work; VITE_CLOUDBASE_ENV_ID overrides it locally.
 * Data reads go through the CloudRun API service (see repository.ts);
 * this client exists for the admin auth flow (auth.signInWithPassword).
 */
export const CLOUDBASE_ENV_ID =
  (import.meta.env.VITE_CLOUDBASE_ENV_ID as string | undefined) || 'a213-d4gzgo1mn873d99da';

let cbApp: ReturnType<typeof cloudbase.init> | null = null;
try {
  cbApp = cloudbase.init({ env: CLOUDBASE_ENV_ID });
} catch (err) {
  // Never let SDK init failure take down the whole React tree — the public
  // site works without it (static seed + API service).
  console.warn('[cloudbase] init failed, admin auth unavailable:', err);
}

export const auth = cbApp?.auth;
