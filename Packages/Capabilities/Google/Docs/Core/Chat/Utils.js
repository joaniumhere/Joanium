export function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const full =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return {
    red: parseInt(full.slice(0, 2), 16) / 255,
    green: parseInt(full.slice(2, 4), 16) / 255,
    blue: parseInt(full.slice(4, 6), 16) / 255,
  };
}

export function findAllOccurrences(text, query) {
  const results = [];
  let pos = 0;
  while ((pos = text.indexOf(query, pos)) !== -1) {
    results.push({ start: pos, end: pos + query.length });
    pos += query.length;
  }
  return results;
}
