import * as JiraAPI from '../API/JiraAPI.js';
import { getJiraCredentials, notConnected } from '../Shared/Common.js';

export async function executeJiraChatTool(ctx, toolName, params) {
  const creds = getJiraCredentials(ctx);
  if (!creds) return notConnected();
  try {
    if (toolName === 'jira_list_my_issues') {
      const issues = await JiraAPI.getMyOpenIssues(creds, 25);
      return { ok: true, issues };
    }
    return null;
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
