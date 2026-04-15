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

// NEW (1) — get the authenticated user profile
export async function getCurrentUser(creds) {
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

// NEW (2) — create a new site
export async function createSite(creds, body) {
  const res = await fetch(`${BASE}/sites`, {
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

// NEW (3) — create a site inside a specific team/account
export async function createSiteInTeam(creds, accountId, body) {
  const res = await fetch(`${BASE}/accounts/${accountId}/sites`, {
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

// NEW (4) — purge the CDN cache for a site
export async function purgeSiteCache(creds, siteId) {
  const res = await fetch(`${BASE}/sites/${siteId}/purge`, {
    method: 'POST',
    headers: headers(creds),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return { purged: true };
}

// NEW (5) — list Netlify Functions deployed on a site
export async function listSiteFunctions(creds, siteId) {
  return nFetch(`/sites/${siteId}/functions`, creds);
}

// NEW (6) — list service instances (installed plugins) for a site
export async function listServiceInstances(creds, siteId) {
  return nFetch(`/sites/${siteId}/service-instances`, creds);
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

// NEW (7) — lock a deploy (keeps it as the live deploy permanently)
export async function lockDeploy(creds, deployId) {
  const res = await fetch(`${BASE}/deploys/${deployId}/lock`, {
    method: 'POST',
    headers: headers(creds),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return res.json();
}

// NEW (8) — unlock a previously locked deploy
export async function unlockDeploy(creds, deployId) {
  const res = await fetch(`${BASE}/deploys/${deployId}/unlock`, {
    method: 'POST',
    headers: headers(creds),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return res.json();
}

// NEW (9) — retry a failed deploy
export async function retryDeploy(creds, deployId) {
  const res = await fetch(`${BASE}/deploys/${deployId}/retry`, {
    method: 'POST',
    headers: headers(creds),
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

// NEW (10) — delete an entire form
export async function deleteForm(creds, siteId, formId) {
  const res = await fetch(`${BASE}/sites/${siteId}/forms/${formId}`, {
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

// NEW (11) — get a single DNS zone by ID
export async function getDnsZone(creds, zoneId) {
  return nFetch(`/dns_zones/${zoneId}`, creds);
}

// NEW (12) — create a new DNS zone
export async function createDnsZone(creds, { name, accountId }) {
  const res = await fetch(`${BASE}/dns_zones`, {
    method: 'POST',
    headers: headers(creds),
    body: JSON.stringify({ name, account_id: accountId }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return res.json();
}

// NEW (13) — delete a DNS zone
export async function deleteDnsZone(creds, zoneId) {
  const res = await fetch(`${BASE}/dns_zones/${zoneId}`, {
    method: 'DELETE',
    headers: headers(creds),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return { deleted: true };
}

// NEW (14) — transfer a DNS zone to another account
export async function transferDnsZone(creds, zoneId, { transferAccountId, transferUserId }) {
  const res = await fetch(`${BASE}/dns_zones/${zoneId}/transfer`, {
    method: 'PUT',
    headers: headers(creds),
    body: JSON.stringify({
      transfer_account_id: transferAccountId,
      transfer_user_id: transferUserId,
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return res.json();
}

// ── Accounts & Members ─────────────────────────────────────────────────────

export async function listAccounts(creds) {
  return nFetch('/accounts', creds);
}

export async function listMembers(creds, accountId) {
  return nFetch(`/accounts/${accountId}/members`, creds);
}

// NEW (15) — get a single account/team by ID
export async function getAccount(creds, accountId) {
  return nFetch(`/accounts/${accountId}`, creds);
}

// NEW (16) — update account settings
export async function updateAccount(creds, accountId, body) {
  const res = await fetch(`${BASE}/accounts/${accountId}`, {
    method: 'PUT',
    headers: headers(creds),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return res.json();
}

// NEW (17) — invite a new member to a team
export async function inviteMember(creds, accountId, { email, role }) {
  const res = await fetch(`${BASE}/accounts/${accountId}/members`, {
    method: 'POST',
    headers: headers(creds),
    body: JSON.stringify({ email, role }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return res.json();
}

// NEW (18) — remove a member from a team
export async function removeMember(creds, accountId, memberId) {
  const res = await fetch(`${BASE}/accounts/${accountId}/members/${memberId}`, {
    method: 'DELETE',
    headers: headers(creds),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return { deleted: true };
}

// NEW (19) — fetch the audit log for an account
export async function listAuditLog(creds, accountId, limit = 30) {
  return nFetch(`/accounts/${accountId}/audit?per_page=${limit}`, creds);
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

// NEW (20) — create an HTML injection snippet
export async function createSnippet(
  creds,
  siteId,
  { title, generalContent, goalContent, position },
) {
  const res = await fetch(`${BASE}/sites/${siteId}/snippets`, {
    method: 'POST',
    headers: headers(creds),
    body: JSON.stringify({
      title,
      general: generalContent,
      goal: goalContent ?? null,
      position: position ?? 'head',
    }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return res.json();
}

// NEW (21) — get a specific snippet
export async function getSnippet(creds, siteId, snippetId) {
  return nFetch(`/sites/${siteId}/snippets/${snippetId}`, creds);
}

// NEW (22) — update an existing snippet
export async function updateSnippet(creds, siteId, snippetId, body) {
  const res = await fetch(`${BASE}/sites/${siteId}/snippets/${snippetId}`, {
    method: 'PUT',
    headers: headers(creds),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return res.json();
}

// NEW (23) — delete a snippet
export async function deleteSnippet(creds, siteId, snippetId) {
  const res = await fetch(`${BASE}/sites/${siteId}/snippets/${snippetId}`, {
    method: 'DELETE',
    headers: headers(creds),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return { deleted: true };
}

// ── Deploy Keys ────────────────────────────────────────────────────────────

// NEW (24) — list all deploy keys on the account
export async function listDeployKeys(creds) {
  return nFetch('/deploy_keys', creds);
}

// NEW (25) — create a new deploy key (SSH key pair for repo access)
export async function createDeployKey(creds) {
  const res = await fetch(`${BASE}/deploy_keys`, {
    method: 'POST',
    headers: headers(creds),
    body: JSON.stringify({}),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return res.json();
}

// NEW (26) — get a single deploy key by ID
export async function getDeployKey(creds, keyId) {
  return nFetch(`/deploy_keys/${keyId}`, creds);
}

// NEW (27) — delete a deploy key
export async function deleteDeployKey(creds, keyId) {
  const res = await fetch(`${BASE}/deploy_keys/${keyId}`, {
    method: 'DELETE',
    headers: headers(creds),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return { deleted: true };
}

// ── Split Tests (A/B Testing) ──────────────────────────────────────────────

// NEW (28) — list split tests for a site
export async function listSplitTests(creds, siteId) {
  return nFetch(`/sites/${siteId}/split_tests`, creds);
}

// NEW (29) — create a split test
export async function createSplitTest(creds, siteId, body) {
  const res = await fetch(`${BASE}/sites/${siteId}/split_tests`, {
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

// NEW (30) — update (reconfigure) a split test
export async function updateSplitTest(creds, siteId, splitTestId, body) {
  const res = await fetch(`${BASE}/sites/${siteId}/split_tests/${splitTestId}`, {
    method: 'PUT',
    headers: headers(creds),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return res.json();
}

// NEW (31, bonus) — enable (publish) a split test
export async function enableSplitTest(creds, siteId, splitTestId) {
  const res = await fetch(`${BASE}/sites/${siteId}/split_tests/${splitTestId}/publish`, {
    method: 'POST',
    headers: headers(creds),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return res.json();
}

// NEW (32, bonus) — disable (unpublish) a split test
export async function disableSplitTest(creds, siteId, splitTestId) {
  const res = await fetch(`${BASE}/sites/${siteId}/split_tests/${splitTestId}/unpublish`, {
    method: 'POST',
    headers: headers(creds),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Netlify API error: ${res.status}`);
  }
  return res.json();
}
