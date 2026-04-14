const BASE = 'https://sentry.io/api/0';

function headers(creds) {
  return { Authorization: `Bearer ${creds.token}`, 'Content-Type': 'application/json' };
}

async function sFetch(path, creds) {
  const res = await fetch(`${BASE}${path}`, { headers: headers(creds) });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail ?? `Sentry API error: ${res.status}`);
  }
  return res.json();
}

export async function listOrganizations(creds) {
  const orgs = await sFetch('/organizations/', creds);
  return (orgs ?? []).map((o) => ({
    id: o.id,
    slug: o.slug,
    name: o.name,
    dateCreated: o.dateCreated,
    status: o.status?.id ?? 'active',
  }));
}

export async function listProjects(creds, orgSlug) {
  const projects = await sFetch(`/organizations/${orgSlug}/projects/`, creds);
  return (projects ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    platform: p.platform ?? 'unknown',
    status: p.status,
    dateCreated: p.dateCreated,
  }));
}

export async function listIssues(creds, orgSlug, limit = 25) {
  const issues = await sFetch(
    `/organizations/${orgSlug}/issues/?query=is:unresolved&limit=${limit}&sort=date`,
    creds,
  );
  return (issues ?? []).map((i) => ({
    id: i.id,
    title: i.title,
    level: i.level,
    count: i.count,
    userCount: i.userCount,
    project: i.project?.slug ?? 'unknown',
    firstSeen: i.firstSeen,
    lastSeen: i.lastSeen,
    permalink: i.permalink,
  }));
}
