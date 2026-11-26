// js/data.js
export function createDataSource(base = ".", fetchFn = globalThis.fetch) {
  const cache = new Map();

  function json(url) {
    if (!cache.has(url)) {
      cache.set(url, fetchFn(url).then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
        return r.json();
      }));
    }
    return cache.get(url);
  }

  return {
    loadManifest: () => json(`${base}/data/manifest.json`),
    loadConcepts: () => json(`${base}/data/concepts.json`),
    loadTerms: (lang) => json(`${base}/data/terms.${lang}.json`),
    loadLessons: (lang) => json(`${base}/data/lessons.${lang}.json`),
    _cache: cache,
  };
}
