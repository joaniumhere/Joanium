import { ipcMain } from 'electron';
import { invalidate as invalidateSysPrompt } from '../../../Main/Services/SystemPromptService.js';
import * as ContentLibraryService from '../../../Main/Services/ContentLibraryService.js';

/* ── IPC registration ── */

export const ipcMeta = { needs: [] };
export function register() {
  /* ── List all skills (with enabled state) ── */
  ipcMain.handle('get-skills', () => {
    try {
      return { ok: true, skills: ContentLibraryService.readSkills() };
    } catch (err) {
      return { ok: false, error: err.message, skills: [] };
    }
  });

  /* ── Toggle a single skill on or off ── */
  ipcMain.handle('toggle-skill', (_e, idOrFilename, enabled) => {
    try {
      if (!idOrFilename || typeof idOrFilename !== 'string') {
        return { ok: false, error: 'Invalid skill id' };
      }
      ContentLibraryService.setSkillEnabled(idOrFilename, enabled);
      invalidateSysPrompt();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  /* ── Enable all skills at once ── */
  ipcMain.handle('enable-all-skills', () => {
    try {
      ContentLibraryService.setAllSkillsEnabled(true);
      invalidateSysPrompt();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  /* ── Disable all skills at once ── */
  ipcMain.handle('disable-all-skills', () => {
    try {
      ContentLibraryService.setAllSkillsEnabled(false);
      invalidateSysPrompt();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });
}
