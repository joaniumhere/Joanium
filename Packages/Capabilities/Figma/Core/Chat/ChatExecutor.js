import * as FigmaAPI from '../API/FigmaAPI.js';
import { getFigmaCredentials, notConnected } from '../Shared/Common.js';

export async function executeFigmaChatTool(ctx, toolName, params) {
  const creds = getFigmaCredentials(ctx);
  if (!creds) return notConnected();
  try {
    if (toolName === 'figma_get_file_info') {
      if (!params?.file_key) return { ok: false, error: 'file_key is required' };
      const file = await FigmaAPI.getFile(creds, params.file_key);
      return { ok: true, file };
    }
    return null;
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
