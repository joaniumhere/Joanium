import { jiraAuthHeader } from '../Shared/Common.js';

function headers(creds) {
  return {
    Authorization: jiraAuthHeader(creds),
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

function base(creds) {
  const url = creds.siteUrl.replace(/\/$/, '');
  return `${url}/rest/api/3`;
}

async function jFetch(path, creds, options = {}) {
  const res = await fetch(`${base(creds)}${path}`, {
    ...options,
    headers: { ...headers(creds), ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.errorMessages?.[0] ?? data.message ?? `Jira API error: ${res.status}`);
  }
  return res.json();
}

export async function getMyself(creds) {
  return jFetch('/myself', creds);
}

export async function listProjects(creds) {
  const data = await jFetch('/project/search?maxResults=50&orderBy=NAME', creds);
  return (data.values ?? []).map((p) => ({
    id: p.id,
    key: p.key,
    name: p.name,
    type: p.projectTypeKey,
  }));
}

export async function searchIssues(creds, jql, maxResults = 25) {
  const data = await jFetch(
    `/search?jql=${encodeURIComponent(jql)}&maxResults=${maxResults}&fields=summary,status,assignee,priority,updated,project`,
    creds,
  );
  return (data.issues ?? []).map((i) => ({
    key: i.key,
    summary: i.fields?.summary ?? '',
    status: i.fields?.status?.name ?? 'unknown',
    assignee: i.fields?.assignee?.displayName ?? 'Unassigned',
    priority: i.fields?.priority?.name ?? 'None',
    updated: i.fields?.updated,
    project: i.fields?.project?.name ?? '',
  }));
}

export async function getMyOpenIssues(creds, limit = 25) {
  return searchIssues(
    creds,
    'assignee = currentUser() AND resolution = Unresolved ORDER BY updated DESC',
    limit,
  );
}
