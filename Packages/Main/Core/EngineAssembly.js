function getProvidedKey(engine = {}) {
  return engine.meta?.provides ?? engine.provides ?? null;
}

function getEngineLabel(engine = {}) {
  return engine.name ?? engine.id ?? getProvidedKey(engine) ?? 'unknown engine';
}

function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error ?? 'Unknown error');
}

function unmetEngineNeeds(meta = {}, context = {}) {
  return (meta.needs ?? []).filter((key) => context[key] == null);
}

export async function instantiateDiscoveredEngines(discovered = [], baseContext = {}) {
  const engines =
    baseContext.engines &&
    typeof baseContext.engines === 'object' &&
    !Array.isArray(baseContext.engines)
      ? baseContext.engines
      : {};
  const context = {
    ...baseContext,
    engines,
  };

  const providers = new Map();
  for (const engine of discovered) {
    const key = getProvidedKey(engine);
    if (!key) {
      throw new Error(`[EngineAssembly] "${getEngineLabel(engine)}" is missing a provides key.`);
    }

    if (providers.has(key)) {
      throw new Error(
        `[EngineAssembly] Duplicate engine provider "${key}" from ${providers.get(key)} and ${engine.filePath ?? getEngineLabel(engine)}`,
      );
    }

    providers.set(key, engine.filePath ?? getEngineLabel(engine));
  }

  const pending = [...discovered];
  while (pending.length) {
    let progressed = false;

    for (let index = 0; index < pending.length; index += 1) {
      const engine = pending[index];
      const { meta = {} } = engine;
      if (typeof meta.create !== 'function') {
        pending.splice(index, 1);
        index -= 1;
        continue;
      }

      const missing = unmetEngineNeeds(meta, context);
      if (missing.length) continue;

      const provideKey = getProvidedKey(engine);

      try {
        const instance = await meta.create(context);
        context[provideKey] = instance;
        engines[provideKey] = instance;
      } catch (error) {
        throw new Error(
          `[EngineAssembly] Failed to create "${getEngineLabel(engine)}" (${provideKey}): ${getErrorMessage(error)}`,
        );
      }

      pending.splice(index, 1);
      index -= 1;
      progressed = true;
    }

    if (progressed) continue;

    const details = pending
      .map((engine) => {
        const missing = unmetEngineNeeds(engine.meta, context);
        return `${getEngineLabel(engine)} [missing: ${missing.join(', ') || 'unknown'}]`;
      })
      .join('; ');

    throw new Error(`[EngineAssembly] Unable to instantiate engines: ${details}`);
  }

  return {
    context,
    engines,
  };
}

export default instantiateDiscoveredEngines;
