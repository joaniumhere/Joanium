export function getStripeCredentials(ctx) {
  const creds = ctx.connectorEngine?.getCredentials('stripe');
  return creds?.token ? creds : null;
}
export function requireStripeCredentials(ctx) {
  const creds = getStripeCredentials(ctx);
  if (!creds)
    throw new Error('Stripe not connected. Add your Secret Key in Settings → Connectors.');
  return creds;
}
export function notConnected() {
  return {
    ok: false,
    error: 'Stripe is not connected. Please add your Secret Key in Settings → Connectors.',
  };
}
