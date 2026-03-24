import { ipcMain } from 'electron';
import * as ProjectService from '../Services/ProjectService.js';

export function register() {
  ipcMain.handle('get-projects', () => {
    try {
      return ProjectService.list();
    } catch {
      return [];
    }
  });

  ipcMain.handle('get-project', (_e, projectId) => {
    try {
      return ProjectService.get(projectId);
    } catch {
      return null;
    }
  });

  ipcMain.handle('create-project', (_e, projectData) => {
    try {
      return { ok: true, project: ProjectService.create(projectData) };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('update-project', (_e, projectId, patch) => {
    try {
      return { ok: true, project: ProjectService.update(projectId, patch) };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('delete-project', (_e, projectId) => {
    try {
      ProjectService.remove(projectId);
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('validate-project', (_e, projectId) => {
    try {
      const project = ProjectService.get(projectId);
      return {
        ok: true,
        project,
        folderExists: project.folderExists,
      };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });
}
