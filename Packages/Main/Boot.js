import FeatureRegistry from '../Capabilities/Core/FeatureRegistry.js';
import createFeatureStorageMap from '../Features/Core/FeatureStorage.js';
import {
  IPC_SCAN_DIRS,
  SERVICE_SCAN_DIRS,
  ENGINE_DISCOVERY_ROOTS,
  FEATURE_DISCOVERY_ROOTS,
} from './Core/DiscoveryManifest.js';
import { discoverAndRegisterIPC } from './Core/DiscoverIPC.js';
import { instantiateDiscoveredEngines } from './Core/EngineAssembly.js';
import { startEngines, stopEngines } from './Core/EngineLifecycle.js';
import { discoverEngines } from './Core/EngineDiscovery.js';
import Paths from './Core/Paths.js';
import { getBrowserPreviewService } from './Services/BrowserPreviewService.js';
import { invalidate as invalidateSystemPrompt } from './Services/SystemPromptService.js';
import * as UserService from './Services/UserService.js';

export async function boot() {
  const featureRegistry = await FeatureRegistry.load(FEATURE_DISCOVERY_ROOTS);
  const browserPreviewService = getBrowserPreviewService();

  // Discover engine modules and build them via engineMeta.create(context)
  const discovered = await discoverEngines(ENGINE_DISCOVERY_ROOTS);
  const featureStorage = createFeatureStorageMap(Paths, {
    featureRegistry,
    engines: discovered,
  });

  // Build context incrementally so engines can request the same shared services.
  const baseContext = {
    paths: Paths,
    featureRegistry,
    featureStorage,
    invalidateSystemPrompt,
    userService: UserService,
  };
  const { context, engines } = await instantiateDiscoveredEngines(discovered, baseContext);

  featureRegistry.setBaseContext({
    connectorEngine: context.connectorEngine,
    featureStorage,
    paths: Paths,
    invalidateSystemPrompt,
  });
  await featureRegistry.runLifecycle('onBoot', context);

  const registered = await discoverAndRegisterIPC(
    IPC_SCAN_DIRS,
    {
      ...context,
      browserPreviewService,
    },
    {
      serviceDirs: SERVICE_SCAN_DIRS,
    },
  );

  console.log(`[Boot] Auto-discovered ${registered.length} IPC modules: ${registered.join(', ')}`);

  return {
    featureRegistry,
    browserPreviewService,
    ...context,
  };
}

export { startEngines, stopEngines };
