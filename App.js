// ─────────────────────────────────────────────
//  openworld — App.js
//  Electron main process · root entry point
// ─────────────────────────────────────────────

import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ── Paths ── */
const DATA_DIR = path.join(__dirname, 'Data');
const USER_FILE = path.join(DATA_DIR, 'User.json');
const MODELS_FILE = path.join(DATA_DIR, 'Models.json');
const CHATS_DIR = path.join(DATA_DIR, 'Chats');
const PRELOAD = path.join(__dirname, 'Packages', 'Electron', 'Preload.js');
const SETUP_PAGE = path.join(__dirname, 'Public', 'Setup.html');
const MAIN_PAGE = path.join(__dirname, 'Public', 'index.html');

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
const readJSON = (f) => JSON.parse(fs.readFileSync(f, 'utf-8'));
const writeJSON = (f, d) => fs.writeFileSync(f, JSON.stringify(d, null, 2), 'utf-8');

const isFirstRun = () => {
  try { return readJSON(USER_FILE).setup_complete !== true; }
  catch { return true; }
};

/* ══════════════════════════════════════════
   WINDOW
══════════════════════════════════════════ */
let win = null;

function createWindow(page) {
  win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 720,
    minHeight: 500,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#1a1a1a',
    show: false,
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.loadFile(page);
  win.once('ready-to-show', () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

/* ══════════════════════════════════════════
   LIFECYCLE
══════════════════════════════════════════ */
app.whenReady().then(() => {
  // Ensure Chats directory exists
  if (!fs.existsSync(CHATS_DIR)) fs.mkdirSync(CHATS_DIR, { recursive: true });

  createWindow(isFirstRun() ? SETUP_PAGE : MAIN_PAGE);
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0)
      createWindow(isFirstRun() ? SETUP_PAGE : MAIN_PAGE);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/* ══════════════════════════════════════════
   IPC — SETUP
══════════════════════════════════════════ */
ipcMain.handle('save-user', (_e, userData) => {
  try {
    writeJSON(USER_FILE, userData);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('save-api-keys', (_e, keysMap) => {
  try {
    const user = readJSON(USER_FILE);
    user.api_keys = { ...(user.api_keys ?? {}), ...keysMap };
    writeJSON(USER_FILE, user);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('launch-main', () => {
  win?.loadFile(MAIN_PAGE);
  return { ok: true };
});

/* ══════════════════════════════════════════
   IPC — RUNTIME READS
══════════════════════════════════════════ */
ipcMain.handle('get-user', () => readJSON(USER_FILE));

ipcMain.handle('get-models', () => {
  const models = readJSON(MODELS_FILE);
  const apiKeys = readJSON(USER_FILE)?.api_keys ?? {};
  return models.map(provider => ({
    ...provider,
    api: apiKeys[provider.provider] ?? null,
  }));
});

ipcMain.handle('get-api-key', (_e, providerId) => {
  return readJSON(USER_FILE)?.api_keys?.[providerId] ?? null;
});

/* ══════════════════════════════════════════
   IPC — CHAT STORAGE
══════════════════════════════════════════ */
ipcMain.handle('save-chat', (_e, chatData) => {
  try {
    if (!fs.existsSync(CHATS_DIR)) fs.mkdirSync(CHATS_DIR, { recursive: true });
    const filename = chatData.id + '.json';
    writeJSON(path.join(CHATS_DIR, filename), chatData);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('get-chats', () => {
  try {
    if (!fs.existsSync(CHATS_DIR)) return [];
    return fs.readdirSync(CHATS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try { return readJSON(path.join(CHATS_DIR, f)); }
        catch { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } catch (err) {
    return [];
  }
});

ipcMain.handle('load-chat', (_e, chatId) => {
  return readJSON(path.join(CHATS_DIR, chatId + '.json'));
});

ipcMain.handle('delete-chat', (_e, chatId) => {
  try {
    fs.unlinkSync(path.join(CHATS_DIR, chatId + '.json'));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

/* ══════════════════════════════════════════
   IPC — FRAMELESS WINDOW CONTROLS
══════════════════════════════════════════ */
ipcMain.on('window-minimize', () => win?.minimize());
ipcMain.on('window-maximize', () => win?.isMaximized() ? win.unmaximize() : win.maximize());
ipcMain.on('window-close', () => win?.close());