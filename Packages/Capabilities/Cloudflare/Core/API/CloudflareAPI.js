const BASE = 'https://api.cloudflare.com/client/v4';

function headers(creds) {
  return { Authorization: `Bearer ${creds.token}`, 'Content-Type': 'application/json' };
}

async function cfFetch(path, creds, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...headers(creds), ...(options.headers ?? {}) },
  });
  const data = await res.json();
  if (!data.success)
    throw new Error(data.errors?.[0]?.message ?? `Cloudflare API error: ${res.status}`);
  return data.result;
}

export async function verifyToken(creds) {
  return cfFetch('/user/tokens/verify', creds);
}

export async function listZones(creds) {
  const zones = await cfFetch('/zones?per_page=50&status=active', creds);
  return (zones ?? []).map((z) => ({
    id: z.id,
    name: z.name,
    status: z.status,
    plan: z.plan?.name ?? 'Unknown',
    nameServers: z.name_servers ?? [],
    modifiedOn: z.modified_on,
  }));
}

export async function listDnsRecords(creds, zoneId) {
  const records = await cfFetch(`/zones/${zoneId}/dns_records?per_page=100`, creds);
  return (records ?? []).map((r) => ({
    id: r.id,
    type: r.type,
    name: r.name,
    content: r.content,
    proxied: r.proxied,
    ttl: r.ttl,
  }));
}
