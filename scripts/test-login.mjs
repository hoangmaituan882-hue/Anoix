// Probe: can an authenticated admin access_token drive the PG REST API?
// (Would bypass the broken API-key issuance path entirely.)
import cloudbase from '@cloudbase/js-sdk';

const timeout = setTimeout(() => {
  console.error('TIMEOUT');
  process.exit(2);
}, 15000);

const app = cloudbase.init({ env: 'a213-d4gzgo1mn873d99da' });
try {
  const { data, error } = await app.auth.signInWithPassword({ username: 'admin', password: 'l2sg9huc5CucVyb2' });
  if (error) throw error;
  const session = data?.session;
  const token = session?.access_token;
  console.log('session keys:', session ? Object.keys(session) : 'NONE');
  console.log('token prefix:', token ? token.slice(0, 30) + '...' : 'MISSING');

  const r = await fetch('https://a213-d4gzgo1mn873d99da.api.tcloudbasegateway.com/v1/rdb/rest/v1/films?select=id,title_zh&limit=2', {
    headers: { Authorization: `Bearer ${token}` },
  });
  console.log('PG REST status:', r.status);
  console.log((await r.text()).slice(0, 300));
  clearTimeout(timeout);
  process.exit(0);
} catch (e) {
  clearTimeout(timeout);
  console.error('ERROR:', e?.message ?? e);
  process.exit(1);
}
