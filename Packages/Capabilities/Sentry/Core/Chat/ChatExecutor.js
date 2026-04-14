import * as SentryAPI from '../API/SentryAPI.js';
import { getSentryCredentials, notConnected } from '../Shared/Common.js';

export async function executeSentryChatTool(ctx, toolName, params) {
  const creds = getSentryCredentials(ctx);
  if (!creds) return notConnected();
  try {
    if (toolName === 'sentry_list_issues') {
      const orgSlug = creds.orgSlug;
      if (!orgSlug) return { ok: false, error: 'No organization found. Please reconnect Sentry.' };
      const issues = await SentryAPI.listIssues(creds, orgSlug, 25);
      return { ok: true, issues };
    }
    return null;
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
