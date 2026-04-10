/**
 * Pages Manifest — built from main-process page discovery plus optional
 * feature-contributed page entries from the boot payload.
 */

let _pagesCache = null;
let _featurePages = [];

function normalizeFeaturePage(page = {}) {
  if (!page?.id) return null;
  if (typeof page.load === 'function') return page;
  if (typeof page.moduleUrl === 'string' && page.moduleUrl) {
    return {
      ...page,
      load: () => import(page.moduleUrl),
    };
  }
  return null;
}

async function loadBuiltinPages() {
  if (!window.electronAPI?.invoke) return [];

  const pages = await window.electronAPI.invoke('get-pages');
  if (!Array.isArray(pages)) return [];

  return pages
    .filter((page) => page?.id && page?.moduleUrl)
    .map((page) => ({
      ...page,
      load: () => import(page.moduleUrl),
      css: page.css ?? null,
    }));
}

export function registerFeaturePages(pages = []) {
  _featurePages = pages.map(normalizeFeaturePage).filter(Boolean);
}

export async function discoverPages() {
  if (_pagesCache) return _pagesCache;

  const builtinPages = await loadBuiltinPages();
  const byId = new Map();
  for (const page of [...builtinPages, ..._featurePages]) {
    byId.set(page.id, page);
  }

  _pagesCache = [...byId.values()].sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  return _pagesCache;
}

export function buildPagesMap() {
  const map = {};
  const pages = _pagesCache ?? [];
  for (const page of pages) {
    map[page.id] = { load: page.load, css: page.css };
  }
  return map;
}

export function buildSidebarNav() {
  const pages = _pagesCache ?? [];
  const top = [];
  const bottom = [];

  for (const page of pages) {
    if (page.showInSidebar === false) continue;

    const item = { id: page.id, label: page.label, icon: page.icon };
    if (page.section === 'bottom') bottom.push(item);
    else top.push(item);
  }

  // Keep Marketplace anchored as the final top-section sidebar item.
  const marketplaceIndex = top.findIndex((item) => item.id === 'marketplace');
  if (marketplaceIndex !== -1 && marketplaceIndex !== top.length - 1) {
    const [marketplaceItem] = top.splice(marketplaceIndex, 1);
    top.push(marketplaceItem);
  }

  return { top, bottom };
}
