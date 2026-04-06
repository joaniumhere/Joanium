import { buildSystemPrompt } from '../../System/Prompting/SystemPrompt.js';
import * as ContentLibraryService from './ContentLibraryService.js';

const TTL_MS = 5 * 60_000;

let _cache = null;
let _cacheTime = 0;

export function invalidate() {
  _cache = null;
  _cacheTime = 0;
}

export function getDefaultPersona() {
  return ContentLibraryService.getDefaultPersona();
}

export async function get({
  user,
  customInstructions,
  memory,
  connectorEngine,
  featureRegistry = null,
}) {
  const now = Date.now();
  if (_cache && now - _cacheTime < TTL_MS) return _cache;

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
    memory,
    gmailEmail: googleCreds?.email ?? null,
    activePersona,
    connectedServices: featurePromptContext.connectedServices ?? [],
    extraContextSections: featurePromptContext.sections ?? [],
  });
  _cacheTime = now;

  return _cache;
}
