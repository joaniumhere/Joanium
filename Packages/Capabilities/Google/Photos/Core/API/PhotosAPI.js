async function getFreshGoogleCreds(creds) {
  const { getFreshCreds } = await import('../../../GoogleWorkspace.js');
  return getFreshCreds(creds);
}

const PHOTOS_BASE = 'https://photoslibrary.googleapis.com/v1';

async function photosFetch(creds, url, options = {}) {
  const fresh = await getFreshGoogleCreds(creds);
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${fresh.accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(
      `Photos API error (${res.status}): ${body.error?.message ?? JSON.stringify(body)}`,
    );
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function listAlbums(
  creds,
  { maxResults = 20, excludeNonAppCreatedData = false } = {},
) {
  const params = new URLSearchParams({
    pageSize: String(Math.min(maxResults, 50)),
    excludeNonAppCreatedData: String(excludeNonAppCreatedData),
  });
  const data = await photosFetch(creds, `${PHOTOS_BASE}/albums?${params}`);
  return data.albums ?? [];
}

export async function getAlbum(creds, albumId) {
  return photosFetch(creds, `${PHOTOS_BASE}/albums/${albumId}`);
}

export async function listSharedAlbums(creds, { maxResults = 20 } = {}) {
  const params = new URLSearchParams({ pageSize: String(Math.min(maxResults, 50)) });
  const data = await photosFetch(creds, `${PHOTOS_BASE}/sharedAlbums?${params}`);
  return data.sharedAlbums ?? [];
}

export async function listMediaItems(creds, { maxResults = 20 } = {}) {
  const params = new URLSearchParams({ pageSize: String(Math.min(maxResults, 100)) });
  const data = await photosFetch(creds, `${PHOTOS_BASE}/mediaItems?${params}`);
  return data.mediaItems ?? [];
}

export async function getMediaItem(creds, mediaItemId) {
  return photosFetch(creds, `${PHOTOS_BASE}/mediaItems/${mediaItemId}`);
}

export async function searchMediaItems(creds, { albumId, pageSize = 20, filters = {} } = {}) {
  const body = { pageSize: Math.min(pageSize, 100) };
  if (albumId) body.albumId = albumId;
  if (Object.keys(filters).length) body.filters = filters;

  const data = await photosFetch(creds, `${PHOTOS_BASE}/mediaItems:search`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
  return data.mediaItems ?? [];
}

export async function searchByDateRange(creds, startDate, endDate, maxResults = 20) {
  const toDateFilter = (dateStr) => {
    const d = new Date(dateStr);
    return { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() };
  };

  return searchMediaItems(creds, {
    pageSize: maxResults,
    filters: {
      dateFilter: {
        ranges: [{ startDate: toDateFilter(startDate), endDate: toDateFilter(endDate) }],
      },
    },
  });
}

export async function searchByContentCategory(creds, categories = [], maxResults = 20) {
  const VALID = [
    'ANIMALS',
    'ARTS',
    'BIRTHDAYS',
    'CITYSCAPES',
    'CRAFTS',
    'DOCUMENTS',
    'FASHION',
    'FLOWERS',
    'FOOD',
    'GARDENS',
    'HOLIDAYS',
    'HOUSES',
    'LANDMARKS',
    'LANDSCAPES',
    'NIGHT',
    'PEOPLE',
    'PERFORMANCES',
    'PETS',
    'RECEIPTS',
    'SCREENSHOTS',
    'SELFIES',
    'SPORT',
    'TRAVEL',
    'UTILITY',
    'WEDDINGS',
    'WHITEBOARDS',
  ];
  const valid = categories.map((c) => c.toUpperCase()).filter((c) => VALID.includes(c));
  if (!valid.length) throw new Error(`Invalid categories. Valid options: ${VALID.join(', ')}`);

  return searchMediaItems(creds, {
    pageSize: maxResults,
    filters: { contentFilter: { includedContentCategories: valid } },
  });
}

export async function getAlbumMediaItems(creds, albumId, maxResults = 20) {
  return searchMediaItems(creds, { albumId, pageSize: maxResults });
}
