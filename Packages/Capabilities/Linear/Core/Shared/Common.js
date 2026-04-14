export function getLinearCredentials(ctx) {
  const credentials = ctx.connectorEngine?.getCredentials('linear');
  return credentials?.token ? credentials : null;
}
export function requireLinearCredentials(ctx) {
  const credentials = getLinearCredentials(ctx);
  if (!credentials) throw new Error('Linear not connected');
  return credentials;
}
export function notConnected() {
  return {
    ok: false,
    error: 'Linear is not connected. Ask the user to connect it in Settings → Connectors.',
  };
}
