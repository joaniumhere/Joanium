import fs from 'fs';
import path from 'path';

function deepClone(value) {
  if (value == null) return value;
  return JSON.parse(JSON.stringify(value));
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJson(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) return null;
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return null;
  }
}

export function createFeatureJsonStorage(paths, {
  featureKey,
  fileName,
} = {}) {
  const featureDir = path.join(paths.FEATURES_DATA_DIR, featureKey);
  const filePath = path.join(featureDir, fileName);

  function fallbackValue(fallback) {
    return typeof fallback === 'function'
      ? fallback()
      : deepClone(fallback);
  }

  return {
    featureDir,
    featureKey,
    filePath,

    load(fallback = null) {
      return readJson(filePath) ?? fallbackValue(fallback);
    },

    save(data) {
      ensureDir(filePath);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return data;
    },

    exists() {
      return fs.existsSync(filePath);
    },
  };
}

function normalizeRawDescriptors(raw = []) {
  if (raw == null) return [];
  return Array.isArray(raw) ? raw : [raw];
}

function normalizeDescriptor(paths, descriptor = {}) {
  const key = String(descriptor.key ?? descriptor.id ?? '').trim();
  const fileName = String(descriptor.fileName ?? '').trim();
  if (!key || !fileName) return null;

  return {
    key,
    featureKey: String(descriptor.featureKey ?? key).trim() || key,
    fileName,
  };
}

function collectStorageDescriptors(paths, { featureRegistry = null, engines = [] } = {}) {
  const collected = [];

  for (const engine of engines) {
    collected.push(...normalizeRawDescriptors(engine.meta?.storage));
  }

  if (typeof featureRegistry?.getStorageDescriptors === 'function') {
    collected.push(...featureRegistry.getStorageDescriptors());
  }

  const byKey = new Map();
  for (const descriptor of collected) {
    const normalized = normalizeDescriptor(paths, descriptor);
    if (!normalized) continue;

    if (byKey.has(normalized.key)) {
      throw new Error(`[FeatureStorage] Duplicate storage key "${normalized.key}".`);
    }

    byKey.set(normalized.key, normalized);
  }

  return [...byKey.values()].sort((left, right) => left.key.localeCompare(right.key));
}

export function createFeatureStorageMap(paths, options = {}) {
  const storages = Object.create(null);

  for (const descriptor of collectStorageDescriptors(paths, options)) {
    storages[descriptor.key] = createFeatureJsonStorage(paths, descriptor);
  }

  return Object.freeze({
    ...storages,
    get(key) {
      return storages[key] ?? null;
    },
    keys() {
      return Object.keys(storages);
    },
    entries() {
      return Object.entries(storages);
    },
  });
}

export default createFeatureStorageMap;
