import * as LinearAPI from '../API/LinearAPI.js';
import { getLinearCredentials, notConnected } from '../Shared/Common.js';

export async function executeLinearChatTool(ctx, toolName, params) {
  const creds = getLinearCredentials(ctx);
  if (!creds) return notConnected();

  try {
    switch (toolName) {
      // ── Viewer ─────────────────────────────────────────────────────────────
      case 'linear_list_my_issues': {
        const issues = await LinearAPI.listMyIssues(creds, 25);
        return { ok: true, issues };
      }
      case 'linear_get_viewer': {
        const viewer = await LinearAPI.getViewer(creds);
        return { ok: true, viewer };
      }

      // ── Issues ─────────────────────────────────────────────────────────────
      case 'linear_get_issue': {
        const issue = await LinearAPI.getIssue(creds, params.id);
        return { ok: true, issue };
      }
      case 'linear_create_issue': {
        const { title, teamId, description, assigneeId, stateId, priority, labelIds, dueDate } =
          params;
        const input = { title, teamId };
        if (description !== undefined) input.description = description;
        if (assigneeId !== undefined) input.assigneeId = assigneeId;
        if (stateId !== undefined) input.stateId = stateId;
        if (priority !== undefined) input.priority = priority;
        if (labelIds !== undefined) input.labelIds = labelIds;
        if (dueDate !== undefined) input.dueDate = dueDate;
        const result = await LinearAPI.createIssue(creds, input);
        return { ok: result.success, issue: result.issue };
      }
      case 'linear_update_issue': {
        const { id, ...rest } = params;
        const input = {};
        const allowed = [
          'title',
          'description',
          'assigneeId',
          'stateId',
          'priority',
          'labelIds',
          'dueDate',
        ];
        for (const key of allowed) if (rest[key] !== undefined) input[key] = rest[key];
        const result = await LinearAPI.updateIssue(creds, id, input);
        return { ok: result.success, issue: result.issue };
      }
      case 'linear_delete_issue': {
        const result = await LinearAPI.deleteIssue(creds, params.id);
        return { ok: result.success };
      }
      case 'linear_archive_issue': {
        const result = await LinearAPI.archiveIssue(creds, params.id);
        return { ok: result.success };
      }
      case 'linear_search_issues': {
        const issues = await LinearAPI.searchIssues(creds, params.query, params.limit ?? 25);
        return { ok: true, issues };
      }
      case 'linear_assign_issue': {
        const result = await LinearAPI.updateIssue(creds, params.id, {
          assigneeId: params.assigneeId,
        });
        return { ok: result.success, issue: result.issue };
      }
      case 'linear_update_issue_state': {
        const result = await LinearAPI.updateIssue(creds, params.id, { stateId: params.stateId });
        return { ok: result.success, issue: result.issue };
      }
      case 'linear_update_issue_priority': {
        const result = await LinearAPI.updateIssue(creds, params.id, { priority: params.priority });
        return { ok: result.success, issue: result.issue };
      }
      case 'linear_set_issue_due_date': {
        const result = await LinearAPI.updateIssue(creds, params.id, {
          dueDate: params.dueDate ?? null,
        });
        return { ok: result.success, issue: result.issue };
      }

      // ── Comments ───────────────────────────────────────────────────────────
      case 'linear_list_comments': {
        const comments = await LinearAPI.listComments(creds, params.issueId);
        return { ok: true, comments };
      }
      case 'linear_add_comment': {
        const result = await LinearAPI.addComment(creds, params.issueId, params.body);
        return { ok: result.success, comment: result.comment };
      }
      case 'linear_update_comment': {
        const result = await LinearAPI.updateComment(creds, params.id, params.body);
        return { ok: result.success, comment: result.comment };
      }
      case 'linear_delete_comment': {
        const result = await LinearAPI.deleteComment(creds, params.id);
        return { ok: result.success };
      }

      // ── Teams ──────────────────────────────────────────────────────────────
      case 'linear_list_teams': {
        const teams = await LinearAPI.listTeams(creds);
        return { ok: true, teams };
      }
      case 'linear_get_team': {
        const team = await LinearAPI.getTeam(creds, params.id);
        return { ok: true, team };
      }
      case 'linear_list_team_members': {
        const members = await LinearAPI.listTeamMembers(creds, params.teamId);
        return { ok: true, members };
      }
      case 'linear_list_team_states': {
        const states = await LinearAPI.listTeamStates(creds, params.teamId);
        return { ok: true, states };
      }
      case 'linear_list_team_labels': {
        const labels = await LinearAPI.listTeamLabels(creds, params.teamId);
        return { ok: true, labels };
      }

      // ── Projects ───────────────────────────────────────────────────────────
      case 'linear_list_projects': {
        const projects = await LinearAPI.listProjects(creds, params.limit ?? 25);
        return { ok: true, projects };
      }
      case 'linear_get_project': {
        const project = await LinearAPI.getProject(creds, params.id);
        return { ok: true, project };
      }
      case 'linear_create_project': {
        const { name, teamIds, description, state } = params;
        const input = { name, teamIds };
        if (description !== undefined) input.description = description;
        if (state !== undefined) input.state = state;
        const result = await LinearAPI.createProject(creds, input);
        return { ok: result.success, project: result.project };
      }
      case 'linear_list_project_issues': {
        const issues = await LinearAPI.listProjectIssues(
          creds,
          params.projectId,
          params.limit ?? 25,
        );
        return { ok: true, issues };
      }

      // ── Members ────────────────────────────────────────────────────────────
      case 'linear_list_members': {
        const members = await LinearAPI.listMembers(creds, params.limit ?? 50);
        return { ok: true, members };
      }
      case 'linear_get_user': {
        const user = await LinearAPI.getUser(creds, params.id);
        return { ok: true, user };
      }

      // ── Cycles ─────────────────────────────────────────────────────────────
      case 'linear_list_cycles': {
        const cycles = await LinearAPI.listCycles(creds, params.teamId, params.limit ?? 10);
        return { ok: true, cycles };
      }
      case 'linear_get_cycle_issues': {
        const cycle = await LinearAPI.getCycleIssues(creds, params.cycleId, params.limit ?? 25);
        return { ok: true, cycle };
      }

      // ── Labels ─────────────────────────────────────────────────────────────
      case 'linear_list_labels': {
        const labels = await LinearAPI.listLabels(creds, params.limit ?? 50);
        return { ok: true, labels };
      }
      case 'linear_create_label': {
        const input = { name: params.name, teamId: params.teamId };
        if (params.color !== undefined) input.color = params.color;
        const result = await LinearAPI.createLabel(creds, input);
        return { ok: result.success, label: result.issueLabel };
      }

      default:
        return null;
    }
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
