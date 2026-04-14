import * as CanvaAPI from '../API/CanvaAPI.js';
import { getCanvaCredentials, notConnected } from '../Shared/Common.js';

export async function executeCanvaChatTool(ctx, toolName, params) {
  const creds = getCanvaCredentials(ctx);
  if (!creds) return notConnected();
  try {
    if (toolName === 'canva_list_designs') {
      const designs = await CanvaAPI.listDesigns(creds);
      return { ok: true, designs };
    }
    return null;
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
