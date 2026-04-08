import { app, BrowserWindow } from 'electron';

import * as MCPIPC from '#features/MCP/IPC/MCPIPC.js';
import { boot, startEngines, stopEngines } from '#main/Boot.js';
import { ensureDir } from '#main/Core/FileSystem.js';
import Paths from '#main/Core/Paths.js';
import { create as createWindow } from '#main/Core/Window.js';
import { BUILTIN_BROWSER_USER_AGENT } from '#main/Services/BrowserPreviewService.js';
import { initializeContentLibraries } from '#main/Services/ContentLibraryService.js';
import { initializePersonalMemoryLibrary } from '#main/Services/MemoryService.js';
import { isFirstRun } from '#main/Services/UserService.js';
import { setupAutoUpdates } from '#main/Services/AutoUpdateService.js';

app.commandLine.appendSwitch('disable-http2');
app.commandLine.appendSwitch('lang', 'en-US');
app.userAgentFallback = BUILTIN_BROWSER_USER_AGENT;

let engines = null;
let enginesStopped = false;
const REQUIRED_RUNTIME_DIRS = Object.freeze([
  Paths.DATA_DIR,
  Paths.CHATS_DIR,
  Paths.PROJECTS_DIR,
  Paths.FEATURES_DATA_DIR,
  Paths.MEMORIES_DIR,
  Paths.USER_SKILLS_DIR,
  Paths.USER_PERSONAS_DIR,
]);

function ensureRuntimeDirectories() {
  for (const dir of REQUIRED_RUNTIME_DIRS) {
    ensureDir(dir);
  }
}

function resolveStartPage() {
  return isFirstRun() ? Paths.SETUP_PAGE : Paths.INDEX_PAGE;
}

function attachWindowServices(windowRef, activeEngines) {
  if (!windowRef || !activeEngines) return;

  const { featureRegistry, channelEngine, browserPreviewService, agentsEngine } = activeEngines;

  browserPreviewService.attachToWindow(windowRef);
  channelEngine.setWindow(windowRef);
  agentsEngine?.attachWindow?.(windowRef);
  featureRegistry.attachWindow(windowRef);
}

function createMainAppWindow(activeEngines, page = resolveStartPage()) {
  const windowRef = createWindow(page);
  attachWindowServices(windowRef, activeEngines);
  return windowRef;
}

function shutdownEngines() {
  if (!engines || enginesStopped) return;

  try {
    stopEngines(engines);
  } catch (error) {
    console.error('[App] Failed to stop engines cleanly:', error);
  } finally {
    engines = null;
    enginesStopped = true;
  }
}

app.whenReady().then(async () => {
  try {
    if (app.isPackaged && !process.argv.includes('--dev')) {
      setupAutoUpdates();
    }

    ensureRuntimeDirectories();
    initializeContentLibraries();
    initializePersonalMemoryLibrary();

    engines = await boot();
    enginesStopped = false;
    startEngines(engines);
    createMainAppWindow(engines);

    MCPIPC.autoConnect().catch((err) =>
      console.warn('[App] MCP auto-connect failed:', err.message),
    );

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createMainAppWindow(engines);
      }
    });
  } catch (error) {
    console.error('[App] Startup failed:', error);
    shutdownEngines();
    app.quit();
  }
});

app.on('before-quit', shutdownEngines);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    shutdownEngines();
    app.quit();
  }
});
