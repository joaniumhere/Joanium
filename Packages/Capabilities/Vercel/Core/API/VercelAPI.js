const BASE = 'https://api.vercel.com';

function headers(creds) {
  return { Authorization: `Bearer ${creds.token}`, 'Content-Type': 'application/json' };
}

async function vFetch(path, creds) {
  const res = await fetch(`${BASE}${path}`, { headers: headers(creds) });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message ?? `Vercel API error: ${res.status}`);
  }
  return res.json();
}

export async function getUser(creds) {
  const data = await vFetch('/v2/user', creds);
  return data.user ?? data;
}

export async function listProjects(creds) {
  const data = await vFetch('/v9/projects?limit=50', creds);
  return (data.projects ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    framework: p.framework ?? 'unknown',
    updatedAt: p.updatedAt,
    latestDeploy: p.latestDeployments?.[0]?.readyState ?? 'unknown',
    domains: (p.alias ?? []).map((a) => a.domain),
  }));
}

export async function listDeployments(creds, limit = 20) {
  const data = await vFetch(`/v6/deployments?limit=${limit}`, creds);
  return (data.deployments ?? []).map((d) => ({
    id: d.uid,
    name: d.name,
    url: d.url,
    state: d.state,
    createdAt: d.createdAt,
    target: d.target ?? 'preview',
  }));
}
