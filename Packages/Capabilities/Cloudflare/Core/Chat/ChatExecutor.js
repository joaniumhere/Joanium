import * as CloudflareAPI from '../API/CloudflareAPI.js';
import { getCloudflareCredentials, notConnected } from '../Shared/Common.js';

export async function executeCloudflareChatTool(ctx, toolName, params) {
  const creds = getCloudflareCredentials(ctx);
  if (!creds) return notConnected();
  try {
    if (toolName === 'cloudflare_list_zones') {
      const zones = await CloudflareAPI.listZones(creds);
      return { ok: true, zones };
    }
    return null;
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
