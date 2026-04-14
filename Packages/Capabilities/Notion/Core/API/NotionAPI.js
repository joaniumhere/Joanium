const BASE = 'https://api.notion.com/v1';
const NOTION_VERSION = '2022-06-28';

function headers(creds) {
  return {
    Authorization: `Bearer ${creds.token}`,
    'Content-Type': 'application/json',
    'Notion-Version': NOTION_VERSION,
  };
}

async function nFetch(path, creds, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { ...headers(creds), ...(options.headers ?? {}) },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message ?? `Notion API error: ${res.status}`);
  }
  return res.json();
}

// ─── Auth / Bot ────────────────────────────────────────────────────────────

export async function getBot(creds) {
  return nFetch('/users/me', creds);
}

// ─── Pages ─────────────────────────────────────────────────────────────────

export async function searchPages(creds, query = '', limit = 20) {
  const data = await nFetch('/search', creds, {
    method: 'POST',
    body: JSON.stringify({
      query,
      filter: { value: 'page', property: 'object' },
      sort: { direction: 'descending', timestamp: 'last_edited_time' },
      page_size: limit,
    }),
  });
  return (data.results ?? []).map((p) => ({
    id: p.id,
    title:
      p.properties?.title?.title?.[0]?.plain_text ??
      p.properties?.Name?.title?.[0]?.plain_text ??
      'Untitled',
    url: p.url,
    lastEdited: p.last_edited_time,
    createdTime: p.created_time,
  }));
}

/** Retrieve a single page by its ID. */
export async function getPage(creds, pageId) {
  const p = await nFetch(`/pages/${pageId}`, creds);
  return {
    id: p.id,
    title:
      p.properties?.title?.title?.[0]?.plain_text ??
      p.properties?.Name?.title?.[0]?.plain_text ??
      'Untitled',
    url: p.url,
    archived: p.archived,
    createdTime: p.created_time,
    lastEdited: p.last_edited_time,
    properties: p.properties,
  };
}

/**
 * Create a new page. parentId can be a page ID or database ID.
 * parentType: 'page_id' | 'database_id'
 */
export async function createPage(
  creds,
  { parentId, parentType = 'page_id', title, properties = {} },
) {
  const titleProp = { title: [{ type: 'text', text: { content: title ?? 'Untitled' } }] };
  const body = {
    parent: { [parentType]: parentId },
    properties:
      parentType === 'database_id' ? { ...properties, Name: titleProp } : { title: titleProp },
  };
  const p = await nFetch('/pages', creds, { method: 'POST', body: JSON.stringify(body) });
  return { id: p.id, url: p.url };
}

/** Update a page's title (works for plain pages; for DB pages use updateDatabaseEntry). */
export async function updatePageTitle(creds, pageId, newTitle) {
  const p = await nFetch(`/pages/${pageId}`, creds, {
    method: 'PATCH',
    body: JSON.stringify({
      properties: { title: [{ type: 'text', text: { content: newTitle } }] },
    }),
  });
  return { id: p.id, url: p.url };
}

/** Archive (soft-delete) a page. */
export async function archivePage(creds, pageId) {
  const p = await nFetch(`/pages/${pageId}`, creds, {
    method: 'PATCH',
    body: JSON.stringify({ archived: true }),
  });
  return { id: p.id, archived: p.archived };
}

/** Retrieve a specific page property item by property ID. */
export async function getPageProperty(creds, pageId, propertyId) {
  return nFetch(`/pages/${pageId}/properties/${propertyId}`, creds);
}

/**
 * Create a page with initial content blocks (paragraphs).
 * contentBlocks: array of strings — each becomes a paragraph block.
 */
export async function createPageWithContent(
  creds,
  { parentId, parentType = 'page_id', title, contentBlocks = [] },
) {
  const children = contentBlocks.map((text) => ({
    object: 'block',
    type: 'paragraph',
    paragraph: { rich_text: [{ type: 'text', text: { content: text } }] },
  }));
  const body = {
    parent: { [parentType]: parentId },
    properties: { title: [{ type: 'text', text: { content: title ?? 'Untitled' } }] },
    children,
  };
  const p = await nFetch('/pages', creds, { method: 'POST', body: JSON.stringify(body) });
  return { id: p.id, url: p.url };
}

// ─── Blocks ─────────────────────────────────────────────────────────────────

/** Get all top-level block children of a page or block. */
export async function getBlockChildren(creds, blockId, limit = 50) {
  const data = await nFetch(`/blocks/${blockId}/children?page_size=${limit}`, creds);
  return (data.results ?? []).map((b) => ({
    id: b.id,
    type: b.type,
    content: extractBlockText(b),
    hasChildren: b.has_children,
    archived: b.archived,
  }));
}

function extractBlockText(block) {
  const rt = block[block.type]?.rich_text ?? block[block.type]?.text ?? [];
  return rt.map((t) => t.plain_text ?? '').join('') || null;
}

/** Append a plain paragraph block to a page or block. */
export async function appendTextBlock(creds, blockId, text) {
  return appendBlocks(creds, blockId, [
    {
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: text } }] },
    },
  ]);
}

/** Append a to-do block. */
export async function appendTodoBlock(creds, blockId, text, checked = false) {
  return appendBlocks(creds, blockId, [
    {
      object: 'block',
      type: 'to_do',
      to_do: { rich_text: [{ type: 'text', text: { content: text } }], checked },
    },
  ]);
}

/** Append a heading block. level: 1 | 2 | 3 */
export async function appendHeadingBlock(creds, blockId, text, level = 2) {
  const type = `heading_${level}`;
  return appendBlocks(creds, blockId, [
    { object: 'block', type, [type]: { rich_text: [{ type: 'text', text: { content: text } }] } },
  ]);
}

/** Append multiple bulleted list items. items: string[] */
export async function appendBulletList(creds, blockId, items) {
  const blocks = items.map((item) => ({
    object: 'block',
    type: 'bulleted_list_item',
    bulleted_list_item: { rich_text: [{ type: 'text', text: { content: item } }] },
  }));
  return appendBlocks(creds, blockId, blocks);
}

/** Append multiple numbered list items. items: string[] */
export async function appendNumberedList(creds, blockId, items) {
  const blocks = items.map((item) => ({
    object: 'block',
    type: 'numbered_list_item',
    numbered_list_item: { rich_text: [{ type: 'text', text: { content: item } }] },
  }));
  return appendBlocks(creds, blockId, blocks);
}

/** Append a code block with optional language. */
export async function appendCodeBlock(creds, blockId, code, language = 'plain text') {
  return appendBlocks(creds, blockId, [
    {
      object: 'block',
      type: 'code',
      code: { rich_text: [{ type: 'text', text: { content: code } }], language },
    },
  ]);
}

/** Append a horizontal divider block. */
export async function appendDivider(creds, blockId) {
  return appendBlocks(creds, blockId, [{ object: 'block', type: 'divider', divider: {} }]);
}

/** Internal helper — appends an array of block objects. */
async function appendBlocks(creds, blockId, children) {
  const data = await nFetch(`/blocks/${blockId}/children`, creds, {
    method: 'PATCH',
    body: JSON.stringify({ children }),
  });
  return (data.results ?? []).map((b) => ({ id: b.id, type: b.type }));
}

/** Delete (archive) a block by its ID. */
export async function deleteBlock(creds, blockId) {
  const b = await nFetch(`/blocks/${blockId}`, creds, { method: 'DELETE' });
  return { id: b.id, archived: b.archived };
}

// ─── Databases ───────────────────────────────────────────────────────────────

export async function searchDatabases(creds, limit = 20) {
  const data = await nFetch('/search', creds, {
    method: 'POST',
    body: JSON.stringify({
      filter: { value: 'database', property: 'object' },
      sort: { direction: 'descending', timestamp: 'last_edited_time' },
      page_size: limit,
    }),
  });
  return (data.results ?? []).map((db) => ({
    id: db.id,
    title: db.title?.[0]?.plain_text ?? 'Untitled',
    url: db.url,
    lastEdited: db.last_edited_time,
  }));
}

/** Retrieve a single database by its ID. */
export async function getDatabase(creds, databaseId) {
  const db = await nFetch(`/databases/${databaseId}`, creds);
  return {
    id: db.id,
    title: db.title?.[0]?.plain_text ?? 'Untitled',
    url: db.url,
    properties: Object.keys(db.properties ?? {}),
    lastEdited: db.last_edited_time,
  };
}

/** Return the full property schema for a database. */
export async function getDatabaseSchema(creds, databaseId) {
  const db = await nFetch(`/databases/${databaseId}`, creds);
  return Object.entries(db.properties ?? {}).map(([name, prop]) => ({
    name,
    type: prop.type,
    id: prop.id,
  }));
}

/** Query a database, returning all pages up to limit. */
export async function queryDatabase(creds, databaseId, limit = 20) {
  const data = await nFetch(`/databases/${databaseId}/query`, creds, {
    method: 'POST',
    body: JSON.stringify({ page_size: limit }),
  });
  return (data.results ?? []).map((p) => ({
    id: p.id,
    url: p.url,
    lastEdited: p.last_edited_time,
    properties: p.properties,
  }));
}

/**
 * Filter a database with a Notion filter object.
 * filterObj: Notion filter (e.g. { property: 'Status', select: { equals: 'Done' } })
 */
export async function filterDatabase(creds, databaseId, filterObj, limit = 20) {
  const data = await nFetch(`/databases/${databaseId}/query`, creds, {
    method: 'POST',
    body: JSON.stringify({ filter: filterObj, page_size: limit }),
  });
  return (data.results ?? []).map((p) => ({
    id: p.id,
    url: p.url,
    lastEdited: p.last_edited_time,
    properties: p.properties,
  }));
}

/**
 * Create a new inline database as a child of a page.
 * title: string, properties: Notion property schema object
 */
export async function createDatabase(creds, { parentPageId, title, properties = {} }) {
  const defaultProps = {
    Name: { title: {} },
    ...properties,
  };
  const db = await nFetch('/databases', creds, {
    method: 'POST',
    body: JSON.stringify({
      parent: { type: 'page_id', page_id: parentPageId },
      title: [{ type: 'text', text: { content: title ?? 'New Database' } }],
      properties: defaultProps,
    }),
  });
  return { id: db.id, url: db.url };
}

/**
 * Create a new entry (page) in a database.
 * properties: object where keys are property names and values follow Notion property value shape.
 * title: convenience shortcut — sets the Name/title property.
 */
export async function createDatabaseEntry(creds, databaseId, { title, properties = {} }) {
  const titleProp = title ? { Name: { title: [{ type: 'text', text: { content: title } }] } } : {};
  const p = await nFetch('/pages', creds, {
    method: 'POST',
    body: JSON.stringify({
      parent: { database_id: databaseId },
      properties: { ...titleProp, ...properties },
    }),
  });
  return { id: p.id, url: p.url };
}

/**
 * Update properties on an existing database entry (page).
 * properties: Notion property value map.
 */
export async function updateDatabaseEntry(creds, pageId, properties) {
  const p = await nFetch(`/pages/${pageId}`, creds, {
    method: 'PATCH',
    body: JSON.stringify({ properties }),
  });
  return { id: p.id, url: p.url };
}

/** Archive a database entry. */
export async function archiveDatabaseEntry(creds, pageId) {
  const p = await nFetch(`/pages/${pageId}`, creds, {
    method: 'PATCH',
    body: JSON.stringify({ archived: true }),
  });
  return { id: p.id, archived: p.archived };
}

// ─── Comments ────────────────────────────────────────────────────────────────

/** List all comments on a page or block. */
export async function getComments(creds, blockId) {
  const data = await nFetch(`/comments?block_id=${blockId}`, creds);
  return (data.results ?? []).map((c) => ({
    id: c.id,
    text: c.rich_text?.map((t) => t.plain_text).join('') ?? '',
    createdTime: c.created_time,
    createdBy: c.created_by?.id,
  }));
}

/** Add a comment to a page or existing discussion. */
export async function addComment(creds, pageId, text) {
  const c = await nFetch('/comments', creds, {
    method: 'POST',
    body: JSON.stringify({
      parent: { page_id: pageId },
      rich_text: [{ type: 'text', text: { content: text } }],
    }),
  });
  return { id: c.id, text };
}

// ─── Users ───────────────────────────────────────────────────────────────────

/** List all users in the workspace. */
export async function getUsers(creds, limit = 50) {
  const data = await nFetch(`/users?page_size=${limit}`, creds);
  return (data.results ?? []).map((u) => ({
    id: u.id,
    name: u.name,
    type: u.type,
    email: u.person?.email ?? null,
    avatarUrl: u.avatar_url ?? null,
  }));
}

/** Retrieve a single user by their ID. */
export async function getUser(creds, userId) {
  const u = await nFetch(`/users/${userId}`, creds);
  return {
    id: u.id,
    name: u.name,
    type: u.type,
    email: u.person?.email ?? null,
    avatarUrl: u.avatar_url ?? null,
  };
}
