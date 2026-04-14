export function getCanvaCredentials(ctx) {
  const credentials = ctx.connectorEngine?.getCredentials('canva');
  return credentials?.accessToken ? credentials : null;
}
export function requireCanvaCredentials(ctx) {
  const credentials = getCanvaCredentials(ctx);
  if (!credentials) throw new Error('Canva not connected');
  return credentials;
}
export function notConnected() {
  return {
    ok: false,
    error: 'Canva is not connected. Ask the user to connect it in Settings → Connectors.',
  };
}
