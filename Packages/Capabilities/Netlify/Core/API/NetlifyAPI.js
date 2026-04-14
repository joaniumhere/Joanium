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

export async function getUser(creds) {
  return nFetch('/user', creds);
}

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
