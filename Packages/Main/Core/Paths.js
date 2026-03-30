import { fileURLToPath } from 'url';
import path from 'path';
import { app } from 'electron';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..', '..', '..');
const EXTERNAL = app.isPackaged ? process.resourcesPath : ROOT;

export const Paths = {
  ROOT,
  DATA_DIR: path.join(EXTERNAL, 'Data'),
  USER_FILE: path.join(EXTERNAL, 'Data', 'User.json'),
  MODELS_FILE: path.join(EXTERNAL, 'Data', 'Models.json'),
  CUSTOM_INSTRUCTIONS_FILE: path.join(EXTERNAL, 'Data', 'CustomInstructions.md'),
  MEMORY_FILE: path.join(EXTERNAL, 'Data', 'Memory.md'),
  CHATS_DIR: path.join(EXTERNAL, 'Data', 'Chats'),
  PROJECTS_DIR: path.join(EXTERNAL, 'Data', 'Projects'),
  AUTOMATIONS_FILE: path.join(EXTERNAL, 'Data', 'Automations.json'),
  SKILLS_FILE: path.join(EXTERNAL, 'Data', 'Skills.json'),
  CONNECTORS_FILE: path.join(EXTERNAL, 'Data', 'Connectors.json'),
  ACTIVE_PERSONA_FILE: path.join(EXTERNAL, 'Data', 'ActivePersona.json'),
  USAGE_FILE: path.join(EXTERNAL, 'Data', 'Usage.json'),
  AGENTS_FILE: path.join(EXTERNAL, 'Data', 'Agents.json'),
  CHANNELS_FILE: path.join(EXTERNAL, 'Data', 'Channels.json'),
  MCP_FILE: path.join(EXTERNAL, 'Data', 'MCPServers.json'),
  WINDOW_STATE_FILE: path.join(EXTERNAL, 'Data', 'WindowState.json'),
  FEATURES_DATA_DIR: path.join(EXTERNAL, 'Data', 'Features'),
  SKILLS_DIR: path.join(EXTERNAL, 'Skills'),
  PERSONAS_DIR: path.join(EXTERNAL, 'Personas'),
  FEATURES_DIR: path.join(ROOT, 'Packages', 'Features'),
  PRELOAD: path.join(ROOT, 'Packages', 'Electron', 'Bridge', 'Preload.js'),
  SETUP_PAGE: path.join(ROOT, 'Public', 'Setup.html'),
  INDEX_PAGE: path.join(ROOT, 'Public', 'index.html'),
  AUTOMATIONS_PAGE: path.join(ROOT, 'Public', 'Automations.html'),
  SKILLS_PAGE: path.join(ROOT, 'Public', 'Skills.html'),
  PERSONAS_PAGE: path.join(ROOT, 'Public', 'Personas.html'),
  USAGE_PAGE: path.join(ROOT, 'Public', 'Usage.html'),
  AGENTS_PAGE: path.join(ROOT, 'Public', 'Agents.html'),
  EVENTS_PAGE: path.join(ROOT, 'Public', 'Events.html'),
  CHANNELS_PAGE: path.join(ROOT, 'Public', 'Channels.html'),
};

export default Paths;
