import fs from 'fs';
import path from 'path';

/**
 * Parse YAML-style frontmatter from markdown content.
 * Returns { meta: Record<string, string>, body: string }
 */
export function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { meta: {}, body: content };
  const meta = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx < 1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (key && val) meta[key] = val;
  }
  return { meta, body: content.slice(match[0].length).trim() };
}

/**
 * Load a JSON file, returning a fallback if missing or invalid.
 */
export function loadJson(filePath, fallback = null) {
  try {
    if (fs.existsSync(filePath)) {
      return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
  } catch { /* fall through */ }
  return typeof fallback === 'function' ? fallback() : structuredClone(fallback);
}

/**
 * Persist data as JSON to disk. Creates parent directories as needed.
 */
export function persistJson(filePath, data) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Scan a directory for files matching a filter.
 * Returns full file paths sorted alphabetically.
 */
export function scanFiles(dirPath, filter = () => true) {
  if (!fs.existsSync(dirPath)) return [];
  return fs.readdirSync(dirPath)
    .filter(filter)
    .sort()
    .map(filename => path.join(dirPath, filename));
}
