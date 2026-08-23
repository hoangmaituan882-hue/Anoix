/**
 * Minimal Tencent Cloud API v3 client for CloudBase (TCB) admin calls.
 *
 * Only the user-management actions are needed here. Credentials come from
 * env; when running inside CloudBase runtime the platform-injected
 * TENCENTCLOUD_* variables are picked up automatically.
 */
import crypto from 'node:crypto';

const SERVICE = 'tcb';
const VERSION = '2018-06-08';
const HOST = 'tcb.tencentcloudapi.com';

function getCreds() {
  return {
    secretId: process.env.TENCENT_SECRET_ID || process.env.TENCENTCLOUD_SECRETID || '',
    secretKey: process.env.TENCENT_SECRET_KEY || process.env.TENCENTCLOUD_SECRETKEY || '',
    token: process.env.TENCENT_SECRET_TOKEN || process.env.TENCENTCLOUD_SESSIONTOKEN || '',
  };
}

export function tcEnabled() {
  const c = getCreds();
  return Boolean(c.secretId && c.secretKey);
}

function hmac(key, msg) {
  return crypto.createHmac('sha256', key).update(msg, 'utf8').digest();
}
function sha256hex(msg) {
  return crypto.createHash('sha256').update(msg, 'utf8').digest('hex');
}

/**
 * Sign + send a TC API v3 request. Returns the parsed `Response` object.
 * Throws an Error with `.status` and `.code` on upstream errors.
 */
export async function tcRequest(action, params = {}, region = 'ap-shanghai') {
  const { secretId, secretKey, token } = getCreds();
  if (!secretId || !secretKey) {
    const err = new Error('TC credentials not configured (TENCENT_SECRET_ID / TENCENT_SECRET_KEY)');
    err.status = 503;
    err.code = 'tc_credentials_missing';
    throw err;
  }

  const payload = JSON.stringify(params);
  const timestamp = Math.floor(Date.now() / 1000);
  const date = new Date(timestamp * 1000).toISOString().slice(0, 10);

  const canonicalHeaders = `content-type:application/json; charset=utf-8\nhost:${HOST}\n`;
  const signedHeaders = 'content-type;host';
  const canonicalRequest = `POST\n/\n\n${canonicalHeaders}\n${signedHeaders}\n${sha256hex(payload)}`;
  const credentialScope = `${date}/${SERVICE}/tc3_request`;
  const stringToSign = `TC3-HMAC-SHA256\n${timestamp}\n${credentialScope}\n${sha256hex(canonicalRequest)}`;

  const secretDate = hmac('TC3' + secretKey, date);
  const secretService = hmac(secretDate, SERVICE);
  const secretSigning = hmac(secretService, 'tc3_request');
  const signature = crypto.createHmac('sha256', secretSigning).update(stringToSign, 'utf8').digest('hex');
  const authorization =
    `TC3-HMAC-SHA256 Credential=${secretId}/${credentialScope}, SignedHeaders=${signedHeaders}, Signature=${signature}`;

  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    Host: HOST,
    'X-TC-Action': action,
    'X-TC-Version': VERSION,
    'X-TC-Timestamp': String(timestamp),
    'X-TC-Region': region,
    Authorization: authorization,
  };
  if (token) headers['X-TC-Token'] = token;

  const r = await fetch(`https://${HOST}/`, { method: 'POST', headers, body: payload });
  const text = await r.text();
  let json = null;
  try { json = JSON.parse(text); } catch { /* keep null */ }

  const tcError = json?.Response?.Error;
  if (!r.ok || tcError) {
    const err = new Error(tcError?.Message || `TC ${action} ${r.status}: ${text.slice(0, 200)}`);
    err.status = tcError ? 502 : r.status;
    err.code = tcError?.Code;
    throw err;
  }
  return json?.Response ?? json;
}
