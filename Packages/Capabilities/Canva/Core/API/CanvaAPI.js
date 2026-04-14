const BASE = 'https://api.canva.com/rest/v1';

function headers(creds) {
  return { Authorization: `Bearer ${creds.accessToken}`, 'Content-Type': 'application/json' };
}

async function canvaFetch(path, creds) {
  const res = await fetch(`${BASE}${path}`, { headers: headers(creds) });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? data.error?.message ?? `Canva API error: ${res.status}`);
  }
  return res.json();
}

export async function getUser(creds) {
  const data = await canvaFetch('/users/me', creds);
  return data.user ?? data;
}

export async function listDesigns(creds) {
  const data = await canvaFetch('/designs?limit=50', creds);
  return (data.items ?? []).map((d) => ({
    id: d.id,
    title: d.title ?? 'Untitled',
    type: d.design_type?.name ?? 'unknown',
    updatedAt: d.updated_at,
    thumbnailUrl: d.thumbnail?.url ?? null,
    urls: d.urls ?? {},
  }));
}

export async function getDesign(creds, designId) {
  const data = await canvaFetch(`/designs/${designId}`, creds);
  return data.design ?? data;
}
