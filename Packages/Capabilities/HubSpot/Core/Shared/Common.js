export function getHubSpotCredentials(ctx) {
  const creds = ctx.connectorEngine?.getCredentials('hubspot');
  return creds?.token ? creds : null;
}
export function requireHubSpotCredentials(ctx) {
  const creds = getHubSpotCredentials(ctx);
  if (!creds)
    throw new Error('HubSpot not connected. Add your Private App Token in Settings → Connectors.');
  return creds;
}
export function notConnected() {
  return {
    ok: false,
    error: 'HubSpot is not connected. Please add your Private App Token in Settings → Connectors.',
  };
}
