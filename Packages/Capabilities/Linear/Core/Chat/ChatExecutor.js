import * as LinearAPI from '../API/LinearAPI.js';
import { getLinearCredentials, notConnected } from '../Shared/Common.js';

export async function executeLinearChatTool(ctx, toolName, params) {
  const creds = getLinearCredentials(ctx);
  if (!creds) return notConnected();
  try {
    if (toolName === 'linear_list_my_issues') {
      const issues = await LinearAPI.listMyIssues(creds, 25);
      return { ok: true, issues };
    }
    return null;
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
