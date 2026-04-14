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

export async function getBot(creds) {
  return nFetch('/users/me', creds);
}

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
