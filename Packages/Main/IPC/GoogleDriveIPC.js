import { ipcMain } from 'electron';
import * as DriveAPI from '../../Automation/Integrations/GoogleDrive.js';

export function register(connectorEngine) {
  // All Drive calls read from the unified 'google' connector
  function creds() { return connectorEngine.getCredentials('google'); }
  function notConnected() { return { ok: false, error: 'Google Workspace not connected — connect it in Settings → Connectors' }; }

  ipcMain.handle('drive-list-files', async (_e, opts = {}) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      const files = await DriveAPI.listFiles(c, opts);
      return { ok: true, files };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('drive-search-files', async (_e, query, maxResults = 20) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      if (!query?.trim()) return { ok: false, error: 'Search query is required' };
      const files = await DriveAPI.searchFiles(c, query, maxResults);
      return { ok: true, files };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('drive-get-file-info', async (_e, fileId) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      if (!fileId) return { ok: false, error: 'fileId is required' };
      const file = await DriveAPI.getFileMetadata(c, fileId);
      return { ok: true, file };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('drive-read-file', async (_e, fileId) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      if (!fileId) return { ok: false, error: 'fileId is required' };
      const result = await DriveAPI.getFileContent(c, fileId);
      return { ok: true, ...result };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('drive-create-file', async (_e, name, content, mimeType, folderId) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      if (!name) return { ok: false, error: 'File name is required' };
      const file = await DriveAPI.createFile(c, name, content ?? '', mimeType, folderId);
      return { ok: true, file };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('drive-update-file', async (_e, fileId, content, mimeType) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      if (!fileId) return { ok: false, error: 'fileId is required' };
      const file = await DriveAPI.updateFileContent(c, fileId, content ?? '', mimeType);
      return { ok: true, file };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('drive-list-folders', async (_e, maxResults = 30) => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      const folders = await DriveAPI.listFolders(c, maxResults);
      return { ok: true, folders };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('drive-get-quota', async () => {
    try {
      const c = creds(); if (!c?.accessToken) return notConnected();
      const data = await DriveAPI.getStorageQuota(c);
      return { ok: true, ...data };
    } catch (err) { return { ok: false, error: err.message }; }
  });
}
