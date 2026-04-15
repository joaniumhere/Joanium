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
  // input: { title, teamId, description?, assigneeId?, stateId?, priority?, labelIds?, dueDate? }
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
  // input: any subset of IssueUpdateInput fields
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
  // input: { name, teamIds, description?, state? }
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
  // input: { name, color, teamId }
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
