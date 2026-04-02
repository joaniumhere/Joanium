/**
 * Pages Manifest — discovers page metadata from page modules.
 *
 * Each page module at Packages/Pages/<Name>/UI/Render/index.js exports pageMeta:
 *   id       — route key (used in PAGES map and sidebar data-view)
 *   label    — sidebar tooltip text
 *   icon     — SVG string for the sidebar button
 *   css      — optional stylesheet path (null if none)
 *   order    — sort order in the sidebar
 *   section  — 'top' (above spacer) or 'bottom' (below spacer)
 *
 * Adding a new page:
 *   1. Create Packages/Pages/<Name>/UI/Render/index.js
 *   2. Export `pageMeta` and `mount` from the module
 *   3. Add the import entry to PAGE_IMPORTS below
 *
 * The metadata lives in each page module (single source of truth).
 * PAGE_IMPORTS is just the routing table — no metadata duplication.
 */

const PAGE_IMPORTS = {
  chat:        () => import('../../Pages/Chat/UI/Render/index.js'),
  setup:       () => import('../../Pages/Setup/UI/Render/index.js'),
  automations: () => import('../../Pages/Automations/UI/Render/index.js'),
  agents:      () => import('../../Pages/Agents/UI/Render/index.js'),
  skills:      () => import('../../Pages/Skills/UI/Render/index.js'),
  personas:    () => import('../../Pages/Personas/UI/Render/index.js'),
  events:      () => import('../../Pages/Events/UI/Render/index.js'),
  usage:       () => import('../../Pages/Usage/UI/Render/index.js'),
};

// Loaded page metadata cache
let _pagesCache = null;
let _featurePages = [];

/**
 * Register pages declared by features.
 * Call this before discoverPages() to include feature-contributed pages.
 * Each entry: { id, label, icon, css, order, section, load }
 */
export function registerFeaturePages(pages = []) {
  _featurePages = pages.filter(p => p?.id && typeof p.load === 'function');
}

/**
 * Discover all page modules and read their pageMeta.
 * Resolves all imports in parallel and caches the result.
 */
export async function discoverPages() {
  if (_pagesCache) return _pagesCache;

  const entries = Object.entries(PAGE_IMPORTS);
  const results = await Promise.allSettled(
    entries.map(async ([id, load]) => {
      const mod = await load();
      return { ...mod.pageMeta, load, css: mod.pageMeta?.css ?? null };
    }),
  );

  const builtinPages = results
    .filter(r => r.status === 'fulfilled' && r.value?.id)
    .map(r => r.value);

  _pagesCache = [...builtinPages, ..._featurePages]
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));

  return _pagesCache;
}

/**
 * Build the PAGES map for the router.
 * Returns { chat: { load, css }, automations: { load, css }, ... }
 */
export function buildPagesMap() {
  const map = {};
  const pages = _pagesCache ?? [];
  for (const page of pages) {
    map[page.id] = { load: page.load, css: page.css };
  }
  return map;
}

/**
 * Build sidebar nav items from discovered pages.
 * Returns { top: [...], bottom: [...] } each sorted by order.
 */
export function buildSidebarNav() {
  const pages = _pagesCache ?? [];
  const top = [], bottom = [];
  for (const page of pages) {
    const item = { id: page.id, label: page.label, icon: page.icon };
    if (page.section === 'bottom') bottom.push(item);
    else top.push(item);
  }
  return { top, bottom };
}
