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

export async function getViewer(creds) {
  const data = await gql(`{ viewer { id name email displayName } }`, {}, creds);
  return data.viewer;
}

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

export async function listTeams(creds) {
  const data = await gql(`{ teams { nodes { id name key description } } }`, {}, creds);
  return data.teams?.nodes ?? [];
}

export async function listIssues(creds, teamId, limit = 25) {
  const data = await gql(
    `query($teamId: String!, $first: Int) {
      team(id: $teamId) {
        issues(first: $first, orderBy: updatedAt) {
          nodes { id title state { name } priority assignee { name } updatedAt url }
        }
      }
    }`,
    { teamId, first: limit },
    creds,
  );
  return data.team?.issues?.nodes ?? [];
}
