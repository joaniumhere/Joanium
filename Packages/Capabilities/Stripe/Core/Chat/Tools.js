export const STRIPE_TOOLS = [
  {
    name: 'stripe_get_balance',
    description:
      'Get the current Stripe account balance — available and pending amounts by currency.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {},
  },
  {
    name: 'stripe_list_charges',
    description:
      'List the most recent Stripe charges with amount, currency, status, and receipt email.',
    category: 'stripe',
    connectorId: 'stripe',
    parameters: {},
  },
];
