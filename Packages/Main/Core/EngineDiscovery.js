import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

/**
 * Scan directories for *Engine.js files and import them.
 * Each engine should export:
 *   - A class (default or named export ending in "Engine")
 *   - engineMeta.needs (optional): array of dependency keys
 *   - engineMeta.create(context): factory function that creates the engine instance
 *
 * If engineMeta.create is not provided, falls back to `new EngineClass()`.
 */
export async function discoverEngines(scanDirs) {
  const engines = [];

  for (const dir of scanDirs) {
    if (!fs.existsSync(dir)) continue;

    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isFile() || !entry.name.endsWith('Engine.js')) continue;

      const fullPath = path.join(dir, entry.name);
      try {
        const mod = await import(pathToFileURL(fullPath).href);
        const name = entry.name.replace('.js', '');

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
  }

  return engines.sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Instantiate discovered engines using a context of available dependencies.
 * Each engine must export `engineMeta.create(context)` to be auto-created.
 */
export function instantiateEngines(discovered, context) {
  const engines = {};

  for (const { name, module, meta } of discovered) {
    if (typeof meta.create === 'function') {
      engines[name] = meta.create(context);
    } else {
      console.warn(`[EngineDiscovery] "${name}" has no engineMeta.create — skipping`);
    }
  }

  return engines;
}

/**
 * Start/stop all engines that have start()/stop() methods.
 */
export function startEngines(engines) {
  for (const [name, engine] of Object.entries(engines)) {
    if (typeof engine.start === 'function') {
      engine.start();
    }
  }
}

export function stopEngines(engines) {
  for (const [name, engine] of Object.entries(engines)) {
    if (typeof engine.stop === 'function') {
      engine.stop();
    }
  }
}
