import fs from 'fs';
import path from 'path';
import { pathToFileURL } from 'url';
import { PAGE_DISCOVERY_ROOT } from './DiscoveryManifest.js';

function scanRecursive(dir, predicate, results = []) {
  if (!fs.existsSync(dir)) return results;

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanRecursive(fullPath, predicate, results);
      continue;
    }

    if (entry.isFile() && predicate(entry.name, fullPath)) {
      results.push(fullPath);
    }
  }

  return results;
}

function normalizePage(rawPage = {}, filePath = '') {
  if (!rawPage?.id || !rawPage?.moduleUrl) {
    console.warn(`[PageDiscovery] Skipping invalid page manifest: ${filePath}`);
    return null;
  }

  return {
    ...rawPage,
    css: rawPage.css ?? null,
    label: rawPage.label ?? rawPage.id,
    order: rawPage.order ?? 999,
    section: rawPage.section === 'bottom' ? 'bottom' : 'top',
    showInSidebar: rawPage.showInSidebar !== false,
  };
}

export async function discoverPages(scanRoot = PAGE_DISCOVERY_ROOT) {
  const pageFiles = scanRecursive(scanRoot, name => name === 'Page.js');
  const pages = [];
  const seenIds = new Set();

  for (const filePath of pageFiles.sort((a, b) => a.localeCompare(b))) {
    try {
      const mod = await import(pathToFileURL(filePath).href);
      const page = normalizePage(mod.default, filePath);
      if (!page) continue;

      if (seenIds.has(page.id)) {
        throw new Error(`[PageDiscovery] Duplicate page id "${page.id}" found at ${filePath}`);
      }

      seenIds.add(page.id);
      pages.push(page);
    } catch (error) {
      console.warn(`[PageDiscovery] Failed to load page manifest: ${filePath}`, error.message);
    }
  }

  return pages.sort((a, b) => {
    const orderDelta = (a.order ?? 999) - (b.order ?? 999);
    if (orderDelta !== 0) return orderDelta;
    return String(a.label ?? a.id).localeCompare(String(b.label ?? b.id));
  });
}
