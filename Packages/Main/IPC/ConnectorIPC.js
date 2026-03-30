import { ipcMain } from 'electron';
import * as GithubAPI from '../../Automation/Integrations/Github.js';
import { getFreshCreds } from '../../Automation/Integrations/GoogleWorkspace.js';
import { invalidate as invalidateSysPrompt } from '../Services/SystemPromptService.js';

export function register(connectorEngine) {

  ipcMain.handle('get-connectors', () => {
    try { return connectorEngine.getAll(); }
    catch (err) { console.error('[ConnectorIPC] get-connectors error:', err); return {}; }
  });

  ipcMain.handle('save-connector', (_e, name, credentials) => {
    try {
      const result = connectorEngine.saveConnector(name, credentials);
      invalidateSysPrompt();
      return { ok: true, ...result };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('remove-connector', (_e, name) => {
    try {
      connectorEngine.removeConnector(name);
      invalidateSysPrompt();
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('validate-connector', async (_e, name) => {
    try {
      const creds = connectorEngine.getCredentials(name);
      if (!creds) return { ok: false, error: 'No credentials stored' };

      if (name === 'google') {
        // Just verify the token is still valid with a lightweight call
        const fresh = await getFreshCreds(creds);
        const res = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${fresh.accessToken}` },
        });
        if (!res.ok) throw new Error(`Token validation failed (${res.status})`);
        const profile = await res.json();
        connectorEngine.updateCredentials('google', { email: profile.email });
        return { ok: true, email: profile.email };
      }

      if (name === 'github') {
        const user = await GithubAPI.getUser(creds);
        connectorEngine.updateCredentials('github', { username: user.login });
        return { ok: true, username: user.login, avatar: user.avatar_url };
      }

      return { ok: false, error: 'Unknown connector' };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  /* Returns non-secret fields from stored credentials — used by UI for service badge state */
  ipcMain.handle('get-connector-safe-creds', (_e, name) => {
    try {
      const safe = connectorEngine.getSafeCredentials(name);
      return safe ? { ok: true, ...safe } : { ok: false, error: 'Not connected' };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('get-free-connector-config', (_e, name) => {
    try {
      const config = connectorEngine.getFreeConnectorConfig(name);
      return config ?? { ok: false, error: 'Connector not found' };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('toggle-free-connector', (_e, name, enabled) => {
    try {
      connectorEngine.toggleFreeConnector(name, enabled);
      invalidateSysPrompt();
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('save-free-connector-key', (_e, name, apiKey) => {
    try {
      connectorEngine.saveFreeConnectorKey(name, apiKey);
      invalidateSysPrompt();
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });
}
