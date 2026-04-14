export function getNetlifyCredentials(ctx) {
  const credentials = ctx.connectorEngine?.getCredentials('netlify');
  return credentials?.token ? credentials : null;
}
export function requireNetlifyCredentials(ctx) {
  const credentials = getNetlifyCredentials(ctx);
  if (!credentials) throw new Error('Netlify not connected');
  return credentials;
}
export function notConnected() {
  return {
    ok: false,
    error: 'Netlify is not connected. Ask the user to connect it in Settings → Connectors.',
  };
}
