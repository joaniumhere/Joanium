const BASE = 'https://api.figma.com/v1';

function headers(creds) {
  return { 'X-Figma-Token': creds.token, 'Content-Type': 'application/json' };
}

async function figFetch(path, creds) {
  const res = await fetch(`${BASE}${path}`, { headers: headers(creds) });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? data.err ?? `Figma API error: ${res.status}`);
  }
  return res.json();
}

export async function getMe(creds) {
  return figFetch('/me', creds);
}

export async function getFile(creds, fileKey) {
  const data = await figFetch(`/files/${fileKey}?depth=1`, creds);
  return {
    key: fileKey,
    name: data.name,
    lastModified: data.lastModified,
    version: data.version,
    role: data.role,
    pages: (data.document?.children ?? []).map((p) => ({ id: p.id, name: p.name })),
    componentCount: Object.keys(data.components ?? {}).length,
    styleCount: Object.keys(data.styles ?? {}).length,
  };
}

export async function getFileComments(creds, fileKey) {
  const data = await figFetch(`/files/${fileKey}/comments`, creds);
  return (data.comments ?? []).map((c) => ({
    id: c.id,
    message: c.message,
    author: c.user?.handle ?? 'unknown',
    createdAt: c.created_at,
    resolved: c.resolved_at != null,
  }));
}
