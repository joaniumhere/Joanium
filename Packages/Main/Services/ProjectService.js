import fs from 'fs';
import path from 'path';
import Paths from '../Paths.js';

const META_FILENAME = 'Project.json';
const CHATS_DIRNAME = 'Chats';

function ensureProjectsDir() {
  if (!fs.existsSync(Paths.PROJECTS_DIR)) {
    fs.mkdirSync(Paths.PROJECTS_DIR, { recursive: true });
  }
}

function projectDir(projectId) {
  return path.join(Paths.PROJECTS_DIR, String(projectId ?? '').trim());
}

function metaPath(projectId) {
  return path.join(projectDir(projectId), META_FILENAME);
}

export function getProjectChatsDir(projectId) {
  return path.join(projectDir(projectId), CHATS_DIRNAME);
}

function ensureProjectStorage(projectId) {
  const dir = projectDir(projectId);
  const chatsDir = getProjectChatsDir(projectId);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(chatsDir)) fs.mkdirSync(chatsDir, { recursive: true });
}

function projectFolderExists(rootPath) {
  if (!rootPath) return false;
  try {
    return fs.existsSync(rootPath) && fs.statSync(rootPath).isDirectory();
  } catch {
    return false;
  }
}

function slugifyProjectName(name) {
  const slug = String(name ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);

  return slug || 'project';
}

function uniqueProjectId(name) {
  ensureProjectsDir();
  const base = slugifyProjectName(name);
  let candidate = base;
  let suffix = 2;

  while (fs.existsSync(projectDir(candidate))) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }

  return candidate;
}

function normalizeProject(project, projectId = project?.id) {
  const id = String(projectId ?? '').trim();
  const createdAt = String(project?.createdAt ?? new Date().toISOString());

  return {
    id,
    name: String(project?.name ?? '').trim() || id,
    rootPath: project?.rootPath ? path.resolve(String(project.rootPath)) : '',
    context: String(project?.context ?? '').trim(),
    createdAt,
    updatedAt: String(project?.updatedAt ?? createdAt),
    lastOpenedAt: project?.lastOpenedAt ? String(project.lastOpenedAt) : null,
  };
}

function withStatus(project) {
  return {
    ...project,
    folderExists: projectFolderExists(project.rootPath),
  };
}

function writeProject(project) {
  ensureProjectStorage(project.id);
  fs.writeFileSync(metaPath(project.id), JSON.stringify(project, null, 2), 'utf-8');
}

function readProject(projectId) {
  const filePath = metaPath(projectId);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Project "${projectId}" does not exist.`);
  }

  return normalizeProject(JSON.parse(fs.readFileSync(filePath, 'utf-8')), projectId);
}

function assertValidProjectInput({ name, rootPath }) {
  if (!String(name ?? '').trim()) {
    throw new Error('Project name is required.');
  }
  if (!String(rootPath ?? '').trim()) {
    throw new Error('Project folder is required.');
  }
}

export function list() {
  ensureProjectsDir();

  return fs.readdirSync(Paths.PROJECTS_DIR, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => {
      try {
        return withStatus(readProject(entry.name));
      } catch {
        return null;
      }
    })
    .filter(Boolean)
    .sort((a, b) => {
      const left = new Date(a.lastOpenedAt ?? a.updatedAt).getTime();
      const right = new Date(b.lastOpenedAt ?? b.updatedAt).getTime();
      return right - left;
    });
}

export function get(projectId) {
  return withStatus(readProject(projectId));
}

export function create({ name, rootPath, context = '' } = {}) {
  assertValidProjectInput({ name, rootPath });

  const now = new Date().toISOString();
  const project = normalizeProject({
    id: uniqueProjectId(name),
    name,
    rootPath,
    context,
    createdAt: now,
    updatedAt: now,
    lastOpenedAt: now,
  });

  writeProject(project);
  return withStatus(project);
}

export function update(projectId, patch = {}) {
  const current = readProject(projectId);
  const next = normalizeProject({
    ...current,
    ...patch,
    id: current.id,
    updatedAt: new Date().toISOString(),
  }, current.id);

  assertValidProjectInput(next);
  writeProject(next);
  return withStatus(next);
}

export function remove(projectId) {
  ensureProjectsDir();

  const target = path.resolve(projectDir(projectId));
  const root = path.resolve(Paths.PROJECTS_DIR);
  if (!target.startsWith(`${root}${path.sep}`)) {
    throw new Error('Refusing to delete a path outside the projects directory.');
  }

  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
  }
}
