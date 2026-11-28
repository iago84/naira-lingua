// js/store.js
const NS = "naira-lingua:progress:v1";

const EMPTY = { ui: { lang: null, translit: true }, lastPair: null, pairs: {} };

export function memoryStorage() {
  const map = new Map();
  return {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
}

export function defaultStorage() {
  try {
    if (typeof localStorage !== "undefined") {
      localStorage.setItem(NS + ":probe", "1");
      localStorage.removeItem(NS + ":probe");
      return localStorage;
    }
  } catch (_) {}
  return memoryStorage();
}

export function createStore(storage) {
  function readAll() {
    try {
      const raw = storage.getItem(NS);
      if (!raw) return structuredClone(EMPTY);
      const data = JSON.parse(raw);
      const base = structuredClone(EMPTY);
      // Mezcla profunda de ``ui``: estados guardados antes del toggle de
      // transliteración conservan el valor por defecto.
      return { ...base, ...data, ui: { ...base.ui, ...(data.ui || {}) } };
    } catch (_) {
      return structuredClone(EMPTY);
    }
  }

  function save(state) {
    storage.setItem(NS, JSON.stringify(state));
  }

  function pairKey(src, tgt) {
    return `${src}>${tgt}`;
  }

  function blankPair() {
    return { known: [], review: [], correct: 0, wrong: 0 };
  }

  function getState() {
    return readAll();
  }

  function ensurePair(state, src, tgt) {
    const k = pairKey(src, tgt);
    if (!state.pairs[k]) state.pairs[k] = blankPair();
    return state.pairs[k];
  }

  return {
    _storage: storage,
    getState,
    getPair(src, tgt) {
      return readAll().pairs[pairKey(src, tgt)] ?? null;
    },
    setUiLang(lang) {
      const s = readAll();
      s.ui.lang = lang;
      save(s);
    },
    setShowTranslit(on) {
      const s = readAll();
      s.ui.translit = Boolean(on);
      save(s);
    },
    showTranslit() {
      return readAll().ui.translit !== false;
    },
    setLastPair(src, tgt) {
      const s = readAll();
      s.lastPair = { src, tgt };
      save(s);
    },
    markKnown(src, tgt, id) {
      const s = readAll();
      const p = ensurePair(s, src, tgt);
      p.review = p.review.filter((x) => x !== id);
      if (!p.known.includes(id)) p.known.push(id);
      save(s);
    },
    markReview(src, tgt, id) {
      const s = readAll();
      const p = ensurePair(s, src, tgt);
      p.known = p.known.filter((x) => x !== id);
      if (!p.review.includes(id)) p.review.push(id);
      save(s);
    },
    recordQuiz(src, tgt, ok) {
      const s = readAll();
      const p = ensurePair(s, src, tgt);
      if (ok) p.correct += 1;
      else p.wrong += 1;
      save(s);
    },
    resetPair(src, tgt) {
      const s = readAll();
      delete s.pairs[pairKey(src, tgt)];
      save(s);
    },
  };
}
