import * as HubSpotAPI from '../API/HubSpotAPI.js';
import { requireHubSpotCredentials } from '../Shared/Common.js';

export const hubspotDataSourceCollectors = {
  async hubspot_deals(ctx) {
    const creds = requireHubSpotCredentials(ctx);
    const deals = await HubSpotAPI.listDeals(creds, 20);
    if (!deals.length) return 'EMPTY: No HubSpot deals found.';
    return `HubSpot Deals — ${deals.length} recent:\n\n${deals
      .map(
        (d, i) =>
          `${i + 1}. ${d.name} — ${d.stage}${d.amount != null ? ` ($${d.amount.toLocaleString()})` : ''}${d.closeDate ? ` closes ${new Date(d.closeDate).toLocaleDateString()}` : ''}`,
      )
      .join('\n')}`;
  },
};

export const hubspotOutputHandlers = {};
