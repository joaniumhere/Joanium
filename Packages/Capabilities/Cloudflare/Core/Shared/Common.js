export function getCloudflareCredentials(ctx) {
  const credentials = ctx.connectorEngine?.getCredentials('cloudflare');
  return credentials?.token ? credentials : null;
}
export function requireCloudflareCredentials(ctx) {
  const credentials = getCloudflareCredentials(ctx);
  if (!credentials) throw new Error('Cloudflare not connected');
  return credentials;
}
export function notConnected() {
  return {
    ok: false,
    error: 'Cloudflare is not connected. Ask the user to connect it in Settings → Connectors.',
  };
}
