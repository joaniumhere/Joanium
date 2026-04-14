export function getSpotifyCredentials(ctx) {
  const creds = ctx.connectorEngine?.getCredentials('spotify');
  return creds?.accessToken ? creds : null;
}
export function requireSpotifyCredentials(ctx) {
  const creds = getSpotifyCredentials(ctx);
  if (!creds)
    throw new Error('Spotify not connected. Complete the OAuth flow in Settings → Connectors.');
  return creds;
}
export function notConnected() {
  return {
    ok: false,
    error: 'Spotify is not connected. Please connect via OAuth in Settings → Connectors.',
  };
}
