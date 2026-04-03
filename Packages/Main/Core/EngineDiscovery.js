import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

function scanRecursive(dir, predicate, results = []) {
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanRecursive(fullPath, predicate, results);
      continue;
    }

    if (entry.isFile() && predicate(entry.name, fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

/**
 * Discover engine modules under one or more roots.
 * Each engine should export:
 *   - engineMeta.needs (optional): array of dependency keys
 *   - engineMeta.create(context): factory function that creates the engine instance
 */
export async function discoverEngines(scanRoots = []) {
  const engineFiles = [];
  for (const root of scanRoots) {
    scanRecursive(root, name => name.endsWith('Engine.js'), engineFiles);
  }

  const engines = [];
  for (const fullPath of engineFiles.sort((a, b) => a.localeCompare(b))) {
    try {
      const mod = await import(pathToFileURL(fullPath).href);
      const name = path.basename(fullPath, '.js');

      engines.push({
        name,
        module: mod,
        meta: mod.engineMeta ?? {},
        filePath: fullPath,
      });
    } catch (err) {
      console.warn(`[EngineDiscovery] Failed to load: ${fullPath}`, err.message);
    }
  }

  return engines.sort((a, b) => a.name.localeCompare(b.name));
}

export function instantiateEngines(discovered, context) {
  const engines = {};

  for (const { name, meta } of discovered) {
    if (typeof meta.create === 'function') {
      engines[name] = meta.create(context);
    } else {
      console.warn(`[EngineDiscovery] "${name}" has no engineMeta.create — skipping`);
    }
  }

  return engines;
}

export function startEngines(engines) {
  for (const engine of Object.values(engines)) {
    if (typeof engine?.start === 'function') {
      engine.start();
    }
  }
}

export function stopEngines(engines) {
  for (const engine of Object.values(engines)) {
    if (typeof engine?.stop === 'function') {
      engine.stop();
    }
  }
}
