import * as StripeAPI from '../API/StripeAPI.js';
import { requireStripeCredentials } from '../Shared/Common.js';

function fmt(amount, currency) {
  return `${currency} ${amount.toFixed(2)}`;
}

export const stripeDataSourceCollectors = {
  async stripe_balance_and_charges(ctx) {
    const creds = requireStripeCredentials(ctx);
    const [balance, charges] = await Promise.all([
      StripeAPI.getBalance(creds),
      StripeAPI.listCharges(creds, 10),
    ]);
    const availStr = balance.available.map((a) => fmt(a.amount, a.currency)).join(', ') || 'N/A';
    const pendingStr = balance.pending.map((p) => fmt(p.amount, p.currency)).join(', ') || 'N/A';
    return [
      `Stripe Balance — Available: ${availStr} | Pending: ${pendingStr}`,
      '',
      `Recent Charges (${charges.length}):`,
      ...charges.map(
        (c, i) =>
          `${i + 1}. ${fmt(c.amount, c.currency)} — ${c.status}${c.receiptEmail ? ` to ${c.receiptEmail}` : ''}${c.description ? ` (${c.description})` : ''}`,
      ),
    ].join('\n');
  },
};

export const stripeOutputHandlers = {};
