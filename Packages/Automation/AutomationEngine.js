// ─────────────────────────────────────────────
//  openworld — Packages/Automation/AutomationEngine.js
//  Runs in the Electron main process.
//  Loads automations from Data/Automations.json,
//  schedules them, and executes actions.
// ─────────────────────────────────────────────

import { shell, clipboard, Notification } from 'electron';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

/* ══════════════════════════════════════════
   ACTION IMPLEMENTATIONS
   Each returns a Promise (or is async).
══════════════════════════════════════════ */

/**
 * Shell-safe single-quote a string (POSIX).
 * @param {string} str
 * @returns {string}
 */
function sq(str) {
  return `'${String(str ?? '').replace(/'/g, "'\\''")}'`;
}

/**
 * Open a URL in the OS default browser.
 * @param {string} url
 */
export async function openSite(url) {
  if (!url) throw new Error('openSite: no URL provided');

  let target = url.trim();

  // Fix malformed schemes like "https:example.com"
  if (/^https?:[^/]/i.test(target)) {
    target = target.replace(/^https?:/i, 'https://');
  }

  // Add protocol if missing
  if (!/^https?:\/\//i.test(target)) {
    target = `https://${target}`;
  }

  await shell.openExternal(target);
  console.log(`[AutomationEngine] openSite → ${target}`);
}

/**
 * Open a folder in the OS file explorer (Finder / Explorer / Nautilus).
 * Uses shell.openPath which opens the folder itself, not its parent.
 * @param {string} folderPath
 */
export function openFolder(folderPath) {
  if (!folderPath) throw new Error('openFolder: no path provided');

  return new Promise((resolve, reject) => {
    if (process.platform === 'win32') {
      const cmd = `start "" "${folderPath}"`;

      exec(cmd, { shell: 'cmd.exe' }, (err) => {
        if (err) {
          console.error('[AutomationEngine] openFolder error:', err);
          return reject(err);
        }
        console.log(`[AutomationEngine] openFolder → ${folderPath}`);
        resolve();
      });
    } else {
      shell.openPath(folderPath).then((result) => {
        if (result) reject(new Error(result));
        else resolve();
      });
    }
  });
}

/**
 * Open a terminal window with its working directory set to folderPath,
 * then optionally run a command inside it.
 * @param {string} folderPath
 * @param {string} [command]
 */
export function openTerminalAtPath(folderPath, command = '') {
  if (!folderPath) throw new Error('openTerminalAtPath: no path provided');

  return new Promise((resolve, reject) => {
    let launcher;
    const cdAndRun = command
      ? `cd ${sq(folderPath)} && ${command}`
      : `cd ${sq(folderPath)}`;

    if (process.platform === 'darwin') {
      // Escape for AppleScript double-quoted string
      const escaped = cdAndRun.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      launcher = `osascript -e 'tell application "Terminal" to do script "${escaped}"'`;
    } else if (process.platform === 'win32') {
      // Windows: strip surrounding quotes from path, rebuild with /d flag
      const winPath = folderPath.replace(/"/g, '');
      const winCmd = command
        ? `start cmd.exe /k "cd /d "${winPath}" && ${command}"`
        : `start cmd.exe /k "cd /d "${winPath}""`;
      launcher = winCmd;
    } else {
      // Linux — try common emulators
      launcher = `x-terminal-emulator -e bash -c "${cdAndRun}; exec bash" || gnome-terminal -- bash -c "${cdAndRun}; exec bash"`;
    }

    exec(launcher, (err) => {
      if (err) {
        console.error('[AutomationEngine] openTerminalAtPath error:', err);
        reject(err);
      } else {
        console.log(`[AutomationEngine] openTerminalAtPath → ${folderPath}${command ? ` (cmd: ${command})` : ''}`);
        resolve();
      }
    });
  });
}

/**
 * Spawn a shell command in a new terminal window.
 * @param {string} command
 */
export function openTerminalAndRun(command) {
  if (!command) throw new Error('openTerminalAndRun: no command provided');

  return new Promise((resolve, reject) => {
    let launcher;

    if (process.platform === 'darwin') {
      const escaped = command.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
      launcher = `osascript -e 'tell application "Terminal" to do script "${escaped}"'`;
    } else if (process.platform === 'win32') {
      launcher = `start cmd.exe /k "${command}"`;
    } else {
      launcher = `x-terminal-emulator -e bash -c "${command}; read" || gnome-terminal -- bash -c "${command}; read"`;
    }

    exec(launcher, (err) => {
      if (err) {
        console.error('[AutomationEngine] openTerminalAndRun error:', err);
        reject(err);
      } else {
        console.log(`[AutomationEngine] openTerminalAndRun → ${command}`);
        resolve();
      }
    });
  });
}

/**
 * Open an application by path or bundle name.
 * On macOS: `open -a "AppName"` or `open "/path/to/App.app"`
 * On Windows / Linux: shell.openPath works for executables.
 * @param {string} appPath
 */
export async function openApp(appPath) {
  if (!appPath) throw new Error('openApp: no app path provided');

  if (process.platform === 'darwin') {
    // shell.openPath handles .app bundles natively on macOS
    const result = await shell.openPath(appPath);
    if (result) throw new Error(`openApp (mac): ${result}`);
  } else {
    const result = await shell.openPath(appPath);
    if (result) throw new Error(`openApp: ${result}`);
  }

  console.log(`[AutomationEngine] openApp → ${appPath}`);
}

/**
 * Send a desktop notification via Electron's Notification API.
 * @param {string} title
 * @param {string} [body]
 */
export function sendNotification(title, body = '') {
  if (!Notification.isSupported()) {
    console.warn('[AutomationEngine] Notifications not supported on this platform');
    return;
  }
  if (!title) throw new Error('sendNotification: no title provided');

  const n = new Notification({ title, body });
  n.show();
  console.log(`[AutomationEngine] sendNotification → "${title}"`);
}

/**
 * Write text to the system clipboard.
 * @param {string} text
 */
export function copyToClipboard(text) {
  if (text === undefined || text === null) throw new Error('copyToClipboard: no text provided');
  clipboard.writeText(String(text));
  console.log(`[AutomationEngine] copyToClipboard → ${String(text).slice(0, 40)}…`);
}

/**
 * Write (or overwrite) a file at the given path.
 * Parent directories are created automatically.
 * @param {string} filePath
 * @param {string} [content]
 */
export function writeFile(filePath, content = '') {
  if (!filePath) throw new Error('writeFile: no file path provided');
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, String(content), 'utf-8');
  console.log(`[AutomationEngine] writeFile → ${filePath}`);
}

/**
 * Dispatch a single action object.
 * @param {object} action
 */
export async function runAction(action) {
  if (!action?.type) return;

  switch (action.type) {

    case 'open_site':
      return openSite(action.url);

    case 'open_folder':
      // 1. Open in file explorer
      await openFolder(action.path);
      // 2. Optional sub-event: open a terminal at that folder
      if (action.openTerminal) {
        await openTerminalAtPath(action.path, action.terminalCommand || '');
      }
      return;

    case 'run_command':
      return openTerminalAndRun(action.command);

    case 'open_app':
      return openApp(action.appPath);

    case 'send_notification':
      return sendNotification(action.title, action.body);

    case 'copy_to_clipboard':
      return copyToClipboard(action.text);

    case 'write_file':
      return writeFile(action.filePath, action.content);

    default:
      console.warn(`[AutomationEngine] Unknown action type: "${action.type}"`);
  }
}

/* ══════════════════════════════════════════
   SCHEDULING HELPERS
══════════════════════════════════════════ */

/**
 * Returns true when an automation's trigger fires for the given Date.
 * @param {{ trigger: object, lastRun: string|null }} automation
 * @param {Date} now
 */
export function shouldRunNow(automation, now = new Date()) {
  const { trigger, lastRun } = automation;
  if (!trigger) return false;

  const last = lastRun ? new Date(lastRun) : null;

  /* ── on_startup ──────────────────────── */
  if (trigger.type === 'on_startup') return false;

  /* ── hourly ──────────────────────────── */
  if (trigger.type === 'hourly') {
    if (now.getMinutes() !== 0) return false;
    if (last &&
      last.getFullYear() === now.getFullYear() &&
      last.getMonth() === now.getMonth() &&
      last.getDate() === now.getDate() &&
      last.getHours() === now.getHours()) return false;
    return true;
  }

  /* ── daily ───────────────────────────── */
  if (trigger.type === 'daily') {
    if (!trigger.time) return false;
    const [h, m] = trigger.time.split(':').map(Number);
    if (now.getHours() !== h || now.getMinutes() !== m) return false;
    if (last && last.toDateString() === now.toDateString()) return false;
    return true;
  }

  /* ── weekly ──────────────────────────── */
  if (trigger.type === 'weekly') {
    const DAY_MAP = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    if (!trigger.day || DAY_MAP.indexOf(trigger.day) !== now.getDay()) return false;
    if (!trigger.time) return false;
    const [h, m] = trigger.time.split(':').map(Number);
    if (now.getHours() !== h || now.getMinutes() !== m) return false;
    if (last) {
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);
      if (last >= weekStart) return false;
    }
    return true;
  }

  return false;
}

/* ══════════════════════════════════════════
   AUTOMATION ENGINE CLASS
══════════════════════════════════════════ */

export class AutomationEngine {
  /**
   * @param {string} automationsFilePath  Absolute path to Data/Automations.json
   */
  constructor(automationsFilePath) {
    this.filePath = automationsFilePath;
    this.automations = [];
    this._ticker = null;
  }

  /* ── Lifecycle ─────────────────────── */

  start() {
    this._load();
    this._runStartupAutomations();
    this._ticker = setInterval(() => this._checkScheduled(), 60_000);
    console.log('[AutomationEngine] Started — monitoring', this.automations.length, 'automation(s)');
  }

  stop() {
    if (this._ticker) {
      clearInterval(this._ticker);
      this._ticker = null;
    }
    console.log('[AutomationEngine] Stopped');
  }

  reload() {
    this._load();
    console.log('[AutomationEngine] Reloaded —', this.automations.length, 'automation(s)');
  }

  /* ── CRUD ── */

  getAll() {
    this._load();
    return this.automations;
  }

  saveAutomation(automation) {
    this._load();
    const idx = this.automations.findIndex(a => a.id === automation.id);
    if (idx >= 0) {
      this.automations[idx] = { ...this.automations[idx], ...automation };
    } else {
      this.automations.push(automation);
    }
    this._persist();
    return automation;
  }

  deleteAutomation(id) {
    this._load();
    this.automations = this.automations.filter(a => a.id !== id);
    this._persist();
  }

  toggleAutomation(id, enabled) {
    this._load();
    const a = this.automations.find(a => a.id === id);
    if (a) {
      a.enabled = Boolean(enabled);
      this._persist();
    }
  }

  /* ── Private helpers ─────────────────── */

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const data = JSON.parse(raw);
        this.automations = Array.isArray(data.automations) ? data.automations : [];
      } else {
        this.automations = [];
      }
    } catch (err) {
      console.error('[AutomationEngine] _load error:', err);
      this.automations = [];
    }
  }

  _persist() {
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        this.filePath,
        JSON.stringify({ automations: this.automations }, null, 2),
        'utf-8'
      );
    } catch (err) {
      console.error('[AutomationEngine] _persist error:', err);
    }
  }

  _runStartupAutomations() {
    const targets = this.automations.filter(
      a => a.enabled && a.trigger?.type === 'on_startup'
    );
    for (const a of targets) this._execute(a);
  }

  _checkScheduled() {
    const now = new Date();
    for (const a of this.automations) {
      if (a.enabled && shouldRunNow(a, now)) {
        this._execute(a);
      }
    }
  }

  async _execute(automation) {
    console.log(`[AutomationEngine] Executing: "${automation.name}"`);
    try {
      for (const action of (automation.actions ?? [])) {
        await runAction(action);
      }
      automation.lastRun = new Date().toISOString();
      this._persist();
    } catch (err) {
      console.error(`[AutomationEngine] Error in "${automation.name}":`, err);
    }
  }
}
