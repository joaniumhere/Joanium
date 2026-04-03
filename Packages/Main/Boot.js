import FeatureRegistry from '../Capabilities/Core/FeatureRegistry.js';
import { setConnectorEngine as setGoogleConnectorEngine } from '../Capabilities/Google/GoogleWorkspace.js';
import createFeatureStorageMap from '../Features/Core/FeatureStorage.js';
import { IPC_SCAN_DIRS, SERVICE_SCAN_DIRS, ENGINE_DISCOVERY_ROOTS } from './Core/DiscoveryManifest.js';
import { discoverAndRegisterIPC } from './Core/DiscoverIPC.js';
import { discoverEngines } from './Core/EngineDiscovery.js';
import Paths from './Core/Paths.js';
import { getBrowserPreviewService } from './Services/BrowserPreviewService.js';
import { invalidate as invalidateSystemPrompt } from './Services/SystemPromptService.js';
import * as UserService from './Services/UserService.js';

function engineContextKey(name = '') {
  return name.charAt(0).toLowerCase() + name.slice(1);
}

function unmetEngineNeeds(meta = {}, context = {}) {
  return (meta.needs ?? []).filter(key => context[key] == null);
}

export async function boot() {
  const featureRegistry = await FeatureRegistry.load(Paths.FEATURES_DIR);
  const browserPreviewService = getBrowserPreviewService();
  const featureStorage = createFeatureStorageMap(Paths);

  // Discover engine modules and build them via engineMeta.create(context)
  const discovered = await discoverEngines(ENGINE_DISCOVERY_ROOTS);

  // Build context incrementally so engines can request the same shared services.
  const context = {
    paths: Paths,
    featureRegistry,
    featureStorage,
    invalidateSystemPrompt,
    userService: UserService,
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

  const registered = await discoverAndRegisterIPC(IPC_SCAN_DIRS, {
    ...context,
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
