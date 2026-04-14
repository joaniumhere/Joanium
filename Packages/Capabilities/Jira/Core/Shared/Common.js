export function getJiraCredentials(ctx) {
  const credentials = ctx.connectorEngine?.getCredentials('jira');
  return credentials?.email && credentials?.token && credentials?.siteUrl ? credentials : null;
}
export function requireJiraCredentials(ctx) {
  const credentials = getJiraCredentials(ctx);
  if (!credentials) throw new Error('Jira not connected');
  return credentials;
}
export function notConnected() {
  return {
    ok: false,
    error: 'Jira is not connected. Ask the user to connect it in Settings → Connectors.',
  };
}
export function jiraAuthHeader(creds) {
  const encoded = Buffer.from(`${creds.email}:${creds.token}`).toString('base64');
  return `Basic ${encoded}`;
}
