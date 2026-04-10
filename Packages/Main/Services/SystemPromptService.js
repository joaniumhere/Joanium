import { buildSystemPrompt } from '../../System/Prompting/SystemPrompt.js';
import * as ContentLibraryService from './ContentLibraryService.js';

const TTL_MS = 5 * 60_000;

let _cache = null;
let _cacheTime = 0;
let _inflight = null;

export function invalidate() {
  _cache = null;
  _cacheTime = 0;
  _inflight = null;
}

export function getDefaultPersona() {
  return ContentLibraryService.getDefaultPersona();
}

export async function get({ user, customInstructions, connectorEngine, featureRegistry = null }) {
  const now = Date.now();
  if (_cache && now - _cacheTime < TTL_MS) return _cache;
  if (_inflight) return _inflight;

  _inflight = (async () => {
    const googleCreds = connectorEngine.getCredentials('google');

    let featurePromptContext = { connectedServices: [], sections: [] };

    if (featureRegistry?.buildPromptContext) {
      try {
        featurePromptContext = await featureRegistry.buildPromptContext({
          connectorEngine,
          invalidateSystemPrompt: invalidate,
        });
      } catch (error) {
        console.warn('[SystemPromptService] Feature prompt context failed:', error.message);
      }
    }

    let activePersona = null;
    try {
      activePersona = ContentLibraryService.readActivePersona() ?? getDefaultPersona();
    } catch {
      activePersona = getDefaultPersona();
    }

    _cache = await buildSystemPrompt({
      userName: user.name,
      customInstructions,
      gmailEmail: googleCreds?.email ?? null,
      activePersona,
      connectedServices: featurePromptContext.connectedServices ?? [],
      extraContextSections: featurePromptContext.sections ?? [],
    });
    _cacheTime = Date.now();

    return _cache;
  })();

  try {
    return await _inflight;
  } finally {
    _inflight = null;
  }
}
