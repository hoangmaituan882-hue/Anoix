/**
 * Centralized env config — single source of truth for env-derived values.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const ENV_ID = process.env.CLOUDBASE_ENV_ID;
export const ADMIN_USERNAME = process.env.ADMIN_USERNAME;
export const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
export const PG_BASE = `https://${ENV_ID}.api.tcloudbasegateway.com/v1/rdb/rest/v1`;
export const PORT = Number(process.env.PORT || 8080);
export const DIST_DIR = path.resolve(__dirname, '../../dist');

// Degrade gracefully instead of crash-looping: without admin credentials the
// data APIs return 503 while the static site keeps serving (frontend has a
// static fallback).
export const dbEnabled = Boolean(ENV_ID && ADMIN_USERNAME && ADMIN_PASSWORD);