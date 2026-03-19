// ─────────────────────────────────────────────
//  openworld — Packages/Main/IPC/AgentsIPC.js
//  Handlers for agent CRUD + page navigation + manual run.
// ─────────────────────────────────────────────

import { ipcMain } from 'electron';
import { loadPage } from '../Window.js';
import Paths        from '../Paths.js';

/**
 * @param {AgentsEngine} agentsEngine
 */
export function register(agentsEngine) {
  ipcMain.handle('launch-agents', () => {
    loadPage(Paths.AGENTS_PAGE);
    return { ok: true };
  });

  ipcMain.handle('get-agents', () => {
    try   { return { ok: true, agents: agentsEngine.getAll() }; }
    catch (err) { return { ok: false, error: err.message, agents: [] }; }
  });

  ipcMain.handle('save-agent', (_e, agent) => {
    try {
      const saved = agentsEngine.saveAgent(agent);
      agentsEngine.reload();
      return { ok: true, agent: saved };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('delete-agent', (_e, id) => {
    try {
      agentsEngine.deleteAgent(id);
      agentsEngine.reload();
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('toggle-agent', (_e, id, enabled) => {
    try {
      agentsEngine.toggleAgent(id, enabled);
      agentsEngine.reload();
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('run-agent-now', async (_e, agentId) => {
    try {
      await agentsEngine.runNow(agentId);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });
}
