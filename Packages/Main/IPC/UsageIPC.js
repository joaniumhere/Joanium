import { ipcMain } from 'electron';
import { loadPage } from '../Core/Window.js';
import Paths from '../Core/Paths.js';
import { wrapHandler } from './IPCWrapper.js';
import { loadJson, persistJson } from '../Services/FileService.js';

function load() {
  return loadJson(Paths.USAGE_FILE, { records: [] });
}

function persist(data) {
  persistJson(Paths.USAGE_FILE, data);
}

export const ipcMeta = { needs: [] };
export function register() {
  ipcMain.handle('launch-usage', () => {
    loadPage(Paths.USAGE_PAGE);
    return { ok: true };
  });

  ipcMain.handle('track-usage', wrapHandler((record) => {
    const data = load();
    data.records.push({
      timestamp: new Date().toISOString(),
      provider: record.provider ?? 'unknown',
      model: record.model ?? 'unknown',
      modelName: record.modelName ?? record.model ?? 'unknown',
      inputTokens: record.inputTokens ?? 0,
      outputTokens: record.outputTokens ?? 0,
      chatId: record.chatId ?? null,
    });
    if (data.records.length > 20_000)
      data.records = data.records.slice(-20_000);
    persist(data);
  }));

  ipcMain.handle('get-usage', () => {
    try {
      const { records } = load();
      return { ok: true, records };
    } catch (err) {
      return { ok: false, records: [], error: err.message };
    }
  });

  ipcMain.handle('clear-usage', wrapHandler(() => {
    persist({ records: [] });
  }));
}
