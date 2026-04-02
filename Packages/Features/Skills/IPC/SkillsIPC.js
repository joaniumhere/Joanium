import { ipcMain } from 'electron';
import fs from 'fs';
import path from 'path';
import Paths from '../../../Main/Core/Paths.js';
import { invalidate as invalidateSysPrompt } from '../../../Main/Services/SystemPromptService.js';
import { parseFrontmatter, loadJson, persistJson } from '../../../Main/Services/FileService.js';

/* ── Files to skip — internal/empty stubs ── */
const SKIP_FILES = new Set(['Debug.md']);

/* ── Skills.json helpers ── */

function loadEnabledMap() {
  return loadJson(Paths.SKILLS_FILE, { skills: {} }).skills ?? {};
}

function saveEnabledMap(map) {
  persistJson(Paths.SKILLS_FILE, { skills: map });
}

/* ── IPC registration ── */

export const ipcMeta = { needs: [] };
export function register() {

  /* ── List all skills (with enabled state) ── */
  ipcMain.handle('get-skills', () => {
    try {
      if (!fs.existsSync(Paths.SKILLS_DIR)) return { ok: true, skills: [] };

      const enabledMap = loadEnabledMap();

      const files = fs.readdirSync(Paths.SKILLS_DIR)
        .filter(f => f.endsWith('.md') && !SKIP_FILES.has(f));

      const skills = files.map(filename => {
        try {
          const raw = fs.readFileSync(path.join(Paths.SKILLS_DIR, filename), 'utf-8');
          const { meta, body } = parseFrontmatter(raw);

          if (!meta.name && !body.trim()) return null;

          return {
            filename,
            name: meta.name || filename.replace('.md', ''),
            trigger: meta.trigger || '',
            description: meta.description || '',
            body,
            raw,
            enabled: enabledMap[filename] === true,
          };
        } catch { return null; }
      }).filter(Boolean);

      return { ok: true, skills };
    } catch (err) {
      return { ok: false, error: err.message, skills: [] };
    }
  });

  /* ── Toggle a single skill on or off ── */
  ipcMain.handle('toggle-skill', (_e, filename, enabled) => {
    try {
      if (!filename || typeof filename !== 'string') {
        return { ok: false, error: 'Invalid filename' };
      }
      const map = loadEnabledMap();
      map[filename] = Boolean(enabled);
      saveEnabledMap(map);
      invalidateSysPrompt();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  /* ── Enable all skills at once ── */
  ipcMain.handle('enable-all-skills', () => {
    try {
      if (!fs.existsSync(Paths.SKILLS_DIR)) return { ok: true };

      const files = fs.readdirSync(Paths.SKILLS_DIR)
        .filter(f => f.endsWith('.md') && !SKIP_FILES.has(f));

      const map = loadEnabledMap();
      for (const f of files) map[f] = true;
      saveEnabledMap(map);
      invalidateSysPrompt();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  /* ── Disable all skills at once ── */
  ipcMain.handle('disable-all-skills', () => {
    try {
      if (!fs.existsSync(Paths.SKILLS_DIR)) return { ok: true };

      const files = fs.readdirSync(Paths.SKILLS_DIR)
        .filter(f => f.endsWith('.md') && !SKIP_FILES.has(f));

      const map = loadEnabledMap();
      for (const f of files) map[f] = false;
      saveEnabledMap(map);
      invalidateSysPrompt();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

}
