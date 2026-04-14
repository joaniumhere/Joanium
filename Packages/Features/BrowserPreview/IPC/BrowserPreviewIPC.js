import { ipcMain } from 'electron';
export const ipcMeta = { needs: ['browserPreviewService'] };

export function register(browserPreviewServiceModule) {
  const svc = () => browserPreviewServiceModule.getBrowserPreviewService();

  ipcMain.handle('browser-preview-get-state', () => {
    try {
      return { ok: true, state: svc().getState() };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('browser-preview-set-visible', (_event, visible) => {
    try {
      return (svc().setVisible(Boolean(visible)), { ok: true });
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('browser-preview-set-bounds', (_event, bounds) => {
    try {
      return (svc().setHostBounds(bounds ?? null), { ok: true });
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('browser-preview-hide', () => {
    try {
      return (svc().hide(), { ok: true });
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });
}
