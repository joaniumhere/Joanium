import * as SentryAPI from '../API/SentryAPI.js';
import { getSentryCredentials, notConnected } from '../Shared/Common.js';

export async function executeSentryChatTool(ctx, toolName, params) {
  const creds = getSentryCredentials(ctx);
  if (!creds) return notConnected();

  const orgSlug = creds.orgSlug;

  try {
    // ─── Issues ────────────────────────────────────────────────────────────────
    if (toolName === 'sentry_list_issues') {
      if (!orgSlug) return noOrg();
      const issues = await SentryAPI.listIssues(creds, orgSlug, 25);
      return { ok: true, issues };
    }

    if (toolName === 'sentry_get_issue') {
      if (!orgSlug) return noOrg();
      const issue = await SentryAPI.getIssue(creds, orgSlug, params.issueId);
      return { ok: true, issue };
    }

    if (toolName === 'sentry_resolve_issue') {
      if (!orgSlug) return noOrg();
      const result = await SentryAPI.resolveIssue(creds, orgSlug, params.issueId);
      return { ok: true, result };
    }

    if (toolName === 'sentry_ignore_issue') {
      if (!orgSlug) return noOrg();
      const result = await SentryAPI.ignoreIssue(creds, orgSlug, params.issueId);
      return { ok: true, result };
    }

    if (toolName === 'sentry_assign_issue') {
      if (!orgSlug) return noOrg();
      const result = await SentryAPI.assignIssue(creds, orgSlug, params.issueId, params.assignee);
      return { ok: true, result };
    }

    if (toolName === 'sentry_bulk_resolve_issues') {
      if (!orgSlug) return noOrg();
      const result = await SentryAPI.bulkUpdateIssues(creds, orgSlug, params.issueIds, {
        status: 'resolved',
      });
      return { ok: true, result };
    }

    if (toolName === 'sentry_search_issues') {
      if (!orgSlug) return noOrg();
      const issues = await SentryAPI.searchIssues(creds, orgSlug, params.query, params.limit ?? 25);
      return { ok: true, issues };
    }

    if (toolName === 'sentry_list_fatal_issues') {
      if (!orgSlug) return noOrg();
      const issues = await SentryAPI.listFatalIssues(creds, orgSlug, params.limit ?? 25);
      return { ok: true, issues };
    }

    // ─── Issue Events & Tags ───────────────────────────────────────────────────
    if (toolName === 'sentry_list_issue_events') {
      const events = await SentryAPI.listIssueEvents(creds, params.issueId, params.limit ?? 10);
      return { ok: true, events };
    }

    if (toolName === 'sentry_get_latest_event') {
      const event = await SentryAPI.getLatestEvent(creds, params.issueId);
      return { ok: true, event };
    }

    if (toolName === 'sentry_list_issue_tags') {
      const tags = await SentryAPI.listIssueTags(creds, params.issueId);
      return { ok: true, tags };
    }

    if (toolName === 'sentry_list_issue_hashes') {
      const hashes = await SentryAPI.listIssueHashes(creds, params.issueId);
      return { ok: true, hashes };
    }

    // ─── Projects ──────────────────────────────────────────────────────────────
    if (toolName === 'sentry_list_projects') {
      if (!orgSlug) return noOrg();
      const projects = await SentryAPI.listProjects(creds, orgSlug);
      return { ok: true, projects };
    }

    if (toolName === 'sentry_get_project') {
      if (!orgSlug) return noOrg();
      const project = await SentryAPI.getProject(creds, orgSlug, params.projectSlug);
      return { ok: true, project };
    }

    if (toolName === 'sentry_list_project_issues') {
      if (!orgSlug) return noOrg();
      const issues = await SentryAPI.listProjectIssues(
        creds,
        orgSlug,
        params.projectSlug,
        params.limit ?? 25,
      );
      return { ok: true, issues };
    }

    if (toolName === 'sentry_list_project_events') {
      if (!orgSlug) return noOrg();
      const events = await SentryAPI.listProjectEvents(
        creds,
        orgSlug,
        params.projectSlug,
        params.limit ?? 25,
      );
      return { ok: true, events };
    }

    if (toolName === 'sentry_list_project_releases') {
      if (!orgSlug) return noOrg();
      const releases = await SentryAPI.listProjectReleases(
        creds,
        orgSlug,
        params.projectSlug,
        params.limit ?? 25,
      );
      return { ok: true, releases };
    }

    if (toolName === 'sentry_list_alert_rules') {
      if (!orgSlug) return noOrg();
      const rules = await SentryAPI.listAlertRules(creds, orgSlug, params.projectSlug);
      return { ok: true, rules };
    }

    if (toolName === 'sentry_list_user_feedback') {
      if (!orgSlug) return noOrg();
      const feedback = await SentryAPI.listUserFeedback(
        creds,
        orgSlug,
        params.projectSlug,
        params.limit ?? 25,
      );
      return { ok: true, feedback };
    }

    if (toolName === 'sentry_list_dsym_files') {
      if (!orgSlug) return noOrg();
      const files = await SentryAPI.listDsymFiles(creds, orgSlug, params.projectSlug);
      return { ok: true, files };
    }

    // ─── Organizations ─────────────────────────────────────────────────────────
    if (toolName === 'sentry_list_organizations') {
      const organizations = await SentryAPI.listOrganizations(creds);
      return { ok: true, organizations };
    }

    if (toolName === 'sentry_get_organization') {
      if (!orgSlug) return noOrg();
      const organization = await SentryAPI.getOrganization(creds, orgSlug);
      return { ok: true, organization };
    }

    if (toolName === 'sentry_list_members') {
      if (!orgSlug) return noOrg();
      const members = await SentryAPI.listMembers(creds, orgSlug);
      return { ok: true, members };
    }

    if (toolName === 'sentry_list_environments') {
      if (!orgSlug) return noOrg();
      const environments = await SentryAPI.listEnvironments(creds, orgSlug);
      return { ok: true, environments };
    }

    if (toolName === 'sentry_get_org_stats') {
      if (!orgSlug) return noOrg();
      const stats = await SentryAPI.getOrgStats(creds, orgSlug);
      return { ok: true, stats };
    }

    // ─── Teams ─────────────────────────────────────────────────────────────────
    if (toolName === 'sentry_list_teams') {
      if (!orgSlug) return noOrg();
      const teams = await SentryAPI.listTeams(creds, orgSlug);
      return { ok: true, teams };
    }

    if (toolName === 'sentry_list_team_projects') {
      if (!orgSlug) return noOrg();
      const projects = await SentryAPI.listTeamProjects(creds, orgSlug, params.teamSlug);
      return { ok: true, projects };
    }

    // ─── Releases ──────────────────────────────────────────────────────────────
    if (toolName === 'sentry_list_org_releases') {
      if (!orgSlug) return noOrg();
      const releases = await SentryAPI.listOrgReleases(creds, orgSlug, params.limit ?? 25);
      return { ok: true, releases };
    }

    if (toolName === 'sentry_get_release') {
      if (!orgSlug) return noOrg();
      const release = await SentryAPI.getRelease(creds, orgSlug, params.version);
      return { ok: true, release };
    }

    if (toolName === 'sentry_list_deploys') {
      if (!orgSlug) return noOrg();
      const deploys = await SentryAPI.listDeploys(creds, orgSlug, params.version);
      return { ok: true, deploys };
    }

    return null; // unknown tool
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

function noOrg() {
  return { ok: false, error: 'No organization found. Please reconnect Sentry.' };
}
