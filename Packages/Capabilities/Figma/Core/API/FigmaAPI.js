const BASE = 'https://api.figma.com/v1';

function headers(creds) {
  return { 'X-Figma-Token': creds.token, 'Content-Type': 'application/json' };
}

async function figFetch(path, creds, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(creds),
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? data.err ?? `Figma API error: ${res.status}`);
  }
  // DELETE returns 200 with no body or a status object
  if (options.method === 'DELETE') return { ok: true };
  return res.json();
}

// ─── User ────────────────────────────────────────────────────────────────────

export async function getMe(creds) {
  return figFetch('/me', creds);
}

// ─── Files ───────────────────────────────────────────────────────────────────

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

export async function getFileNodes(creds, fileKey, ids) {
  // ids: array of node IDs
  const joined = Array.isArray(ids) ? ids.join(',') : ids;
  const data = await figFetch(`/files/${fileKey}/nodes?ids=${encodeURIComponent(joined)}`, creds);
  return Object.entries(data.nodes ?? {}).map(([id, node]) => ({
    id,
    name: node.document?.name ?? null,
    type: node.document?.type ?? null,
    visible: node.document?.visible ?? true,
    components: node.components ?? {},
    styles: node.styles ?? {},
  }));
}

export async function getFilePage(creds, fileKey, pageId) {
  // Fetch full file at depth=2, then extract the requested page
  const data = await figFetch(`/files/${fileKey}?depth=2`, creds);
  const page = (data.document?.children ?? []).find((p) => p.id === pageId);
  if (!page) throw new Error(`Page "${pageId}" not found in file`);
  return {
    id: page.id,
    name: page.name,
    type: page.type,
    childCount: (page.children ?? []).length,
    children: (page.children ?? []).map((c) => ({
      id: c.id,
      name: c.name,
      type: c.type,
      visible: c.visible ?? true,
    })),
  };
}

export async function getFileVersions(creds, fileKey) {
  const data = await figFetch(`/files/${fileKey}/versions`, creds);
  return (data.versions ?? []).map((v) => ({
    id: v.id,
    label: v.label ?? null,
    description: v.description ?? null,
    createdAt: v.created_at,
    user: v.user?.handle ?? 'unknown',
  }));
}

export async function getFileThumbnail(creds, fileKey) {
  // thumbnail_url is returned in the standard file endpoint
  const data = await figFetch(`/files/${fileKey}?depth=0`, creds);
  return {
    fileKey,
    thumbnailUrl: data.thumbnailUrl ?? null,
    name: data.name,
    lastModified: data.lastModified,
  };
}

export async function getFileComponents(creds, fileKey) {
  const data = await figFetch(`/files/${fileKey}?depth=1`, creds);
  return Object.entries(data.components ?? {}).map(([key, c]) => ({
    key,
    name: c.name,
    description: c.description ?? null,
    nodeId: c.node_id ?? null,
  }));
}

export async function getFileStyles(creds, fileKey) {
  const data = await figFetch(`/files/${fileKey}?depth=1`, creds);
  return Object.entries(data.styles ?? {}).map(([key, s]) => ({
    key,
    name: s.name,
    styleType: s.style_type,
    description: s.description ?? null,
    nodeId: s.node_id ?? null,
  }));
}

export async function getImageFills(creds, fileKey) {
  const data = await figFetch(`/files/${fileKey}/image_fills`, creds);
  return data.images ?? {};
}

// ─── Images / Export ─────────────────────────────────────────────────────────

export async function exportNodes(creds, fileKey, ids, format = 'png', scale = 1) {
  const joined = Array.isArray(ids) ? ids.join(',') : ids;
  const data = await figFetch(
    `/images/${fileKey}?ids=${encodeURIComponent(joined)}&format=${format}&scale=${scale}`,
    creds,
  );
  if (data.err) throw new Error(data.err);
  return data.images ?? {};
}

// ─── Comments ────────────────────────────────────────────────────────────────

export async function getFileComments(creds, fileKey) {
  const data = await figFetch(`/files/${fileKey}/comments`, creds);
  return (data.comments ?? []).map((c) => ({
    id: c.id,
    message: c.message,
    author: c.user?.handle ?? 'unknown',
    createdAt: c.created_at,
    resolved: c.resolved_at != null,
    resolvedAt: c.resolved_at ?? null,
    parentId: c.parent_id ?? null,
    orderPriority: c.order_id ?? null,
  }));
}

export async function postComment(creds, fileKey, message, nodeId = null) {
  const body = { message };
  if (nodeId) body.client_meta = { node_id: nodeId };
  const data = await figFetch(`/files/${fileKey}/comments`, creds, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return {
    id: data.id,
    message: data.message,
    author: data.user?.handle ?? 'unknown',
    createdAt: data.created_at,
  };
}

export async function deleteComment(creds, fileKey, commentId) {
  return figFetch(`/files/${fileKey}/comments/${commentId}`, creds, { method: 'DELETE' });
}

export async function resolveComment(creds, fileKey, commentId) {
  // Figma resolves comments by DELETE-ing them from the unresolved list (same endpoint as delete)
  // As of the Figma REST v1 API, there is no explicit resolve endpoint — deleting = resolving.
  return figFetch(`/files/${fileKey}/comments/${commentId}`, creds, { method: 'DELETE' });
}

// ─── Teams & Projects ────────────────────────────────────────────────────────

export async function getTeamProjects(creds, teamId) {
  const data = await figFetch(`/teams/${teamId}/projects`, creds);
  return (data.projects ?? []).map((p) => ({
    id: p.id,
    name: p.name,
  }));
}

export async function getProjectFiles(creds, projectId) {
  const data = await figFetch(`/projects/${projectId}/files`, creds);
  return (data.files ?? []).map((f) => ({
    key: f.key,
    name: f.name,
    thumbnailUrl: f.thumbnail_url ?? null,
    lastModified: f.last_modified,
  }));
}

// ─── Components ──────────────────────────────────────────────────────────────

export async function getTeamComponents(creds, teamId) {
  const data = await figFetch(`/teams/${teamId}/components`, creds);
  return (data.meta?.components ?? []).map((c) => ({
    key: c.key,
    name: c.name,
    description: c.description ?? null,
    fileKey: c.file_key,
    nodeId: c.node_id,
    thumbnailUrl: c.thumbnail_url ?? null,
    updatedAt: c.updated_at,
  }));
}

export async function getComponent(creds, componentKey) {
  const data = await figFetch(`/components/${componentKey}`, creds);
  const c = data.meta ?? data;
  return {
    key: c.key,
    name: c.name,
    description: c.description ?? null,
    fileKey: c.file_key,
    nodeId: c.node_id,
    thumbnailUrl: c.thumbnail_url ?? null,
    createdAt: c.created_at,
    updatedAt: c.updated_at,
  };
}

export async function getTeamComponentSets(creds, teamId) {
  const data = await figFetch(`/teams/${teamId}/component_sets`, creds);
  return (data.meta?.component_sets ?? []).map((cs) => ({
    key: cs.key,
    name: cs.name,
    description: cs.description ?? null,
    fileKey: cs.file_key,
    nodeId: cs.node_id,
    thumbnailUrl: cs.thumbnail_url ?? null,
  }));
}

export async function getComponentSet(creds, componentSetKey) {
  const data = await figFetch(`/component_sets/${componentSetKey}`, creds);
  const cs = data.meta ?? data;
  return {
    key: cs.key,
    name: cs.name,
    description: cs.description ?? null,
    fileKey: cs.file_key,
    nodeId: cs.node_id,
  };
}

// ─── Styles ──────────────────────────────────────────────────────────────────

export async function getTeamStyles(creds, teamId) {
  const data = await figFetch(`/teams/${teamId}/styles`, creds);
  return (data.meta?.styles ?? []).map((s) => ({
    key: s.key,
    name: s.name,
    styleType: s.style_type,
    description: s.description ?? null,
    fileKey: s.file_key,
    nodeId: s.node_id,
  }));
}

export async function getStyle(creds, styleKey) {
  const data = await figFetch(`/styles/${styleKey}`, creds);
  const s = data.meta ?? data;
  return {
    key: s.key,
    name: s.name,
    styleType: s.style_type,
    description: s.description ?? null,
    fileKey: s.file_key,
    nodeId: s.node_id,
    createdAt: s.created_at,
    updatedAt: s.updated_at,
  };
}

// ─── Variables ───────────────────────────────────────────────────────────────

export async function getLocalVariables(creds, fileKey) {
  const data = await figFetch(`/files/${fileKey}/variables/local`, creds);
  const meta = data.meta ?? {};
  const collections = Object.values(meta.variableCollections ?? {}).map((vc) => ({
    id: vc.id,
    name: vc.name,
    modes: vc.modes ?? [],
    variableIds: vc.variableIds ?? [],
  }));
  const variables = Object.values(meta.variables ?? {}).map((v) => ({
    id: v.id,
    name: v.name,
    resolvedType: v.resolvedType,
    collectionId: v.variableCollectionId,
    description: v.description ?? null,
  }));
  return { collections, variables };
}

export async function getPublishedVariables(creds, fileKey) {
  const data = await figFetch(`/files/${fileKey}/variables/published`, creds);
  const meta = data.meta ?? {};
  const collections = Object.values(meta.variableCollections ?? {}).map((vc) => ({
    id: vc.id,
    name: vc.name,
    modes: vc.modes ?? [],
  }));
  const variables = Object.values(meta.variables ?? {}).map((v) => ({
    id: v.id,
    name: v.name,
    resolvedType: v.resolvedType,
    collectionId: v.variableCollectionId,
    description: v.description ?? null,
    hiddenFromPublishing: v.hiddenFromPublishing ?? false,
  }));
  return { collections, variables };
}
