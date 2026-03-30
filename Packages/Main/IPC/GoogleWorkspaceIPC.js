import { ipcMain } from 'electron';
import { startOAuthFlow, detectServices, setConnectorEngine } from '../../Automation/Integrations/GoogleWorkspace.js';
import { invalidate as invalidateSysPrompt } from '../Services/SystemPromptService.js';

export function register(connectorEngine) {
  setConnectorEngine(connectorEngine);

  /* ── One OAuth to rule them all ── */
  ipcMain.handle('google-oauth-start', async (_e, clientId, clientSecret) => {
    try {
      if (!clientId?.trim() || !clientSecret?.trim())
        return { ok: false, error: 'Client ID and Client Secret are required' };

      const tokens = await startOAuthFlow(clientId.trim(), clientSecret.trim());

      // Detect which APIs the user actually enabled in their Cloud project
      const services = await detectServices(tokens).catch(() => ({}));
      tokens.services = services;

      connectorEngine.saveConnector('google', tokens);
      invalidateSysPrompt();

      return { ok: true, email: tokens.email, services };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  /* ── Re-run service detection without re-authing ── */
  ipcMain.handle('google-detect-services', async () => {
    try {
      const creds = connectorEngine.getCredentials('google');
      if (!creds?.accessToken) return { ok: false, error: 'Google Workspace not connected' };

      const services = await detectServices(creds);
      connectorEngine.updateCredentials('google', { services });
      invalidateSysPrompt();

      return { ok: true, services };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });
}
