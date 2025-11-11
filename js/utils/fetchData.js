const cache = new Map();

export async function fetchCSV(path, { autoType = true } = {}) {
  const d3 = window.d3;
  if (!d3) throw new Error('D3 not loaded');
  if (cache.has(path)) return cache.get(path);
  const p = d3.csv(path, autoType ? d3.autoType : undefined)
    .then(data => (cache.set(path, data), data));
  cache.set(path, p);
  return p;
}

export async function fetchJSON(path) {
  if (cache.has(path)) return cache.get(path);
  const p = fetch(path).then(r => r.json()).then(j => (cache.set(path, j), j));
  cache.set(path, p);
  return p;
}
