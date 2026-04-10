import { ipcMain } from 'electron';
import {
  invalidate as invalidateSysPrompt,
  getDefaultPersona,
} from '../Services/SystemPromptService.js';
import * as ContentLibraryService from '../Services/ContentLibraryService.js';

export const ipcMeta = { needs: [] };
export function register() {
  /* ── List all personas ── */
  ipcMain.handle('get-personas', () => {
    try {
      return { ok: true, personas: ContentLibraryService.readPersonas() };
    } catch (err) {
      return { ok: false, error: err.message, personas: [] };
    }
  });

  /* ── Get active persona ── */
  ipcMain.handle('get-active-persona', () => {
    try {
      return {
        ok: true,
        persona: ContentLibraryService.readActivePersona() ?? getDefaultPersona(),
      };
    } catch {
      return { ok: true, persona: getDefaultPersona() };
    }
  });

  /* ── Set active persona ── */
  ipcMain.handle('set-active-persona', (_e, personaData) => {
    try {
      ContentLibraryService.setActivePersona(personaData);
      invalidateSysPrompt();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  /* ── Reset to default assistant ── */
  ipcMain.handle('reset-active-persona', () => {
    try {
      ContentLibraryService.resetActivePersona();
      invalidateSysPrompt();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });
}
