import { ipcMain } from 'electron';
import Paths from '../Core/Paths.js';
import { discoverPages } from '../Core/PageDiscovery.js';
import { wrapRead } from './IPCWrapper.js';

export const ipcMeta = { needs: [] };
export function register() {
  ipcMain.handle('get-pages', wrapRead(() => discoverPages(Paths.PAGES_DIR)));
}
