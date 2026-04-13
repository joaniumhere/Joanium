import fs from 'fs';
import path from 'path';
import { cloneValue } from '../../System/Utils/CloneValue.js';
const textFileCache = new Map(),
  jsonFileCache = new Map();
export function resolveFallback(fallback) {
  return 'function' == typeof fallback ? fallback() : cloneValue(fallback);
}
function normalizeCachePath(targetPath) {
  return targetPath ? path.resolve(targetPath) : '';
}
function getFileSignature(filePath) {
  if (!filePath) return null;
  try {
    const stat = fs.statSync(filePath);
    return stat.isFile() ? `${stat.size}:${stat.mtimeMs}` : null;
  } catch {
    return null;
  }
}
function clearCachedFile(filePath) {
  const normalizedPath = normalizeCachePath(filePath);
  normalizedPath && (textFileCache.delete(normalizedPath), jsonFileCache.delete(normalizedPath));
}
function readCachedTextFile(filePath) {
  const normalizedPath = normalizeCachePath(filePath),
    signature = getFileSignature(normalizedPath);
  if (!normalizedPath || !signature) return void clearCachedFile(normalizedPath);
  const cached = textFileCache.get(normalizedPath);
  if (cached?.signature === signature) return cached.text;
  const text = fs.readFileSync(normalizedPath, 'utf-8');
  return (textFileCache.set(normalizedPath, { signature: signature, text: text }), text);
}
function setCachedTextFile(filePath, text) {
  const normalizedPath = normalizeCachePath(filePath),
    signature = getFileSignature(normalizedPath);
  normalizedPath &&
    signature &&
    textFileCache.set(normalizedPath, { signature: signature, text: text });
}
function setCachedJsonFile(filePath, value) {
  const normalizedPath = normalizeCachePath(filePath),
    signature = getFileSignature(normalizedPath);
  normalizedPath &&
    signature &&
    jsonFileCache.set(normalizedPath, { signature: signature, value: cloneValue(value) });
}
export function pathExists(targetPath) {
  return Boolean(targetPath) && fs.existsSync(targetPath);
}
export function directoryExists(dirPath) {
  if (!pathExists(dirPath)) return !1;
  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return !1;
  }
}
export function fileExists(filePath) {
  if (!pathExists(filePath)) return !1;
  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return !1;
  }
}
export function ensureDir(dirPath) {
  return dirPath
    ? (directoryExists(dirPath) || fs.mkdirSync(dirPath, { recursive: !0 }), dirPath)
    : dirPath;
}
export function ensureParentDir(filePath) {
  return filePath ? ensureDir(path.dirname(filePath)) : '';
}
export function loadText(filePath, fallback = '', options = {}) {
  const { stripBom: stripBom = !0 } = options;
  try {
    const raw = readCachedTextFile(filePath);
    if (null == raw) return resolveFallback(fallback);
    return stripBom ? raw.replace(/^\uFEFF/, '') : raw;
  } catch {
    return resolveFallback(fallback);
  }
}
export function loadJson(filePath, fallback = null) {
  try {
    const normalizedPath = normalizeCachePath(filePath),
      signature = getFileSignature(normalizedPath);
    if (!normalizedPath || !signature) return resolveFallback(fallback);
    const cached = jsonFileCache.get(normalizedPath);
    if (cached?.signature === signature) return cloneValue(cached.value);
    const value = JSON.parse(loadText(normalizedPath, '', { stripBom: !0 }));
    return (
      jsonFileCache.set(normalizedPath, { signature: signature, value: cloneValue(value) }),
      cloneValue(value)
    );
  } catch {
    return (clearCachedFile(filePath), resolveFallback(fallback));
  }
}
export function persistText(filePath, content, options = {}) {
  const { normalizeLineEndings: normalizeLineEndings = !1, finalNewline: finalNewline = !1 } =
    options;
  ensureParentDir(filePath);
  let next = String(content ?? '');
  return (
    normalizeLineEndings && (next = next.replace(/\r\n/g, '\n')),
    finalNewline && !next.endsWith('\n') && (next += '\n'),
    readCachedTextFile(filePath) !== next && fs.writeFileSync(filePath, next, 'utf-8'),
    setCachedTextFile(filePath, next),
    jsonFileCache.delete(normalizeCachePath(filePath)),
    next
  );
}
export function persistJson(filePath, data, options = {}) {
  const { space: space = 2 } = options;
  const serialized = JSON.stringify(data, null, space);
  return (
    ensureParentDir(filePath),
    readCachedTextFile(filePath) !== serialized && fs.writeFileSync(filePath, serialized, 'utf-8'),
    setCachedTextFile(filePath, serialized),
    setCachedJsonFile(filePath, data),
    data
  );
}
function readSortedEntries(dirPath) {
  return (function (entries = []) {
    return [...entries].sort((left, right) => left.name.localeCompare(right.name));
  })(fs.readdirSync(dirPath, { withFileTypes: !0 }));
}
export function scanFiles(dirPath, predicate = () => !0) {
  return directoryExists(dirPath)
    ? readSortedEntries(dirPath).flatMap((entry) => {
        if (!entry.isFile()) return [];
        const fullPath = path.join(dirPath, entry.name);
        return predicate(entry, fullPath) ? [fullPath] : [];
      })
    : [];
}
export function scanFilesRecursive(rootDir, predicate = () => !0) {
  const results = [];
  return directoryExists(rootDir)
    ? ((function visit(currentDir) {
        for (const entry of readSortedEntries(currentDir)) {
          const fullPath = path.join(currentDir, entry.name);
          entry.isDirectory()
            ? visit(fullPath)
            : entry.isFile() && predicate(entry, fullPath) && results.push(fullPath);
        }
      })(rootDir),
      results)
    : results;
}
