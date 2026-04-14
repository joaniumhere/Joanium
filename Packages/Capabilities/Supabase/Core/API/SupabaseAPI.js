const BASE = 'https://api.supabase.com/v1';

function headers(creds) {
  return { Authorization: `Bearer ${creds.token}`, 'Content-Type': 'application/json' };
}

async function sbFetch(path, creds) {
  const res = await fetch(`${BASE}${path}`, { headers: headers(creds) });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Supabase API error: ${res.status}`);
  }
  return res.json();
}

export async function listProjects(creds) {
  const projects = await sbFetch('/projects', creds);
  return (projects ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    ref: p.ref,
    region: p.region,
    status: p.status,
    organizationId: p.organization_id,
    createdAt: p.created_at,
  }));
}

export async function listOrganizations(creds) {
  const orgs = await sbFetch('/organizations', creds);
  return (orgs ?? []).map((o) => ({ id: o.id, name: o.name, slug: o.slug }));
}

export async function listFunctions(creds, projectRef) {
  const fns = await sbFetch(`/projects/${projectRef}/functions`, creds);
  return (fns ?? []).map((f) => ({
    id: f.id,
    slug: f.slug,
    name: f.name,
    status: f.status,
    verifyJwt: f.verify_jwt,
    createdAt: f.created_at,
    updatedAt: f.updated_at,
  }));
}
