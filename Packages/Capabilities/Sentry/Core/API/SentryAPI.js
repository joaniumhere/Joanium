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

async function sMutate(path, creds, method = 'PUT', body = {}) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: headers(creds),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.detail ?? `Sentry API error: ${res.status}`);
  }
  return res.json();
}

// ─── Organizations ────────────────────────────────────────────────────────────

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

/** GET /organizations/{org_slug}/ */
export async function getOrganization(creds, orgSlug) {
  const o = await sFetch(`/organizations/${orgSlug}/`, creds);
  return {
    id: o.id,
    slug: o.slug,
    name: o.name,
    dateCreated: o.dateCreated,
    memberCount: o.memberCount,
    features: o.features ?? [],
    status: o.status?.id ?? 'active',
  };
}

/** GET /organizations/{org_slug}/members/ */
export async function listMembers(creds, orgSlug) {
  const members = await sFetch(`/organizations/${orgSlug}/members/`, creds);
  return (members ?? []).map((m) => ({
    id: m.id,
    email: m.email,
    name: m.name,
    role: m.role,
    roleName: m.roleName,
    dateCreated: m.dateCreated,
  }));
}

/** GET /organizations/{org_slug}/teams/ */
export async function listTeams(creds, orgSlug) {
  const teams = await sFetch(`/organizations/${orgSlug}/teams/`, creds);
  return (teams ?? []).map((t) => ({
    id: t.id,
    slug: t.slug,
    name: t.name,
    memberCount: t.memberCount,
    dateCreated: t.dateCreated,
  }));
}

/** GET /organizations/{org_slug}/environments/ */
export async function listEnvironments(creds, orgSlug) {
  const envs = await sFetch(`/organizations/${orgSlug}/environments/`, creds);
  return (envs ?? []).map((e) => ({ id: e.id, name: e.name }));
}

/** GET /organizations/{org_slug}/stats_v2/ */
export async function getOrgStats(creds, orgSlug) {
  const params = new URLSearchParams({
    field: 'sum(quantity)',
    category: 'error',
    interval: '1d',
    statsPeriod: '14d',
  });
  const data = await sFetch(`/organizations/${orgSlug}/stats_v2/?${params}`, creds);
  return data;
}

// ─── Projects ─────────────────────────────────────────────────────────────────

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

/** GET /projects/{org_slug}/{project_slug}/ */
export async function getProject(creds, orgSlug, projectSlug) {
  const p = await sFetch(`/projects/${orgSlug}/${projectSlug}/`, creds);
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    platform: p.platform ?? 'unknown',
    status: p.status,
    dateCreated: p.dateCreated,
    team: p.team ? { id: p.team.id, slug: p.team.slug, name: p.team.name } : null,
    latestRelease: p.latestRelease
      ? { version: p.latestRelease.version, dateCreated: p.latestRelease.dateCreated }
      : null,
  };
}

/** GET /projects/{org_slug}/{project_slug}/issues/ */
export async function listProjectIssues(creds, orgSlug, projectSlug, limit = 25) {
  const issues = await sFetch(
    `/projects/${orgSlug}/${projectSlug}/issues/?query=is:unresolved&limit=${limit}&sort=date`,
    creds,
  );
  return (issues ?? []).map((i) => ({
    id: i.id,
    title: i.title,
    level: i.level,
    count: i.count,
    userCount: i.userCount,
    firstSeen: i.firstSeen,
    lastSeen: i.lastSeen,
    permalink: i.permalink,
  }));
}

/** GET /projects/{org_slug}/{project_slug}/events/ */
export async function listProjectEvents(creds, orgSlug, projectSlug, limit = 25) {
  const events = await sFetch(`/projects/${orgSlug}/${projectSlug}/events/?limit=${limit}`, creds);
  return (events ?? []).map((e) => ({
    id: e.id,
    eventID: e.eventID,
    title: e.title,
    platform: e.platform,
    dateCreated: e.dateCreated,
    groupID: e.groupID,
  }));
}

/** GET /projects/{org_slug}/{project_slug}/releases/ */
export async function listProjectReleases(creds, orgSlug, projectSlug, limit = 25) {
  const releases = await sFetch(
    `/projects/${orgSlug}/${projectSlug}/releases/?limit=${limit}`,
    creds,
  );
  return (releases ?? []).map((r) => ({
    version: r.version,
    dateCreated: r.dateCreated,
    dateReleased: r.dateReleased,
    newGroups: r.newGroups,
    commitCount: r.commitCount,
    deployCount: r.deployCount,
  }));
}

/** GET /projects/{org_slug}/{project_slug}/rules/ */
export async function listAlertRules(creds, orgSlug, projectSlug) {
  const rules = await sFetch(`/projects/${orgSlug}/${projectSlug}/rules/`, creds);
  return (rules ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    status: r.status,
    conditions: (r.conditions ?? []).map((c) => c.name ?? c.id),
    actions: (r.actions ?? []).map((a) => a.name ?? a.id),
    dateCreated: r.dateCreated,
  }));
}

/** GET /projects/{org_slug}/{project_slug}/user-feedback/ */
export async function listUserFeedback(creds, orgSlug, projectSlug, limit = 25) {
  const feedback = await sFetch(
    `/projects/${orgSlug}/${projectSlug}/user-feedback/?limit=${limit}`,
    creds,
  );
  return (feedback ?? []).map((f) => ({
    id: f.id,
    name: f.name,
    email: f.email,
    comments: f.comments,
    dateCreated: f.dateCreated,
    issue: f.issue ? { id: f.issue.id, title: f.issue.title } : null,
  }));
}

/** GET /projects/{org_slug}/{project_slug}/files/dsyms/ */
export async function listDsymFiles(creds, orgSlug, projectSlug) {
  const files = await sFetch(`/projects/${orgSlug}/${projectSlug}/files/dsyms/`, creds);
  return (files ?? []).map((f) => ({
    id: f.id,
    uuid: f.uuid,
    objectName: f.objectName,
    cpuName: f.cpuName,
    symbolType: f.symbolType,
    dateCreated: f.dateCreated,
    size: f.size,
  }));
}

// ─── Issues ───────────────────────────────────────────────────────────────────

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

/** GET /organizations/{org_slug}/issues/{issue_id}/ */
export async function getIssue(creds, orgSlug, issueId) {
  const i = await sFetch(`/organizations/${orgSlug}/issues/${issueId}/`, creds);
  return {
    id: i.id,
    title: i.title,
    culprit: i.culprit,
    level: i.level,
    status: i.status,
    count: i.count,
    userCount: i.userCount,
    project: i.project ? { id: i.project.id, slug: i.project.slug, name: i.project.name } : null,
    assignedTo: i.assignedTo,
    firstSeen: i.firstSeen,
    lastSeen: i.lastSeen,
    permalink: i.permalink,
    type: i.type,
    platform: i.platform,
  };
}

/** PUT /organizations/{org_slug}/issues/{issue_id}/ — resolve */
export async function resolveIssue(creds, orgSlug, issueId) {
  return sMutate(`/organizations/${orgSlug}/issues/${issueId}/`, creds, 'PUT', {
    status: 'resolved',
  });
}

/** PUT /organizations/{org_slug}/issues/{issue_id}/ — ignore */
export async function ignoreIssue(creds, orgSlug, issueId) {
  return sMutate(`/organizations/${orgSlug}/issues/${issueId}/`, creds, 'PUT', {
    status: 'ignored',
  });
}

/** PUT /organizations/{org_slug}/issues/{issue_id}/ — assign */
export async function assignIssue(creds, orgSlug, issueId, assignee) {
  return sMutate(`/organizations/${orgSlug}/issues/${issueId}/`, creds, 'PUT', {
    assignedTo: assignee,
  });
}

/** PUT /organizations/{org_slug}/issues/ — bulk update multiple issues */
export async function bulkUpdateIssues(creds, orgSlug, issueIds, update) {
  const ids = issueIds.map((id) => `id=${id}`).join('&');
  return sMutate(`/organizations/${orgSlug}/issues/?${ids}`, creds, 'PUT', update);
}

/** GET /issues/{issue_id}/events/ */
export async function listIssueEvents(creds, issueId, limit = 10) {
  const events = await sFetch(`/issues/${issueId}/events/?limit=${limit}`, creds);
  return (events ?? []).map((e) => ({
    id: e.id,
    eventID: e.eventID,
    title: e.title,
    platform: e.platform,
    dateCreated: e.dateCreated,
    user: e.user ? { id: e.user.id, email: e.user.email } : null,
  }));
}

/** GET /issues/{issue_id}/events/latest/ */
export async function getLatestEvent(creds, issueId) {
  const e = await sFetch(`/issues/${issueId}/events/latest/`, creds);
  return {
    id: e.id,
    eventID: e.eventID,
    title: e.title,
    platform: e.platform,
    dateCreated: e.dateCreated,
    message: e.message,
    user: e.user ? { id: e.user.id, email: e.user.email, ip: e.user.ipAddress } : null,
    tags: (e.tags ?? []).map((t) => ({ key: t.key, value: t.value })),
    entries: e.entries ?? [],
  };
}

/** GET /issues/{issue_id}/tags/ */
export async function listIssueTags(creds, issueId) {
  const tags = await sFetch(`/issues/${issueId}/tags/`, creds);
  return (tags ?? []).map((t) => ({
    key: t.key,
    name: t.name,
    totalValues: t.totalValues,
    topValues: (t.topValues ?? []).map((v) => ({
      value: v.value,
      count: v.count,
      firstSeen: v.firstSeen,
      lastSeen: v.lastSeen,
    })),
  }));
}

/** GET /issues/{issue_id}/hashes/ */
export async function listIssueHashes(creds, issueId) {
  const hashes = await sFetch(`/issues/${issueId}/hashes/`, creds);
  return (hashes ?? []).map((h) => ({
    id: h.id,
    latestEvent: h.latestEvent
      ? { id: h.latestEvent.id, dateCreated: h.latestEvent.dateCreated }
      : null,
  }));
}

// ─── Releases ─────────────────────────────────────────────────────────────────

/** GET /organizations/{org_slug}/releases/ */
export async function listOrgReleases(creds, orgSlug, limit = 25) {
  const releases = await sFetch(`/organizations/${orgSlug}/releases/?limit=${limit}`, creds);
  return (releases ?? []).map((r) => ({
    version: r.version,
    dateCreated: r.dateCreated,
    dateReleased: r.dateReleased,
    newGroups: r.newGroups,
    firstEvent: r.firstEvent,
    lastEvent: r.lastEvent,
    commitCount: r.commitCount,
    deployCount: r.deployCount,
    projects: (r.projects ?? []).map((p) => p.slug),
  }));
}

/** GET /organizations/{org_slug}/releases/{version}/ */
export async function getRelease(creds, orgSlug, version) {
  const r = await sFetch(
    `/organizations/${orgSlug}/releases/${encodeURIComponent(version)}/`,
    creds,
  );
  return {
    version: r.version,
    dateCreated: r.dateCreated,
    dateReleased: r.dateReleased,
    newGroups: r.newGroups,
    commitCount: r.commitCount,
    deployCount: r.deployCount,
    authors: (r.authors ?? []).map((a) => ({ name: a.name, email: a.email })),
    projects: (r.projects ?? []).map((p) => ({ id: p.id, slug: p.slug, name: p.name })),
    ref: r.ref,
    url: r.url,
  };
}

/** GET /organizations/{org_slug}/releases/{version}/deploys/ */
export async function listDeploys(creds, orgSlug, version) {
  const deploys = await sFetch(
    `/organizations/${orgSlug}/releases/${encodeURIComponent(version)}/deploys/`,
    creds,
  );
  return (deploys ?? []).map((d) => ({
    id: d.id,
    environment: d.environment,
    dateStarted: d.dateStarted,
    dateFinished: d.dateFinished,
    name: d.name,
    url: d.url,
  }));
}

// ─── Teams ────────────────────────────────────────────────────────────────────

/** GET /teams/{org_slug}/{team_slug}/projects/ */
export async function listTeamProjects(creds, orgSlug, teamSlug) {
  const projects = await sFetch(`/teams/${orgSlug}/${teamSlug}/projects/`, creds);
  return (projects ?? []).map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    platform: p.platform ?? 'unknown',
    dateCreated: p.dateCreated,
  }));
}

// ─── Search ───────────────────────────────────────────────────────────────────

/** GET /organizations/{org_slug}/issues/?query=... */
export async function searchIssues(creds, orgSlug, query, limit = 25) {
  const params = new URLSearchParams({ query, limit, sort: 'date' });
  const issues = await sFetch(`/organizations/${orgSlug}/issues/?${params}`, creds);
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

/** GET /organizations/{org_slug}/issues/?query=is:unresolved level:fatal */
export async function listFatalIssues(creds, orgSlug, limit = 25) {
  return searchIssues(creds, orgSlug, 'is:unresolved level:fatal', limit);
}
