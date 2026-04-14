export function getVercelCredentials(ctx) {
  const credentials = ctx.connectorEngine?.getCredentials('vercel');
  return credentials?.token ? credentials : null;
}
export function requireVercelCredentials(ctx) {
  const credentials = getVercelCredentials(ctx);
  if (!credentials) throw new Error('Vercel not connected');
  return credentials;
}
export function notConnected() {
  return {
    ok: false,
    error: 'Vercel is not connected. Ask the user to connect it in Settings → Connectors.',
  };
}
