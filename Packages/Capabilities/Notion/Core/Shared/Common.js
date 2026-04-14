export function getNotionCredentials(ctx) {
  const credentials = ctx.connectorEngine?.getCredentials('notion');
  return credentials?.token ? credentials : null;
}
export function requireNotionCredentials(ctx) {
  const credentials = getNotionCredentials(ctx);
  if (!credentials) throw new Error('Notion not connected');
  return credentials;
}
export function notConnected() {
  return {
    ok: false,
    error: 'Notion is not connected. Ask the user to connect it in Settings → Connectors.',
  };
}
