import * as SupabaseAPI from '../API/SupabaseAPI.js';
import { getSupabaseCredentials, notConnected } from '../Shared/Common.js';

export async function executeSupabaseChatTool(ctx, toolName, params) {
  const creds = getSupabaseCredentials(ctx);
  if (!creds) return notConnected();
  try {
    if (toolName === 'supabase_list_projects') {
      const projects = await SupabaseAPI.listProjects(creds);
      return { ok: true, projects };
    }
    return null;
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
