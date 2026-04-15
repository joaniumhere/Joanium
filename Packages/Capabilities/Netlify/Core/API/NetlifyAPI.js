const BASE = 'https://api.netlify.com/api/v1';

function headers(creds) {
  return { Authorization: `Bearer ${creds.token}`, 'Content-Type': 'application/json' };
}

async function nFetch(path, creds) {
  const res = await fetch(`${BASE}${path}`, { headers: headers(creds) });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? data.error ?? `Netlify API error: ${res.status}`);
  }
  return res.json();
}

// ── User ───────────────────────────────────────────────────────────────────

export async function getUser(creds) {
  return nFetch('/user', creds);
}

// ── Sites ──────────────────────────────────────────────────────────────────

export async function listSites(creds) {
  const sites = await nFetch('/sites?per_page=50', creds);
  return (sites ?? []).map((s) => ({
    id: s.id,
    name: s.name,
    url: s.url,
    adminUrl: s.admin_url,
    publishedDeploy: s.published_deploy?.state ?? 'unknown',
    updatedAt: s.updated_at,
    customDomain: s.custom_domain ?? null,
  }));
}

export async function getSite(creds, siteId) {
  return nFetch(`/sites/${siteId}`, creds);
}

export async function updateSite(creds, siteId, body) {
  const res = await fetch(`${BASE}/sites/${siteId}`, {
    method: 'PATCH',
    headers: headers(creds),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return res.json();
}

export async function deleteSite(creds, siteId) {
  const res = await fetch(`${BASE}/sites/${siteId}`, {
    method: 'DELETE',
    headers: headers(creds),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return { deleted: true };
}

export async function listSiteFiles(creds, siteId) {
  return nFetch(`/sites/${siteId}/files`, creds);
}

// ── Deploys ────────────────────────────────────────────────────────────────

export async function listDeploys(creds, siteId, limit = 10) {
  const deploys = await nFetch(`/sites/${siteId}/deploys?per_page=${limit}`, creds);
  return (deploys ?? []).map((d) => ({
    id: d.id,
    state: d.state,
    branch: d.branch,
    commitRef: d.commit_ref ?? null,
    commitUrl: d.commit_url ?? null,
    createdAt: d.created_at,
    errorMessage: d.error_message ?? null,
  }));
}

export async function listAllDeploys(creds, limit = 20) {
  const deploys = await nFetch(`/deploys?per_page=${limit}`, creds);
  return (deploys ?? []).map((d) => ({
    id: d.id,
    siteId: d.site_id,
    siteName: d.name,
    state: d.state,
    branch: d.branch,
    createdAt: d.created_at,
    errorMessage: d.error_message ?? null,
  }));
}

export async function getDeploy(creds, deployId) {
  return nFetch(`/deploys/${deployId}`, creds);
}

export async function listSiteDeploys(creds, siteId, limit = 10) {
  const deploys = await nFetch(`/sites/${siteId}/deploys?per_page=${limit}`, creds);
  return (deploys ?? []).map((d) => ({
    id: d.id,
    state: d.state,
    branch: d.branch,
    commitRef: d.commit_ref ?? null,
    createdAt: d.created_at,
    errorMessage: d.error_message ?? null,
  }));
}

export async function cancelDeploy(creds, deployId) {
  const res = await fetch(`${BASE}/deploys/${deployId}/cancel`, {
    method: 'POST',
    headers: headers(creds),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return res.json();
}

export async function restoreDeploy(creds, deployId) {
  const res = await fetch(`${BASE}/deploys/${deployId}/restore`, {
    method: 'POST',
    headers: headers(creds),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return res.json();
}

export async function triggerSiteBuild(creds, siteId, { clearCache = false } = {}) {
  const res = await fetch(`${BASE}/sites/${siteId}/deploys`, {
    method: 'POST',
    headers: headers(creds),
    body: JSON.stringify({ clear_cache: clearCache }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return res.json();
}

// ── Forms & Submissions ────────────────────────────────────────────────────

export async function listForms(creds, siteId) {
  return nFetch(`/sites/${siteId}/forms`, creds);
}

export async function listFormSubmissions(creds, formId, limit = 20) {
  return nFetch(`/forms/${formId}/submissions?per_page=${limit}`, creds);
}

export async function deleteSubmission(creds, submissionId) {
  const res = await fetch(`${BASE}/submissions/${submissionId}`, {
    method: 'DELETE',
    headers: headers(creds),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return { deleted: true };
}

// ── Hooks (Notifications) ──────────────────────────────────────────────────

export async function listHooks(creds, siteId) {
  return nFetch(`/hooks?site_id=${siteId}`, creds);
}

export async function createHook(creds, body) {
  const res = await fetch(`${BASE}/hooks`, {
    method: 'POST',
    headers: headers(creds),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return res.json();
}

export async function deleteHook(creds, hookId) {
  const res = await fetch(`${BASE}/hooks/${hookId}`, {
    method: 'DELETE',
    headers: headers(creds),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return { deleted: true };
}

// ── Build Hooks ────────────────────────────────────────────────────────────

export async function listBuildHooks(creds, siteId) {
  return nFetch(`/sites/${siteId}/build_hooks`, creds);
}

export async function createBuildHook(creds, siteId, { title, branch }) {
  const res = await fetch(`${BASE}/sites/${siteId}/build_hooks`, {
    method: 'POST',
    headers: headers(creds),
    body: JSON.stringify({ title, branch }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return res.json();
}

export async function deleteBuildHook(creds, siteId, buildHookId) {
  const res = await fetch(`${BASE}/sites/${siteId}/build_hooks/${buildHookId}`, {
    method: 'DELETE',
    headers: headers(creds),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return { deleted: true };
}

export async function triggerBuildHook(_creds, buildHookId) {
  // Build hook URLs are public — no auth header needed
  const res = await fetch(`https://api.netlify.com/build_hooks/${buildHookId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`Build hook trigger failed: ${res.status}`);
  return { triggered: true };
}

// ── Environment Variables ──────────────────────────────────────────────────

export async function listEnvVars(creds, siteId) {
  return nFetch(`/sites/${siteId}/env`, creds);
}

export async function updateEnvVars(creds, siteId, vars) {
  // vars: { KEY: 'value', ... }
  const res = await fetch(`${BASE}/sites/${siteId}/env`, {
    method: 'PATCH',
    headers: headers(creds),
    body: JSON.stringify(vars),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return res.json();
}

export async function deleteEnvVar(creds, siteId, key) {
  const res = await fetch(`${BASE}/sites/${siteId}/env/${encodeURIComponent(key)}`, {
    method: 'DELETE',
    headers: headers(creds),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return { deleted: true };
}

// ── DNS ────────────────────────────────────────────────────────────────────

export async function listDnsZones(creds) {
  return nFetch('/dns_zones', creds);
}

export async function listDnsRecords(creds, zoneId) {
  return nFetch(`/dns_zones/${zoneId}/dns_records`, creds);
}

export async function createDnsRecord(creds, zoneId, record) {
  const res = await fetch(`${BASE}/dns_zones/${zoneId}/dns_records`, {
    method: 'POST',
    headers: headers(creds),
    body: JSON.stringify(record),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return res.json();
}

export async function deleteDnsRecord(creds, zoneId, recordId) {
  const res = await fetch(`${BASE}/dns_zones/${zoneId}/dns_records/${recordId}`, {
    method: 'DELETE',
    headers: headers(creds),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return { deleted: true };
}

// ── Accounts & Members ─────────────────────────────────────────────────────

export async function listAccounts(creds) {
  return nFetch('/accounts', creds);
}

export async function listMembers(creds, accountId) {
  return nFetch(`/accounts/${accountId}/members`, creds);
}

// ── SSL ────────────────────────────────────────────────────────────────────

export async function getSsl(creds, siteId) {
  return nFetch(`/sites/${siteId}/ssl`, creds);
}

export async function provisionSsl(creds, siteId) {
  const res = await fetch(`${BASE}/sites/${siteId}/ssl`, {
    method: 'POST',
    headers: headers(creds),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return res.json();
}

// ── Snippets ───────────────────────────────────────────────────────────────

export async function listSnippets(creds, siteId) {
  return nFetch(`/sites/${siteId}/snippets`, creds);
}
