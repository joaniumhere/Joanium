import fs from 'fs';
import path from 'path';
import { buildSystemPrompt } from '../../System/Prompting/SystemPrompt.js';
import Paths from '../Core/Paths.js';
import { parseFrontmatter } from './FileService.js';

const TTL_MS = 5 * 60_000;

let _cache = null;
let _cacheTime = 0;

export function invalidate() {
  _cache = null;
  _cacheTime = 0;
}

export function getDefaultPersona() {
  try {
    const joanaPath = path.join(Paths.PERSONAS_DIR, 'Joana.md');
    if (fs.existsSync(joanaPath)) {
      const raw = fs.readFileSync(joanaPath, 'utf-8');
      const { meta, body } = parseFrontmatter(raw);
      return {
        filename: 'Joana.md',
        name: meta.name || 'Joana',
        personality: meta.personality || '',
        description: meta.description || '',
        instructions: body,
      };
    }
  } catch (err) {
    console.warn('[SystemPromptService] Failed to load default persona Joana:', err.message);
  }
  return null;
}

export async function get({ user, customInstructions, memory, connectorEngine, featureRegistry = null }) {
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
    if (fs.existsSync(Paths.ACTIVE_PERSONA_FILE)) {
      activePersona = JSON.parse(fs.readFileSync(Paths.ACTIVE_PERSONA_FILE, 'utf-8'));
    } else {
      activePersona = getDefaultPersona();
    }
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
