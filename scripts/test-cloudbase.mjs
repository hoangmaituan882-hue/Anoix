// Quick connectivity probe for the CloudBase PG data path.
import cloudbase from '@cloudbase/js-sdk';
import { readFileSync } from 'node:fs';

const envFile = readFileSync(new URL('../.env', import.meta.url), 'utf-8');
const envVal = (key) => envFile.match(new RegExp(`^${key}=(.*)$`, 'm'))?.[1]?.trim();

const app = cloudbase.init({
  env: envVal('VITE_CLOUDBASE_ENV_ID'),
  accessKey: envVal('VITE_CLOUDBASE_ACCESS_KEY'),
});

const rdb = app.rdb();
const res = await rdb.from('films').select('id, title, title_zh').limit(3);
console.log('error:', res.error);
console.log('rows:', JSON.stringify(res.data, null, 2));
