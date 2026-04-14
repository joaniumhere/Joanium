export function getSentryCredentials(ctx) {
  const creds = ctx.connectorEngine?.getCredentials('sentry');
  return creds?.token ? creds : null;
}
export function requireSentryCredentials(ctx) {
  const creds = getSentryCredentials(ctx);
  if (!creds)
    throw new Error('Sentry not connected. Add your Auth Token in Settings → Connectors.');
  return creds;
}
export function notConnected() {
  return {
    ok: false,
    error: 'Sentry is not connected. Please add your Auth Token in Settings → Connectors.',
  };
}
