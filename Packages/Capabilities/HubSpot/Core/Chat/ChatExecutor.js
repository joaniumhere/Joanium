import * as HubSpotAPI from '../API/HubSpotAPI.js';
import { getHubSpotCredentials, notConnected } from '../Shared/Common.js';

export async function executeHubSpotChatTool(ctx, toolName, params) {
  const creds = getHubSpotCredentials(ctx);
  if (!creds) return notConnected();
  try {
    if (toolName === 'hubspot_list_contacts') {
      const contacts = await HubSpotAPI.listContacts(creds, 20);
      return { ok: true, contacts };
    }
    if (toolName === 'hubspot_list_deals') {
      const deals = await HubSpotAPI.listDeals(creds, 20);
      return { ok: true, deals };
    }
    return null;
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
