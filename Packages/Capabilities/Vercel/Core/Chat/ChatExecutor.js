import * as VercelAPI from '../API/VercelAPI.js';
import { getVercelCredentials, notConnected } from '../Shared/Common.js';

export async function executeVercelChatTool(ctx, toolName, params) {
  const creds = getVercelCredentials(ctx);
  if (!creds) return notConnected();
  try {
    if (toolName === 'vercel_list_projects') {
      const projects = await VercelAPI.listProjects(creds);
      return { ok: true, projects };
    }
    return null;
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
