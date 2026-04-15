const ENDPOINT = 'https://api.linear.app/graphql';

function headers(creds) {
  return { Authorization: creds.token, 'Content-Type': 'application/json' };
}

async function gql(query, variables = {}, creds) {
  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: headers(creds),
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Linear API error: ${res.status}`);
  const data = await res.json();
  if (data.errors?.length) throw new Error(data.errors[0].message ?? 'Linear GraphQL error');
  return data.data;
}

// ── Viewer ────────────────────────────────────────────────────────────────────

export async function getViewer(creds) {
  const data = await gql(`{ viewer { id name email displayName } }`, {}, creds);
  return data.viewer;
}

// ── Issues ────────────────────────────────────────────────────────────────────

export async function listMyIssues(creds, limit = 25) {
  const data = await gql(
    `query($first: Int) {
      viewer {
        assignedIssues(first: $first, orderBy: updatedAt) {
          nodes { id title state { name } priority team { name } updatedAt url }
        }
      }
    }`,
    { first: limit },
    creds,
  );
  return data.viewer?.assignedIssues?.nodes ?? [];
}

export async function getIssue(creds, id) {
  const data = await gql(
    `query($id: String!) {
      issue(id: $id) {
        id title description state { id name } priority
        assignee { id name } team { id name } dueDate
        createdAt updatedAt url labelIds
      }
    }`,
    { id },
    creds,
  );
  return data.issue;
}

export async function createIssue(creds, input) {
  const data = await gql(
    `mutation($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success issue { id title url }
      }
    }`,
    { input },
    creds,
  );
  return data.issueCreate;
}

export async function updateIssue(creds, id, input) {
  const data = await gql(
    `mutation($id: String!, $input: IssueUpdateInput!) {
      issueUpdate(id: $id, input: $input) {
        success issue { id title url }
      }
    }`,
    { id, input },
    creds,
  );
  return data.issueUpdate;
}

export async function deleteIssue(creds, id) {
  const data = await gql(
    `mutation($id: String!) { issueDelete(id: $id) { success } }`,
    { id },
    creds,
  );
  return data.issueDelete;
}

export async function archiveIssue(creds, id) {
  const data = await gql(
    `mutation($id: String!) { issueArchive(id: $id) { success } }`,
    { id },
    creds,
  );
  return data.issueArchive;
}

export async function searchIssues(creds, query, limit = 25) {
  const data = await gql(
    `query($query: String!, $first: Int) {
      issueSearch(query: $query, first: $first) {
        nodes { id title state { name } priority assignee { name } team { name } url }
      }
    }`,
    { query, first: limit },
    creds,
  );
  return data.issueSearch?.nodes ?? [];
}

// ── Issue Relations (NEW) ─────────────────────────────────────────────────────

export async function listIssueRelations(creds, issueId) {
  const data = await gql(
    `query($id: String!) {
      issue(id: $id) {
        relations {
          nodes { id type relatedIssue { id title state { name } url } }
        }
        inverseRelations {
          nodes { id type issue { id title state { name } url } }
        }
      }
    }`,
    { id: issueId },
    creds,
  );
  return {
    relations: data.issue?.relations?.nodes ?? [],
    inverseRelations: data.issue?.inverseRelations?.nodes ?? [],
  };
}

export async function createIssueRelation(creds, issueId, relatedIssueId, type) {
  // type: "blocks" | "blocked_by" | "duplicate" | "duplicate_of" | "related"
  const data = await gql(
    `mutation($input: IssueRelationCreateInput!) {
      issueRelationCreate(input: $input) {
        success issueRelation { id type }
      }
    }`,
    { input: { issueId, relatedIssueId, type } },
    creds,
  );
  return data.issueRelationCreate;
}

export async function deleteIssueRelation(creds, id) {
  const data = await gql(
    `mutation($id: String!) { issueRelationDelete(id: $id) { success } }`,
    { id },
    creds,
  );
  return data.issueRelationDelete;
}

export async function unarchiveIssue(creds, id) {
  const data = await gql(
    `mutation($id: String!) { issueUnarchive(id: $id) { success } }`,
    { id },
    creds,
  );
  return data.issueUnarchive;
}

// ── Attachments (NEW) ─────────────────────────────────────────────────────────

export async function listAttachments(creds, issueId) {
  const data = await gql(
    `query($id: String!) {
      issue(id: $id) {
        attachments {
          nodes { id title subtitle url metadata createdAt updatedAt }
        }
      }
    }`,
    { id: issueId },
    creds,
  );
  return data.issue?.attachments?.nodes ?? [];
}

export async function createAttachment(creds, input) {
  // input: { issueId, title, url, subtitle?, iconUrl? }
  const data = await gql(
    `mutation($input: AttachmentCreateInput!) {
      attachmentCreate(input: $input) {
        success attachment { id title url }
      }
    }`,
    { input },
    creds,
  );
  return data.attachmentCreate;
}

export async function deleteAttachment(creds, id) {
  const data = await gql(
    `mutation($id: String!) { attachmentDelete(id: $id) { success } }`,
    { id },
    creds,
  );
  return data.attachmentDelete;
}

// ── Comments ──────────────────────────────────────────────────────────────────

export async function listComments(creds, issueId) {
  const data = await gql(
    `query($id: String!) {
      issue(id: $id) {
        comments { nodes { id body user { name } createdAt updatedAt } }
      }
    }`,
    { id: issueId },
    creds,
  );
  return data.issue?.comments?.nodes ?? [];
}

export async function addComment(creds, issueId, body) {
  const data = await gql(
    `mutation($input: CommentCreateInput!) {
      commentCreate(input: $input) {
        success comment { id body createdAt }
      }
    }`,
    { input: { issueId, body } },
    creds,
  );
  return data.commentCreate;
}

export async function updateComment(creds, id, body) {
  const data = await gql(
    `mutation($id: String!, $input: CommentUpdateInput!) {
      commentUpdate(id: $id, input: $input) {
        success comment { id body }
      }
    }`,
    { id, input: { body } },
    creds,
  );
  return data.commentUpdate;
}

export async function deleteComment(creds, id) {
  const data = await gql(
    `mutation($id: String!) { commentDelete(id: $id) { success } }`,
    { id },
    creds,
  );
  return data.commentDelete;
}

// ── Notifications (NEW) ───────────────────────────────────────────────────────

export async function listNotifications(creds, limit = 25) {
  const data = await gql(
    `query($first: Int) {
      notifications(first: $first) {
        nodes {
          id type readAt archivedAt createdAt updatedAt
          ... on IssueNotification {
            issue { id title url state { name } }
          }
          ... on ProjectNotification {
            project { id name url }
          }
        }
      }
    }`,
    { first: limit },
    creds,
  );
  return data.notifications?.nodes ?? [];
}

export async function markNotificationRead(creds, id) {
  const data = await gql(
    `mutation($id: String!, $input: NotificationUpdateInput!) {
      notificationUpdate(id: $id, input: $input) {
        success notification { id readAt }
      }
    }`,
    { id, input: { readAt: new Date().toISOString() } },
    creds,
  );
  return data.notificationUpdate;
}

export async function archiveNotification(creds, id) {
  const data = await gql(
    `mutation($id: String!) { notificationArchive(id: $id) { success } }`,
    { id },
    creds,
  );
  return data.notificationArchive;
}

// ── Teams ─────────────────────────────────────────────────────────────────────

export async function listTeams(creds) {
  const data = await gql(`{ teams { nodes { id name key description } } }`, {}, creds);
  return data.teams?.nodes ?? [];
}

export async function getTeam(creds, id) {
  const data = await gql(
    `query($id: String!) {
      team(id: $id) {
        id name key description issueCount
        members { nodes { id name email } }
      }
    }`,
    { id },
    creds,
  );
  return data.team;
}

export async function listTeamMembers(creds, teamId) {
  const data = await gql(
    `query($id: String!) {
      team(id: $id) { members { nodes { id name email displayName active } } }
    }`,
    { id: teamId },
    creds,
  );
  return data.team?.members?.nodes ?? [];
}

export async function listTeamStates(creds, teamId) {
  const data = await gql(
    `query($id: String!) {
      team(id: $id) { states { nodes { id name color type position } } }
    }`,
    { id: teamId },
    creds,
  );
  return data.team?.states?.nodes ?? [];
}

export async function listTeamLabels(creds, teamId) {
  const data = await gql(
    `query($id: String!) {
      team(id: $id) { labels { nodes { id name color } } }
    }`,
    { id: teamId },
    creds,
  );
  return data.team?.labels?.nodes ?? [];
}

export async function updateTeam(creds, id, input) {
  // input: { name?, description?, key?, timezone?, issueEstimationType? }
  const data = await gql(
    `mutation($id: String!, $input: TeamUpdateInput!) {
      teamUpdate(id: $id, input: $input) {
        success team { id name key }
      }
    }`,
    { id, input },
    creds,
  );
  return data.teamUpdate;
}

// ── Workflow States (NEW) ─────────────────────────────────────────────────────

export async function createWorkflowState(creds, input) {
  // input: { teamId, name, type, color, position? }
  // type: "triage" | "backlog" | "unstarted" | "started" | "completed" | "cancelled"
  const data = await gql(
    `mutation($input: WorkflowStateCreateInput!) {
      workflowStateCreate(input: $input) {
        success workflowState { id name color type }
      }
    }`,
    { input },
    creds,
  );
  return data.workflowStateCreate;
}

export async function updateWorkflowState(creds, id, input) {
  // input: { name?, color?, position?, description? }
  const data = await gql(
    `mutation($id: String!, $input: WorkflowStateUpdateInput!) {
      workflowStateUpdate(id: $id, input: $input) {
        success workflowState { id name color type }
      }
    }`,
    { id, input },
    creds,
  );
  return data.workflowStateUpdate;
}

export async function archiveWorkflowState(creds, id) {
  const data = await gql(
    `mutation($id: String!) { workflowStateArchive(id: $id) { success } }`,
    { id },
    creds,
  );
  return data.workflowStateArchive;
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function listProjects(creds, limit = 25) {
  const data = await gql(
    `query($first: Int) {
      projects(first: $first) {
        nodes { id name description state startDate targetDate url }
      }
    }`,
    { first: limit },
    creds,
  );
  return data.projects?.nodes ?? [];
}

export async function getProject(creds, id) {
  const data = await gql(
    `query($id: String!) {
      project(id: $id) {
        id name description state startDate targetDate url
        teams { nodes { id name } }
      }
    }`,
    { id },
    creds,
  );
  return data.project;
}

export async function createProject(creds, input) {
  const data = await gql(
    `mutation($input: ProjectCreateInput!) {
      projectCreate(input: $input) {
        success project { id name url }
      }
    }`,
    { input },
    creds,
  );
  return data.projectCreate;
}

export async function updateProject(creds, id, input) {
  // input: { name?, description?, state?, startDate?, targetDate?, leadId? }
  const data = await gql(
    `mutation($id: String!, $input: ProjectUpdateInput!) {
      projectUpdate(id: $id, input: $input) {
        success project { id name url state }
      }
    }`,
    { id, input },
    creds,
  );
  return data.projectUpdate;
}

export async function archiveProject(creds, id) {
  const data = await gql(
    `mutation($id: String!) { projectArchive(id: $id) { success } }`,
    { id },
    creds,
  );
  return data.projectArchive;
}

export async function listProjectIssues(creds, projectId, limit = 25) {
  const data = await gql(
    `query($id: String!, $first: Int) {
      project(id: $id) {
        issues(first: $first) {
          nodes { id title state { name } priority assignee { name } url }
        }
      }
    }`,
    { id: projectId, first: limit },
    creds,
  );
  return data.project?.issues?.nodes ?? [];
}

// ── Project Milestones (NEW) ──────────────────────────────────────────────────

export async function listProjectMilestones(creds, projectId) {
  const data = await gql(
    `query($id: String!) {
      project(id: $id) {
        projectMilestones {
          nodes { id name description targetDate sortOrder }
        }
      }
    }`,
    { id: projectId },
    creds,
  );
  return data.project?.projectMilestones?.nodes ?? [];
}

export async function createProjectMilestone(creds, input) {
  // input: { projectId, name, targetDate?, description? }
  const data = await gql(
    `mutation($input: ProjectMilestoneCreateInput!) {
      projectMilestoneCreate(input: $input) {
        success projectMilestone { id name targetDate }
      }
    }`,
    { input },
    creds,
  );
  return data.projectMilestoneCreate;
}

export async function updateProjectMilestone(creds, id, input) {
  // input: { name?, targetDate?, description? }
  const data = await gql(
    `mutation($id: String!, $input: ProjectMilestoneUpdateInput!) {
      projectMilestoneUpdate(id: $id, input: $input) {
        success projectMilestone { id name targetDate }
      }
    }`,
    { id, input },
    creds,
  );
  return data.projectMilestoneUpdate;
}

export async function deleteProjectMilestone(creds, id) {
  const data = await gql(
    `mutation($id: String!) { projectMilestoneDelete(id: $id) { success } }`,
    { id },
    creds,
  );
  return data.projectMilestoneDelete;
}

// ── Project Updates (NEW) ─────────────────────────────────────────────────────

export async function listProjectUpdates(creds, projectId, limit = 10) {
  const data = await gql(
    `query($id: String!, $first: Int) {
      project(id: $id) {
        projectUpdates(first: $first) {
          nodes { id body health createdAt updatedAt user { name } }
        }
      }
    }`,
    { id: projectId, first: limit },
    creds,
  );
  return data.project?.projectUpdates?.nodes ?? [];
}

export async function createProjectUpdate(creds, input) {
  // input: { projectId, body, health?: "onTrack" | "atRisk" | "offTrack" }
  const data = await gql(
    `mutation($input: ProjectUpdateCreateInput!) {
      projectUpdateCreate(input: $input) {
        success projectUpdate { id body health createdAt }
      }
    }`,
    { input },
    creds,
  );
  return data.projectUpdateCreate;
}

// ── Members ───────────────────────────────────────────────────────────────────

export async function listMembers(creds, limit = 50) {
  const data = await gql(
    `query($first: Int) {
      users(first: $first) {
        nodes { id name email displayName active }
      }
    }`,
    { first: limit },
    creds,
  );
  return data.users?.nodes ?? [];
}

export async function getUser(creds, id) {
  const data = await gql(
    `query($id: String!) {
      user(id: $id) {
        id name email displayName active
        assignedIssues(first: 10) { nodes { id title state { name } url } }
      }
    }`,
    { id },
    creds,
  );
  return data.user;
}

// ── Cycles ────────────────────────────────────────────────────────────────────

export async function listCycles(creds, teamId, limit = 10) {
  const data = await gql(
    `query($id: String!, $first: Int) {
      team(id: $id) {
        cycles(first: $first) {
          nodes { id name number startsAt endsAt completedAt }
        }
      }
    }`,
    { id: teamId, first: limit },
    creds,
  );
  return data.team?.cycles?.nodes ?? [];
}

export async function getCycleIssues(creds, cycleId, limit = 25) {
  const data = await gql(
    `query($id: String!, $first: Int) {
      cycle(id: $id) {
        id name number
        issues(first: $first) {
          nodes { id title state { name } priority assignee { name } url }
        }
      }
    }`,
    { id: cycleId, first: limit },
    creds,
  );
  return data.cycle;
}

export async function createCycle(creds, input) {
  // input: { teamId, startsAt, endsAt, name? }
  const data = await gql(
    `mutation($input: CycleCreateInput!) {
      cycleCreate(input: $input) {
        success cycle { id name number startsAt endsAt }
      }
    }`,
    { input },
    creds,
  );
  return data.cycleCreate;
}

export async function updateCycle(creds, id, input) {
  // input: { name?, startsAt?, endsAt?, description? }
  const data = await gql(
    `mutation($id: String!, $input: CycleUpdateInput!) {
      cycleUpdate(id: $id, input: $input) {
        success cycle { id name number startsAt endsAt }
      }
    }`,
    { id, input },
    creds,
  );
  return data.cycleUpdate;
}

export async function archiveCycle(creds, id) {
  const data = await gql(
    `mutation($id: String!) { cycleArchive(id: $id) { success } }`,
    { id },
    creds,
  );
  return data.cycleArchive;
}

export async function addIssuesToCycle(creds, cycleId, issueIds) {
  const data = await gql(
    `mutation($input: CycleIssueCreateInput!) {
      cycleIssueCreate(input: $input) { success }
    }`,
    { input: { cycleId, issueIds } },
    creds,
  );
  return data.cycleIssueCreate;
}

// ── Labels ────────────────────────────────────────────────────────────────────

export async function listLabels(creds, limit = 50) {
  const data = await gql(
    `query($first: Int) {
      issueLabels(first: $first) {
        nodes { id name color team { name } }
      }
    }`,
    { first: limit },
    creds,
  );
  return data.issueLabels?.nodes ?? [];
}

export async function createLabel(creds, input) {
  const data = await gql(
    `mutation($input: IssueLabelCreateInput!) {
      issueLabelCreate(input: $input) {
        success issueLabel { id name color }
      }
    }`,
    { input },
    creds,
  );
  return data.issueLabelCreate;
}

export async function updateLabel(creds, id, input) {
  // input: { name?, color? }
  const data = await gql(
    `mutation($id: String!, $input: IssueLabelUpdateInput!) {
      issueLabelUpdate(id: $id, input: $input) {
        success issueLabel { id name color }
      }
    }`,
    { id, input },
    creds,
  );
  return data.issueLabelUpdate;
}

export async function archiveLabel(creds, id) {
  const data = await gql(
    `mutation($id: String!) { issueLabelArchive(id: $id) { success } }`,
    { id },
    creds,
  );
  return data.issueLabelArchive;
}

// ── Favorites (NEW) ───────────────────────────────────────────────────────────

export async function listFavorites(creds) {
  const data = await gql(
    `{
      viewer {
        favorites {
          nodes {
            id type
            issue { id title url state { name } priority }
            project { id name url state }
          }
        }
      }
    }`,
    {},
    creds,
  );
  return data.viewer?.favorites?.nodes ?? [];
}

// ── Organization (NEW) ────────────────────────────────────────────────────────

export async function getOrganization(creds) {
  const data = await gql(
    `{
      organization {
        id name urlKey logoUrl createdAt
        userCount
        subscription { seats nextBillingAt }
      }
    }`,
    {},
    creds,
  );
  return data.organization;
}
