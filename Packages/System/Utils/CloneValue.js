export function cloneValue(value) {
  if (value == null || typeof value !== 'object') return value;

  if (typeof globalThis.structuredClone === 'function') {
    try {
      return globalThis.structuredClone(value);
    } catch {
      // Fall through to the JSON clone path for plain data payloads.
    }
  }

  return JSON.parse(JSON.stringify(value));
}

export default cloneValue;
