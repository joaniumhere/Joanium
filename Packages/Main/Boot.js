import FeatureRegistry from '../Capabilities/Core/FeatureRegistry.js';
import { setConnectorEngine as setGoogleConnectorEngine } from '../Capabilities/Google/GoogleWorkspace.js';

import { getBrowserPreviewService } from './Services/BrowserPreviewService.js';
import { invalidate as invalidateSystemPrompt } from './Services/SystemPromptService.js';

import Paths from './Core/Paths.js';
import { discoverAndRegisterIPC } from './Core/DiscoverIPC.js';
import { discoverEngines } from './Core/EngineDiscovery.js';

import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGES_DIR = path.resolve(__dirname, '..');

const IPC_SCAN_DIRS = [
  path.join(PACKAGES_DIR, 'Main', 'IPC'),
  path.join(PACKAGES_DIR, 'Features'),
];

const SERVICE_SCAN_DIRS = [
  path.join(PACKAGES_DIR, 'Main', 'Services'),
];

const ENGINE_SCAN_DIRS = [
  path.join(PACKAGES_DIR, 'Features', 'Connectors', 'Core'),
  path.join(PACKAGES_DIR, 'Features', 'Automation', 'Core'),
  path.join(PACKAGES_DIR, 'Features', 'Agents', 'Core'),
  path.join(PACKAGES_DIR, 'Features', 'Channels', 'Core'),
];

function engineContextKey(name = '') {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

function unmetEngineNeeds(meta = {}, context = {}) {
  return (meta.needs ?? []).filter(key => context[key] == null);
}

export async function boot() {
  const featureRegistry = await FeatureRegistry.load(Paths.FEATURES_DIR);

  const browserPreviewService = getBrowserPreviewService();

  // Discover engine modules and build them via engineMeta.create(context)
  const discovered = await discoverEngines(ENGINE_SCAN_DIRS);

  // Build context incrementally — engines can reference previously-created ones
  const context = {
    paths: Paths,
    featureRegistry,
    connectorEngine: null,
    automationEngine: null,
    agentsEngine: null,
    channelEngine: null,
  };

  const pending = [...discovered];
  while (pending.length) {
    let progressed = false;

    for (let index = 0; index < pending.length; index += 1) {
      const { name, meta } = pending[index];
      if (typeof meta.create !== 'function') {
        pending.splice(index, 1);
        index -= 1;
        continue;
      }

      if (unmetEngineNeeds(meta, context).length) continue;

      context[engineContextKey(name)] = meta.create(context);
      pending.splice(index, 1);
      index -= 1;
      progressed = true;
    }

    if (progressed) continue;

    const details = pending.map(({ name, meta }) => {
      const missing = unmetEngineNeeds(meta, context);
      return `${name} [missing: ${missing.join(', ') || 'unknown'}]`;
    }).join('; ');

    throw new Error(`[Boot] Unable to instantiate engines: ${details}`);
  }

  setGoogleConnectorEngine(context.connectorEngine);

  featureRegistry.setBaseContext({
    connectorEngine: context.connectorEngine,
    paths: Paths,
    invalidateSystemPrompt,
  });

  // Register IPC modules — pass all engines + services as context
  const registered = await discoverAndRegisterIPC(IPC_SCAN_DIRS, {
    ...context,
    featureRegistry,
    browserPreviewService,
  }, {
    serviceDirs: SERVICE_SCAN_DIRS,
  });

  console.log(`[Boot] Auto-discovered ${registered.length} IPC modules: ${registered.join(', ')}`);

  return {
    featureRegistry,
    browserPreviewService,
    ...context,
  };
}

export function startEngines({ automationEngine, agentsEngine, channelEngine }) {
  automationEngine?.start?.();
  agentsEngine?.start?.();
  channelEngine?.start?.();
}

export function stopEngines({ automationEngine, agentsEngine, channelEngine }) {
  automationEngine?.stop?.();
  agentsEngine?.stop?.();
  channelEngine?.stop?.();
}
