import * as JiraAPI from '../API/JiraAPI.js';
import { requireJiraCredentials } from '../Shared/Common.js';

export const jiraDataSourceCollectors = {
  async jira_my_issues(ctx) {
    const creds = requireJiraCredentials(ctx);
    const issues = await JiraAPI.getMyOpenIssues(creds, 25);
    if (!issues.length) return 'EMPTY: No open Jira issues assigned to you.';
    return `Jira — My Open Issues (${issues.length}):\n\n${issues
      .map(
        (iss, i) =>
          `${i + 1}. [${iss.key}] ${iss.summary} — ${iss.status} / ${iss.priority} (${iss.project})`,
      )
      .join('\n')}`;
  },
};

export const jiraOutputHandlers = {};
