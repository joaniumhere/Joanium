import * as LinearAPI from '../API/LinearAPI.js';
import { requireLinearCredentials } from '../Shared/Common.js';

const PRIORITY_LABELS = { 0: 'No priority', 1: 'Urgent', 2: 'High', 3: 'Medium', 4: 'Low' };

export const linearDataSourceCollectors = {
  async linear_my_issues(ctx) {
    const creds = requireLinearCredentials(ctx);
    const issues = await LinearAPI.listMyIssues(creds, 25);
    if (!issues.length) return 'EMPTY: No assigned Linear issues found.';
    return `Linear — My Issues (${issues.length}):\n\n${issues
      .map(
        (iss, i) =>
          `${i + 1}. [${iss.state?.name ?? 'unknown'}] ${iss.title} — ${PRIORITY_LABELS[iss.priority] ?? 'unknown'} priority (${iss.team?.name ?? 'no team'})`,
      )
      .join('\n')}`;
  },
};

export const linearOutputHandlers = {};
