import * as NetlifyAPI from '../API/NetlifyAPI.js';
import { getNetlifyCredentials, notConnected } from '../Shared/Common.js';

export async function executeNetlifyChatTool(ctx, toolName, params) {
  const creds = getNetlifyCredentials(ctx);
  if (!creds) return notConnected();
  try {
    if (toolName === 'netlify_list_sites') {
      const sites = await NetlifyAPI.listSites(creds);
      return { ok: true, sites };
    }
    return null;
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
