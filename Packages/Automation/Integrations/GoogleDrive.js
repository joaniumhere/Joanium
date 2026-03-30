import http from 'http';
import { shell } from 'electron';

/* ══════════════════════════════════════════
   CONFIG
══════════════════════════════════════════ */
const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL       = 'https://oauth2.googleapis.com/token';
const USERINFO_URL    = 'https://www.googleapis.com/oauth2/v2/userinfo';
const DRIVE_BASE      = 'https://www.googleapis.com/drive/v3';
const UPLOAD_BASE     = 'https://www.googleapis.com/upload/drive/v3';

const CALLBACK_PORT = 42814;
const REDIRECT_URI  = `http://localhost:${CALLBACK_PORT}/oauth/callback`;

const SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/userinfo.email',
].join(' ');

// Google Workspace types → export MIME
const EXPORT_MIMES = {
  'application/vnd.google-apps.document':     { mime: 'text/plain',  ext: 'txt' },
  'application/vnd.google-apps.spreadsheet':  { mime: 'text/csv',    ext: 'csv' },
  'application/vnd.google-apps.presentation': { mime: 'text/plain',  ext: 'txt' },
  'application/vnd.google-apps.drawing':      { mime: 'image/svg+xml', ext: 'svg' },
};

const TEXT_MIMES = new Set([
  'text/plain', 'text/html', 'text/css', 'text/javascript', 'application/json',
  'text/csv', 'text/xml', 'application/xml', 'text/markdown',
]);

const MAX_CONTENT_CHARS = 30_000;

/* ══════════════════════════════════════════
   CONNECTOR ENGINE REF
══════════════════════════════════════════ */
let _connectorEngine = null;
export function setConnectorEngine(engine) { _connectorEngine = engine; }

/* ══════════════════════════════════════════
   OAUTH FLOW
══════════════════════════════════════════ */
export function startDriveOAuthFlow(clientId, clientSecret) {
  return new Promise((resolve, reject) => {
    let settled = false;
    function settle(fn) { if (settled) return; settled = true; fn(); }

    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, `http://localhost:${CALLBACK_PORT}`);
        if (url.pathname !== '/oauth/callback') return res.end();

        const code  = url.searchParams.get('code');
        const error = url.searchParams.get('error');

        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`<h2 style="font-family:sans-serif">${error ? '❌ Failed to connect Drive' : '✅ Google Drive connected!'}</h2><p>You can close this tab.</p>`);
        server.close();

        if (error || !code) return settle(() => reject(new Error(error || 'No auth code returned')));
        const tokens = await exchangeCode(code, clientId, clientSecret);
        settle(() => resolve(tokens));
      } catch (err) {
        server.close();
        settle(() => reject(err));
      }
    });

    server.listen(CALLBACK_PORT, 'localhost', () => {
      const authUrl = new URL(GOOGLE_AUTH_URL);
      authUrl.searchParams.set('client_id',     clientId);
      authUrl.searchParams.set('redirect_uri',  REDIRECT_URI);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('scope',         SCOPES);
      authUrl.searchParams.set('access_type',   'offline');
      authUrl.searchParams.set('prompt',        'consent');
      shell.openExternal(authUrl.toString());
    });
  });
}

async function exchangeCode(code, clientId, clientSecret) {
  const res = await fetch(TOKEN_URL, {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: clientId, client_secret: clientSecret,
      redirect_uri: REDIRECT_URI, grant_type: 'authorization_code',
    }),
  });
  const data = await res.json();
  const profileRes = await fetch(USERINFO_URL, { headers: { Authorization: `Bearer ${data.access_token}` } });
  const profile = await profileRes.json();
  return {
    accessToken:  data.access_token,
    refreshToken: data.refresh_token,
    tokenExpiry:  Date.now() + (data.expires_in ?? 3600) * 1000,
    email:        profile.email,
    clientId,
    clientSecret,
  };
}

/* ══════════════════════════════════════════
   TOKEN REFRESH
══════════════════════════════════════════ */
async function getFreshCreds(creds) {
  const bufferMs = 2 * 60 * 1000;
  const isExpired = !creds.tokenExpiry || Date.now() > (creds.tokenExpiry - bufferMs);
  if (!isExpired) return creds;

  if (!creds.refreshToken) throw new Error('Drive token expired and no refresh token available. Please reconnect Drive in Settings → Connectors.');

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: creds.clientId, client_secret: creds.clientSecret,
      refresh_token: creds.refreshToken, grant_type: 'refresh_token',
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Token refresh failed: ${err.error_description ?? err.error ?? res.status}. Please reconnect Drive.`);
  }

  const data = await res.json();
  const updated = {
    ...creds,
    accessToken: data.access_token,
    tokenExpiry: Date.now() + (data.expires_in ?? 3600) * 1000,
    ...(data.refresh_token ? { refreshToken: data.refresh_token } : {}),
  };

  _connectorEngine?.updateCredentials('gdrive', {
    accessToken: updated.accessToken,
    tokenExpiry: updated.tokenExpiry,
    ...(data.refresh_token ? { refreshToken: updated.refreshToken } : {}),
  });

  return updated;
}

/* ══════════════════════════════════════════
   INTERNAL FETCH HELPER
══════════════════════════════════════════ */
async function driveFetch(creds, url, options = {}) {
  const fresh = await getFreshCreds(creds);
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${fresh.accessToken}`,
      ...(options.headers ?? {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Drive API error (${res.status}): ${body.error?.message ?? JSON.stringify(body)}`);
  }

  if (res.status === 204) return null;
  const ct = res.headers.get('content-type') ?? '';
  return ct.includes('json') ? res.json() : res.text();
}

/* ══════════════════════════════════════════
   PUBLIC API
══════════════════════════════════════════ */
export async function validateCredentials(creds) {
  const data = await driveFetch(creds, `${DRIVE_BASE}/about?fields=user`);
  return data.user?.emailAddress ?? '';
}

export async function getStorageQuota(creds) {
  const data = await driveFetch(creds, `${DRIVE_BASE}/about?fields=storageQuota,user`);
  return { quota: data.storageQuota, email: data.user?.emailAddress };
}

export async function listFiles(creds, { folderId, pageSize = 20, orderBy = 'modifiedTime desc', mimeType } = {}) {
  const conditions = ['trashed=false'];
  if (folderId) conditions.push(`'${folderId}' in parents`);
  if (mimeType) conditions.push(`mimeType='${mimeType}'`);

  const params = new URLSearchParams({
    q: conditions.join(' and '),
    pageSize: String(Math.min(pageSize, 100)),
    orderBy,
    fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink,parents)',
  });

  const data = await driveFetch(creds, `${DRIVE_BASE}/files?${params}`);
  return data.files ?? [];
}

export async function searchFiles(creds, query, maxResults = 20) {
  const escaped = query.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
  const q = `(name contains '${escaped}' or fullText contains '${escaped}') and trashed=false`;
  const params = new URLSearchParams({
    q,
    pageSize: String(Math.min(maxResults, 50)),
    fields: 'files(id,name,mimeType,size,modifiedTime,webViewLink)',
    orderBy: 'modifiedTime desc',
  });
  const data = await driveFetch(creds, `${DRIVE_BASE}/files?${params}`);
  return data.files ?? [];
}

export async function getFileMetadata(creds, fileId) {
  return driveFetch(creds, `${DRIVE_BASE}/files/${fileId}?fields=id,name,mimeType,size,modifiedTime,createdTime,webViewLink,parents,owners,description,shared`);
}

export async function getFileContent(creds, fileId) {
  const meta = await getFileMetadata(creds, fileId);
  const exportConfig = EXPORT_MIMES[meta.mimeType];

  if (exportConfig) {
    // Google Workspace file — export as plain text/CSV
    const fresh = await getFreshCreds(creds);
    const res = await fetch(`${DRIVE_BASE}/files/${fileId}/export?mimeType=${encodeURIComponent(exportConfig.mime)}`, {
      headers: { Authorization: `Bearer ${fresh.accessToken}` },
    });
    if (!res.ok) throw new Error(`Export failed (${res.status})`);
    const text = await res.text();
    return { meta, content: text.slice(0, MAX_CONTENT_CHARS), isGoogleWorkspace: true, exportMime: exportConfig.mime };
  }

  // Text files — download directly
  if (TEXT_MIMES.has(meta.mimeType) || meta.mimeType?.startsWith('text/')) {
    const fresh = await getFreshCreds(creds);
    const res = await fetch(`${DRIVE_BASE}/files/${fileId}?alt=media`, {
      headers: { Authorization: `Bearer ${fresh.accessToken}` },
    });
    if (!res.ok) throw new Error(`Download failed (${res.status})`);
    const text = await res.text();
    return { meta, content: text.slice(0, MAX_CONTENT_CHARS), isGoogleWorkspace: false };
  }

  return { meta, content: null, isGoogleWorkspace: false, binaryFile: true };
}

export async function createFile(creds, name, content, mimeType = 'text/plain', folderId = null) {
  const fresh = await getFreshCreds(creds);
  const metadata = { name, mimeType, ...(folderId ? { parents: [folderId] } : {}) };
  const boundary = 'joanium_drive_boundary';

  const body = [
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n`,
    JSON.stringify(metadata),
    `\r\n--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
    content,
    `\r\n--${boundary}--`,
  ].join('');

  const res = await fetch(`${UPLOAD_BASE}/files?uploadType=multipart&fields=id,name,webViewLink,mimeType`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${fresh.accessToken}`,
      'Content-Type': `multipart/related; boundary=${boundary}`,
    },
    body,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Drive create failed (${res.status}): ${err.error?.message ?? ''}`);
  }
  return res.json();
}

export async function updateFileContent(creds, fileId, content, mimeType = 'text/plain') {
  const fresh = await getFreshCreds(creds);
  const res = await fetch(`${UPLOAD_BASE}/files/${fileId}?uploadType=media`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${fresh.accessToken}`, 'Content-Type': mimeType },
    body: content,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Drive update failed (${res.status}): ${err.error?.message ?? ''}`);
  }
  return res.json();
}

export async function listFolders(creds, maxResults = 20) {
  const params = new URLSearchParams({
    q: "mimeType='application/vnd.google-apps.folder' and trashed=false",
    pageSize: String(Math.min(maxResults, 50)),
    orderBy: 'name',
    fields: 'files(id,name,parents)',
  });
  const data = await driveFetch(creds, `${DRIVE_BASE}/files?${params}`);
  return data.files ?? [];
}
