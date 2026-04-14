export function getSupabaseCredentials(ctx) {
  const creds = ctx.connectorEngine?.getCredentials('supabase');
  return creds?.token ? creds : null;
}
export function requireSupabaseCredentials(ctx) {
  const creds = getSupabaseCredentials(ctx);
  if (!creds)
    throw new Error('Supabase not connected. Add your Access Token in Settings → Connectors.');
  return creds;
}
export function notConnected() {
  return {
    ok: false,
    error: 'Supabase is not connected. Please add your Access Token in Settings → Connectors.',
  };
}
