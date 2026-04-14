import * as CloudflareAPI from '../API/CloudflareAPI.js';
import { requireCloudflareCredentials } from '../Shared/Common.js';

export const cloudflareDataSourceCollectors = {
  async cloudflare_zones(ctx) {
    const creds = requireCloudflareCredentials(ctx);
    const zones = await CloudflareAPI.listZones(creds);
    if (!zones.length) return 'EMPTY: No Cloudflare zones found.';
    return `Cloudflare Zones — ${zones.length} domains:\n\n${zones
      .map((z, i) => `${i + 1}. ${z.name} — ${z.status} (${z.plan})`)
      .join('\n')}`;
  },
};

export const cloudflareOutputHandlers = {};
