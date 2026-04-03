import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGES_DIR = path.resolve(__dirname, '..', '..');

export const IPC_SCAN_DIRS = [
  path.join(PACKAGES_DIR, 'Main', 'IPC'),
  path.join(PACKAGES_DIR, 'Features'),
];

export const SERVICE_SCAN_DIRS = [
  path.join(PACKAGES_DIR, 'Main', 'Services'),
];

export const ENGINE_DISCOVERY_ROOTS = [
  path.join(PACKAGES_DIR, 'Features'),
];

export const PAGE_DISCOVERY_ROOT = path.join(PACKAGES_DIR, 'Pages');

export default {
  ENGINE_DISCOVERY_ROOTS,
  IPC_SCAN_DIRS,
  PAGE_DISCOVERY_ROOT,
  SERVICE_SCAN_DIRS,
};
