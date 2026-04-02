import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

function scanRecursive(dir, predicate) {
  const results = [];
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...scanRecursive(fullPath, predicate));
    } else if (entry.isFile() && predicate(entry.name, fullPath)) {
      results.push(fullPath);
    }
  }
  return results;
}

/**
 * Discover and register all IPC modules found in the given directories.
 *
 * @param {string[]} dirs - Directories to scan recursively for *IPC.js files
 * @param {object} context - Pre-built dependency context (engines, services, etc.)
 * @param {object} [options]
 * @param {string[]} [options.serviceDirs] - Directories to scan for *Service.js modules
 *   that will be auto-imported and merged into the context
 * @returns {Promise<string[]>} List of registered IPC module filenames
 */
export async function discoverAndRegisterIPC(dirs, context = {}, options = {}) {
  // Auto-discover services and merge into context
  const enrichedContext = { ...context };

  for (const serviceDir of options.serviceDirs ?? []) {
    if (!fs.existsSync(serviceDir)) continue;
    const serviceFiles = fs.readdirSync(serviceDir)
      .filter(f => f.endsWith('Service.js'));

    for (const file of serviceFiles) {
      try {
        const mod = await import(pathToFileURL(path.join(serviceDir, file)).href);
        // Key is camelCase of filename without .js: UserService.js -> userService
        const key = file.replace(/\.js$/, '');
        const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
        enrichedContext[camelKey] = mod;
      } catch (err) {
        console.warn(`[DiscoverIPC] Failed to load service: ${file}`, err.message);
      }
    }
  }

  // Discover and register IPC modules
  const allFiles = [];
  for (const dir of dirs) {
    allFiles.push(...scanRecursive(dir, name => /IPC\.js$/.test(name)));
  }

  allFiles.sort((a, b) => a.localeCompare(b));

  const registered = [];
  const warnings = [];

  for (const filePath of allFiles) {
    const mod = await import(pathToFileURL(filePath).href);
    if (typeof mod.register !== 'function') continue;

    const needs = mod.ipcMeta?.needs ?? [];
    const args = needs.map(key => {
      if (!(key in enrichedContext)) {
        warnings.push(`"${path.basename(filePath)}" needs "${key}" but it's not in context`);
        return undefined;
      }
      return enrichedContext[key];
    });

    mod.register(...args);
    registered.push(path.basename(filePath));
  }

  if (warnings.length) {
    console.warn(`[DiscoverIPC] Missing dependencies:\n  ${warnings.join('\n  ')}`);
  }

  return registered;
}
