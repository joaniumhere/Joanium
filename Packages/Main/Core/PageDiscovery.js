import { getBuiltinPages } from '../../Pages/PageRegistry.js';

export async function discoverPages() {
  return getBuiltinPages()
    .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
}
