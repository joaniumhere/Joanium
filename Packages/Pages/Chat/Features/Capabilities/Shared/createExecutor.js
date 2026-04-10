/**
 * Factory to eliminate executor boilerplate.
 *
 * Instead of every Executor.js repeating:
 *   const HANDLED = new Set([...]);
 *   export function handles(toolName) { return HANDLED.has(toolName); }
 *   export async function execute(toolName, params, onStage = () => {}) { ... }
 *
 * Each file just does:
 *   import { createExecutor } from '../Shared/createExecutor.js';
 *   export const { handles, execute } = createExecutor({
 *     name: 'WeatherExecutor',
 *     tools: ['get_weather'],
 *     handlers: { get_weather: async (params, onStage) => { ... } },
 *   });
 *
 * @param {object} opts
 * @param {string} opts.name    - Human-readable executor name (for error messages)
 * @param {string[]} opts.tools - Tool names this executor handles
 * @param {Object<string, Function>} opts.handlers - Map of toolName → async (params, onStage) => string
 */
function normalizeHooks(hooksOrOnStage) {
  if (typeof hooksOrOnStage === 'function') {
    return { onStage: hooksOrOnStage };
  }

  if (hooksOrOnStage && typeof hooksOrOnStage === 'object') {
    return hooksOrOnStage;
  }

  return {};
}

export function createExecutor({ name, tools, handlers }) {
  const HANDLED = new Set(tools);

  function handles(toolName) {
    return HANDLED.has(toolName);
  }

  async function execute(toolName, params, hooksOrOnStage = () => {}) {
    const handler = handlers[toolName];
    if (!handler) {
      throw new Error(`${name}: unknown tool "${toolName}"`);
    }
    const hooks = normalizeHooks(hooksOrOnStage);
    return handler(params, hooks.onStage ?? (() => {}), hooks);
  }

  return { handles, execute };
}
