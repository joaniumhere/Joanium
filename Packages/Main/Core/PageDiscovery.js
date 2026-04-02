import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';

/**
 * Scan the Pages directory for page modules that export pageMeta.
 * Each page must be at: Packages/Pages/<Name>/UI/Render/index.js
 * and export `pageMeta` with { id, label, icon, css, order, section }.
 */
export async function discoverPages(pagesDir) {
  const discovered = [];

  if (!fs.existsSync(pagesDir)) return discovered;

  const entries = fs.readdirSync(pagesDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;

    const indexPath = path.join(pagesDir, entry.name, 'UI', 'Render', 'index.js');
    if (!fs.existsSync(indexPath)) continue;

    try {
      const mod = await import(pathToFileURL(indexPath).href);
      if (!mod.pageMeta?.id) continue;

      discovered.push({
        ...mod.pageMeta,
        _modulePath: indexPath,
      });
    } catch (err) {
      console.warn(`[PageDiscovery] Failed to load page module: ${indexPath}`, err.message);
    }
  }

  discovered.sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  return discovered;
}
