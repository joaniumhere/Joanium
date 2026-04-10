/** Resolve a coin name/symbol → CoinGecko id + display name/symbol */
export async function resolveCoin(coinInput) {
  const searchData = await safeJson(
    `https://api.coingecko.com/api/v3/search?query=${encodeURIComponent(coinInput)}`,
  );
  const result = searchData.coins?.[0];
  if (!result) throw new Error(`Couldn't find cryptocurrency "${coinInput}".`);
  return result; // { id, name, symbol, market_cap_rank, ... }
}

/** Return a fiat-currency symbol prefix (best-effort) */
export function currencySymbol(c) {
  const map = { usd: '$', eur: '€', inr: '₹', gbp: '£', jpy: '¥', aud: 'A$', cad: 'C$' };
  return map[c.toLowerCase()] ?? c.toUpperCase() + ' ';
}
