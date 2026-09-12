// Run from the repository root:
// node --env-file=.env.social.local social/instagram/check-connection.mjs
// Read-only: never publishes, refreshes credentials, or prints secrets.
const token = process.env.INSTAGRAM_ACCESS_TOKEN;
const account = process.env.INSTAGRAM_USER_ID;
if (!token || !account) throw new Error('Missing Instagram configuration');
async function read(path, fields) {
  const url = new URL(`https://graph.instagram.com/v26.0/${path}`);
  if (fields) url.searchParams.set('fields', fields);
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
    signal: AbortSignal.timeout(15000),
  });
  const body = await response.json();
  if (!response.ok) throw new Error(`Instagram request failed: HTTP ${response.status}, code ${body.error?.code ?? 'unknown'}`);
  return body;
}
const profile = await read('me', 'user_id,username');
if (String(profile.user_id) !== account || profile.username !== 'mindvortex.pro') {
  throw new Error('Account mismatch: refusing to continue');
}
const limit = await read(`${account}/content_publishing_limit`);
console.log(JSON.stringify({
  verifiedAt: new Date().toISOString(),
  username: profile.username,
  accountId: profile.user_id,
  publishingLimitReadable: true,
  quotaUsage: limit.data?.[0]?.quota_usage ?? null,
  actualPublicationTested: false,
}, null, 2));
