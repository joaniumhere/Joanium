import * as StripeAPI from '../API/StripeAPI.js';
import { getStripeCredentials, notConnected } from '../Shared/Common.js';

export async function executeStripeChatTool(ctx, toolName, params) {
  const creds = getStripeCredentials(ctx);
  if (!creds) return notConnected();
  try {
    if (toolName === 'stripe_get_balance') {
      const balance = await StripeAPI.getBalance(creds);
      return { ok: true, balance };
    }
    if (toolName === 'stripe_list_charges') {
      const charges = await StripeAPI.listCharges(creds, 10);
      return { ok: true, charges };
    }
    return null;
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
