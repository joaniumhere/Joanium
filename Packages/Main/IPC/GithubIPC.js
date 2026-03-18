// ─────────────────────────────────────────────
//  openworld — Packages/Main/IPC/GithubIPC.js
//  Handlers for all GitHub REST API operations.
// ─────────────────────────────────────────────

import { ipcMain } from 'electron';
import * as GithubAPI from '../../Automation/Github.js';

export function register(connectorEngine) {
  function creds() { return connectorEngine.getCredentials('github'); }
  function notConnected() { return { ok: false, error: 'GitHub not connected' }; }

  ipcMain.handle('github-get-repos', async () => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      return { ok: true, repos: await GithubAPI.getRepos(c) };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-get-file', async (_e, owner, repo, filePath) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      return { ok: true, ...(await GithubAPI.getFileContent(c, owner, repo, filePath)) };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-get-tree', async (_e, owner, repo, branch) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      const tree = await GithubAPI.getRepoTree(c, owner, repo, branch);
      return { ok: true, tree: tree?.tree ?? [] };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-get-issues', async (_e, owner, repo, state = 'open') => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      return { ok: true, issues: await GithubAPI.getIssues(c, owner, repo, state) };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-get-prs', async (_e, owner, repo, state = 'open') => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      return { ok: true, prs: await GithubAPI.getPullRequests(c, owner, repo, state) };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-get-notifications', async () => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      return { ok: true, notifications: await GithubAPI.getNotifications(c) };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-get-commits', async (_e, owner, repo) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      return { ok: true, commits: await GithubAPI.getCommits(c, owner, repo) };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-create-issue', async (_e, owner, repo, title, body, labels = []) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      const issue = await GithubAPI.createIssue(c, owner, repo, title, body, labels);
      return { ok: true, issue };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-get-releases', async (_e, owner, repo) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      return { ok: true, releases: await GithubAPI.getReleases(c, owner, repo) };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('github-get-latest-release', async (_e, owner, repo) => {
    try {
      const c = creds(); if (!c?.token) return notConnected();
      return { ok: true, release: await GithubAPI.getLatestRelease(c, owner, repo) };
    } catch (err) { return { ok: false, error: err.message }; }
  });
}
