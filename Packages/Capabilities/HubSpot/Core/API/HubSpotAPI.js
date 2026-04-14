const BASE = 'https://api.hubapi.com';

function headers(creds) {
  return { Authorization: `Bearer ${creds.token}`, 'Content-Type': 'application/json' };
}

async function hFetch(path, creds) {
  const res = await fetch(`${BASE}${path}`, { headers: headers(creds) });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `HubSpot API error: ${res.status}`);
  }
  return res.json();
}

export async function getUser(creds) {
  // /oauth/v1/access-tokens/{token} returns owner info for private apps
  const data = await hFetch(`/oauth/v1/access-tokens/${creds.token}`, creds);
  return { hubId: data.hub_id, hubDomain: data.hub_domain, userId: data.user_id, user: data.user };
}

export async function listContacts(creds, limit = 20) {
  const data = await hFetch(
    `/crm/v3/objects/contacts?limit=${limit}&properties=firstname,lastname,email,phone,company,createdate`,
    creds,
  );
  return (data.results ?? []).map((c) => ({
    id: c.id,
    firstName: c.properties?.firstname ?? '',
    lastName: c.properties?.lastname ?? '',
    email: c.properties?.email ?? '',
    phone: c.properties?.phone ?? '',
    company: c.properties?.company ?? '',
    createdAt: c.properties?.createdate ?? '',
  }));
}

export async function listDeals(creds, limit = 20) {
  const data = await hFetch(
    `/crm/v3/objects/deals?limit=${limit}&properties=dealname,dealstage,amount,closedate,pipeline`,
    creds,
  );
  return (data.results ?? []).map((d) => ({
    id: d.id,
    name: d.properties?.dealname ?? 'Unnamed Deal',
    stage: d.properties?.dealstage ?? '',
    amount: d.properties?.amount ? parseFloat(d.properties.amount) : null,
    closeDate: d.properties?.closedate ?? null,
    pipeline: d.properties?.pipeline ?? '',
  }));
}

export async function listCompanies(creds, limit = 20) {
  const data = await hFetch(
    `/crm/v3/objects/companies?limit=${limit}&properties=name,domain,industry,numberofemployees`,
    creds,
  );
  return (data.results ?? []).map((c) => ({
    id: c.id,
    name: c.properties?.name ?? 'Unknown',
    domain: c.properties?.domain ?? '',
    industry: c.properties?.industry ?? '',
    employees: c.properties?.numberofemployees ?? null,
  }));
}
