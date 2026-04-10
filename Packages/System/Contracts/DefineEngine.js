function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`[Engine] ${label} must be a non-empty string.`);
  }
}

function normalizeNeeds(needs = []) {
  if (!Array.isArray(needs)) {
    throw new Error('[Engine] needs must be an array when provided.');
  }

  return Object.freeze(
    needs.map((need, index) => {
      assertNonEmptyString(need, `Need at index ${index}`);
      return need.trim();
    }),
  );
}

function normalizeStorage(storage) {
  if (storage == null) return Object.freeze([]);

  const items = Array.isArray(storage) ? storage : [storage];
  return Object.freeze(
    items.map((item, index) => {
      if (typeof item === 'string') {
        const key = item.trim();
        assertNonEmptyString(key, `Storage key at index ${index}`);
        return Object.freeze({ key });
      }

      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        throw new Error(`[Engine] Storage descriptor at index ${index} must be an object.`);
      }

      const key = String(item.key ?? item.id ?? '').trim();
      assertNonEmptyString(key, `Storage descriptor key at index ${index}`);

      return Object.freeze({
        ...item,
        key,
      });
    }),
  );
}

export function defineEngine(meta = {}) {
  if (meta == null || typeof meta !== 'object' || Array.isArray(meta)) {
    throw new Error('[Engine] Engine metadata must be an object.');
  }

  if (typeof meta.create !== 'function') {
    throw new Error('[Engine] Engine metadata must include a create(context) function.');
  }

  const id = typeof meta.id === 'string' ? meta.id.trim() : '';
  const provides = typeof meta.provides === 'string' ? meta.provides.trim() : '';

  return Object.freeze({
    ...meta,
    id,
    provides,
    needs: normalizeNeeds(meta.needs),
    storage: normalizeStorage(meta.storage),
    create: meta.create,
  });
}

export default defineEngine;
