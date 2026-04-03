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
  legacyFilePath = '',
} = {}) {
  const featureDir = path.join(paths.FEATURES_DATA_DIR, featureKey);
  const filePath = path.join(featureDir, fileName);
  const legacyPaths = [legacyFilePath].filter(Boolean);

  function fallbackValue(fallback) {
    return typeof fallback === 'function'
      ? fallback()
      : deepClone(fallback);
  }

  function resolveSourcePath() {
    if (fs.existsSync(filePath)) return filePath;
    return legacyPaths.find(candidate => fs.existsSync(candidate)) ?? null;
  }

  return {
    featureDir,
    featureKey,
    filePath,

    load(fallback = null) {
      const sourcePath = resolveSourcePath();
      const loaded = readJson(sourcePath);
      const value = loaded ?? fallbackValue(fallback);

      if (value != null && (!sourcePath || sourcePath !== filePath || loaded == null)) {
        this.save(value);
      }

      return value;
    },

    save(data) {
      ensureDir(filePath);
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
      return data;
    },

    exists() {
      return Boolean(resolveSourcePath());
    },
  };
}

export function createFeatureStorageMap(paths) {
  return Object.freeze({
    agents: createFeatureJsonStorage(paths, {
      featureKey: 'agents',
      fileName: 'Agents.json',
      legacyFilePath: paths.AGENTS_FILE,
    }),
    automation: createFeatureJsonStorage(paths, {
      featureKey: 'automation',
      fileName: 'Automations.json',
      legacyFilePath: paths.AUTOMATIONS_FILE,
    }),
    channelMessages: createFeatureJsonStorage(paths, {
      featureKey: 'channels',
      fileName: 'ChannelMessages.json',
      legacyFilePath: paths.CHANNEL_MESSAGES_FILE,
    }),
    channels: createFeatureJsonStorage(paths, {
      featureKey: 'channels',
      fileName: 'Channels.json',
      legacyFilePath: paths.CHANNELS_FILE,
    }),
    connectors: createFeatureJsonStorage(paths, {
      featureKey: 'connectors',
      fileName: 'Connectors.json',
      legacyFilePath: paths.CONNECTORS_FILE,
    }),
  });
}

export default createFeatureStorageMap;
