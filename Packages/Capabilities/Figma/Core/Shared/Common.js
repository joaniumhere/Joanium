export function getFigmaCredentials(ctx) {
  const credentials = ctx.connectorEngine?.getCredentials('figma');
  return credentials?.token ? credentials : null;
}
export function requireFigmaCredentials(ctx) {
  const credentials = getFigmaCredentials(ctx);
  if (!credentials) throw new Error('Figma not connected');
  return credentials;
}
export function notConnected() {
  return {
    ok: false,
    error: 'Figma is not connected. Ask the user to connect it in Settings → Connectors.',
  };
}
