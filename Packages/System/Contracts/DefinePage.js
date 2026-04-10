function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`[Page] ${label} must be a non-empty string.`);
  }
}

export function definePage(page = {}) {
  if (page == null || typeof page !== 'object' || Array.isArray(page)) {
    throw new Error('[Page] Page definition must be an object.');
  }

  const id = String(page.id ?? '').trim();
  const moduleUrl = String(page.moduleUrl ?? '').trim();

  assertNonEmptyString(id, 'Page id');
  assertNonEmptyString(moduleUrl, 'Page moduleUrl');

  return Object.freeze({
    id,
    label: String(page.label ?? id).trim(),
    icon: String(page.icon ?? '').trim(),
    css: typeof page.css === 'string' && page.css.trim() ? page.css.trim() : null,
    order: Number.isFinite(page.order) ? page.order : 999,
    section: page.section === 'bottom' ? 'bottom' : 'top',
    showInSidebar: page.showInSidebar !== false,
    moduleUrl,
  });
}

export default definePage;
