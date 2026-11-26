# Plataforma web `naira-lingua` — Plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Construir la app web estática `naira-lingua` (flashcards, quiz, lecciones, diccionario y progreso, any-to-any, PWA offline, UI es/en) que consume el corpus v2 y se publica en GitHub Pages.

**Architecture:** Web estática vanilla JS (ES Modules, sin build) servida desde la raíz del repo en GitHub Pages. Router por hash. Los datos (`data/*.json`) los genera `tools/build.py`. Lógica pura (i18n, store, pairs, router, data) separada de las vistas y cubierta con `node:test`; las vistas exponen un `render(state) → string` puro (testeable) y un `mount(root, ctx)` que cablea eventos.

**Tech Stack:** HTML + CSS + JavaScript (ES Modules nativos, `fetch`, `localStorage`, Service Worker). Tests de JS con `node:test` (sin dependencias). Python 3.10+ para `tools/` (pytest existente). Hosting: GitHub Pages.

**Repo:** `F:\TRABAJO\TO WORK ON QUICK\TRABAJO EXTRA\naira-lingua` (rama `main`).

> **Nota de entorno (Windows / Node 24):** ejecuta los tests de JS con `node --test` (sin argumentos descubre `**/*.test.js`) o `node --test js/tests/*.test.js`. El literal `node --test js/tests` falla en esta versión de Node.

---

## Estructura de ficheros

| Fichero | Responsabilidad |
|---|---|
| `package.json` | Solo `{"type":"module"}` para que Node trate `.js` como ESM. Sin dependencias. |
| `js/util.js` | Helpers puros: `esc`, `uniqSorted`, `shuffle`. |
| `js/i18n.js` | Textos de UI es/en, `t(lang, key)`, `normalizeLang`, `availableLangs`. |
| `js/store.js` | Progreso en `localStorage` (`createStore(storage)`), sin cuentas. |
| `js/router.js` | Parseo/creación de rutas por hash. |
| `js/pairs.js` | Any-to-any: índice de términos, `buildPair`, filtros. |
| `js/data.js` | Carga con cache de `data/*.json` (`createDataSource(base, fetchFn)`). |
| `js/views/common.js` | Helpers de vista: `page`, `optionList`, `pairSelector`. |
| `js/views/home.js` | Portada + tarjetas de modo. |
| `js/views/pick.js` | Selector de par/modo/dominio. |
| `js/views/study.js` | Flashcards. |
| `js/views/quiz.js` | Quiz de opción múltiple. |
| `js/views/lessons.js` | Lista y detalle de lecciones. |
| `js/views/dictionary.js` | Diccionario navegable (todos los idiomas). |
| `js/views/progress.js` | Progreso por par. |
| `js/main.js` | Arranque: store, i18n, data, router, nav, registro SW. |
| `index.html` | Shell (header/nav/idioma UI, `<main id="app">`, footer con slots). |
| `app.css` | Tema editorial/cuaderno + modo oscuro. |
| `manifest.webmanifest` | Metadatos PWA. |
| `service-worker.js` | Offline: precache shell + runtime cache de `data/*.json`. |
| `assets/icons/icon.svg` | Icono (vectorial). |
| `js/tests/*.test.js` | Tests de lógica pura y de `render` de vistas. |
| `tools/build.py` | (Modificar) emitir también `data/lessons.<lang>.json`. |
| `.gitignore` | (Modificar) dejar de ignorar `data/` para que Pages lo sirva. |

---

### Task 1: Scaffold + helper `util.js`

**Files:**
- Create: `package.json`
- Create: `js/util.js`
- Test: `js/tests/util.test.js`

- [ ] **Step 1: Escribir el test que falla**

```js
// js/tests/util.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { esc, uniqSorted, shuffle } from "../util.js";

test("esc escapa los caracteres peligrosos de HTML", () => {
  assert.equal(esc('<a href="x">&\'</a>'),
    "&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;");
});

test("esc trata null/undefined como cadena vacía", () => {
  assert.equal(esc(null), "");
  assert.equal(esc(undefined), "");
});

test("uniqSorted deduplica y ordena", () => {
  assert.deepEqual(uniqSorted(["b", "a", "b", "c"]), ["a", "b", "c"]);
});

test("shuffle conserva los elementos (rng determinista)", () => {
  const rng = () => 0; // siempre intercambia con el índice 0
  const out = shuffle([1, 2, 3], rng);
  assert.equal(out.length, 3);
  assert.deepEqual([...out].sort(), [1, 2, 3]);
});
```

- [ ] **Step 2: Ejecutar el test y ver que falla**

Run: `node --test js/tests`
Expected: FAIL (no existe `../util.js`).

- [ ] **Step 3: Crear `package.json` y `js/util.js`**

```json
{
  "name": "naira-lingua",
  "private": true,
  "type": "module"
}
```

```js
// js/util.js
export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function uniqSorted(arr) {
  return [...new Set(arr)].sort((a, b) => a.localeCompare(b));
}

export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
```

- [ ] **Step 4: Ejecutar el test y ver que pasa**

Run: `node --test js/tests`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add package.json js/util.js js/tests/util.test.js
git commit -m "feat(web): scaffold y helpers puros (util)"
```

---

### Task 2: i18n de la interfaz

**Files:**
- Create: `js/i18n.js`
- Test: `js/tests/i18n.test.js`

- [ ] **Step 1: Escribir el test que falla**

```js
// js/tests/i18n.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { STRINGS, normalizeLang, t, availableLangs } from "../i18n.js";

test("normalizeLang reduce y cae a español", () => {
  assert.equal(normalizeLang("en-US"), "en");
  assert.equal(normalizeLang("ES"), "es");
  assert.equal(normalizeLang("zz-ZZ"), "es");
  assert.equal(normalizeLang(undefined), "es");
});

test("t devuelve el texto del idioma pedido", () => {
  assert.equal(t("es", "nav.home"), STRINGS.es["nav.home"]);
  assert.equal(t("en", "nav.home"), STRINGS.en["nav.home"]);
});

test("t cae a español y luego a la clave", () => {
  assert.equal(t("en", "clave.inexistente"), "clave.inexistente");
});

test("availableLangs lista los idiomas de UI", () => {
  assert.deepEqual(availableLangs().sort(), ["en", "es"]);
});
```

- [ ] **Step 2: Ejecutar el test y ver que falla**

Run: `node --test js/tests`
Expected: FAIL (no existe `../i18n.js`).

- [ ] **Step 3: Implementar `js/i18n.js`**

```js
// js/i18n.js
export const STRINGS = {
  es: {
    "nav.home": "Inicio",
    "nav.pick": "Estudiar",
    "nav.study": "Flashcards",
    "nav.quiz": "Quiz",
    "nav.lessons": "Lecciones",
    "nav.dictionary": "Diccionario",
    "nav.progress": "Progreso",
    "common.selectSource": "Idioma origen",
    "common.selectTarget": "Idioma destino",
    "common.selectLang": "Idioma de la interfaz",
    "common.loading": "Cargando…",
    "common.error": "No se pudieron cargar los datos.",
    "common.all": "Todas",
    "home.lead": "Aprende cualquier idioma desde y hacia cualquier otro. Gratis, abierto y sin cuentas.",
    "home.start": "Empezar a estudiar",
    "pick.title": "Elige cómo estudiar",
    "pick.mode": "Modo",
    "pick.domain": "Temática",
    "pick.go": "Continuar",
    "study.title": "Flashcards",
    "study.flip": "Toca la tarjeta para ver la respuesta",
    "study.knew": "Ya la sabía",
    "study.review": "Repasar",
    "study.empty": "No hay tarjetas para este par y temática.",
    "study.done": "¡Ronda completada!",
    "study.restart": "Otra ronda",
    "quiz.title": "Quiz",
    "quiz.question": "¿Cómo se dice?",
    "quiz.correct": "¡Correcto!",
    "quiz.wrong": "Incorrecto",
    "quiz.next": "Siguiente",
    "quiz.finish": "Ver resultado",
    "quiz.score": "Resultado",
    "quiz.again": "Otra ronda",
    "lessons.title": "Lecciones",
    "lessons.back": "Volver a lecciones",
    "lessons.dialogue": "Diálogo",
    "lessons.explanation": "Explicación",
    "lessons.tables": "Tablas",
    "lessons.empty": "Todavía no hay lecciones para este idioma.",
    "dictionary.title": "Diccionario",
    "dictionary.placeholder": "Buscar…",
    "dictionary.empty": "Sin resultados.",
    "dictionary.inAll": "En todos los idiomas",
    "progress.title": "Progreso",
    "progress.known": "Aprendidas",
    "progress.review": "Por repasar",
    "progress.correct": "Aciertos de quiz",
    "progress.reset": "Reiniciar este par",
    "progress.resetConfirm": "¿Reiniciar el progreso de este par?",
  },
  en: {
    "nav.home": "Home",
    "nav.pick": "Study",
    "nav.study": "Flashcards",
    "nav.quiz": "Quiz",
    "nav.lessons": "Lessons",
    "nav.dictionary": "Dictionary",
    "nav.progress": "Progress",
    "common.selectSource": "Source language",
    "common.selectTarget": "Target language",
    "common.selectLang": "Interface language",
    "common.loading": "Loading…",
    "common.error": "Could not load the data.",
    "common.all": "All",
    "home.lead": "Learn any language from and into any other. Free, open and without accounts.",
    "home.start": "Start studying",
    "pick.title": "Choose how to study",
    "pick.mode": "Mode",
    "pick.domain": "Topic",
    "pick.go": "Continue",
    "study.title": "Flashcards",
    "study.flip": "Tap the card to reveal the answer",
    "study.knew": "I knew it",
    "study.review": "Review",
    "study.empty": "No cards for this pair and topic.",
    "study.done": "Round complete!",
    "study.restart": "Another round",
    "quiz.title": "Quiz",
    "quiz.question": "How do you say?",
    "quiz.correct": "Correct!",
    "quiz.wrong": "Wrong",
    "quiz.next": "Next",
    "quiz.finish": "See result",
    "quiz.score": "Result",
    "quiz.again": "Another round",
    "lessons.title": "Lessons",
    "lessons.back": "Back to lessons",
    "lessons.dialogue": "Dialogue",
    "lessons.explanation": "Explanation",
    "lessons.tables": "Tables",
    "lessons.empty": "There are no lessons for this language yet.",
    "dictionary.title": "Dictionary",
    "dictionary.placeholder": "Search…",
    "dictionary.empty": "No results.",
    "dictionary.inAll": "In all languages",
    "progress.title": "Progress",
    "progress.known": "Learned",
    "progress.review": "To review",
    "progress.correct": "Quiz hits",
    "progress.reset": "Reset this pair",
    "progress.resetConfirm": "Reset progress for this pair?",
  },
};

export function normalizeLang(lang) {
  const short = String(lang || "").slice(0, 2).toLowerCase();
  return Object.prototype.hasOwnProperty.call(STRINGS, short) ? short : "es";
}

export function t(lang, key) {
  const l = normalizeLang(lang);
  return STRINGS[l][key] ?? STRINGS.es[key] ?? key;
}

export function availableLangs() {
  return Object.keys(STRINGS);
}
```

- [ ] **Step 4: Ejecutar el test y ver que pasa**

Run: `node --test js/tests`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/i18n.js js/tests/i18n.test.js
git commit -m "feat(web): i18n de interfaz (es/en)"
```

---

### Task 3: Store de progreso

**Files:**
- Create: `js/store.js`
- Test: `js/tests/store.test.js`

- [ ] **Step 1: Escribir el test que falla**

```js
// js/tests/store.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { createStore, memoryStorage } from "../store.js";

test("marca conocidas y las persiste", () => {
  const s = createStore(memoryStorage());
  s.markKnown("es", "fr", "c:saludos.hola");
  assert.deepEqual(s.getPair("es", "fr").known, ["c:saludos.hola"]);
  // Persistencia: un store nuevo sobre el mismo storage
  const s2 = createStore(s._storage);
  assert.deepEqual(s2.getPair("es", "fr").known, ["c:saludos.hola"]);
});

test("mover a repasar quita de conocidas y no duplica", () => {
  const s = createStore(memoryStorage());
  s.markKnown("es", "fr", "a");
  s.markReview("es", "fr", "a");
  s.markReview("es", "fr", "a");
  const p = s.getPair("es", "fr");
  assert.deepEqual(p.known, []);
  assert.deepEqual(p.review, ["a"]);
});

test("recordQuiz acumula aciertos y fallos", () => {
  const s = createStore(memoryStorage());
  s.recordQuiz("es", "fr", true);
  s.recordQuiz("es", "fr", false);
  const p = s.getPair("es", "fr");
  assert.equal(p.correct, 1);
  assert.equal(p.wrong, 1);
});

test("guarda y lee preferencias de UI", () => {
  const s = createStore(memoryStorage());
  s.setUiLang("en");
  s.setLastPair("es", "it");
  const s2 = createStore(s._storage);
  assert.equal(s2.getState().ui.lang, "en");
  assert.deepEqual(s2.getState().lastPair, { src: "es", tgt: "it" });
});

test("resetPair limpia solo ese par", () => {
  const s = createStore(memoryStorage());
  s.markKnown("es", "fr", "a");
  s.markKnown("es", "it", "b");
  s.resetPair("es", "fr");
  assert.equal(s.getPair("es", "fr"), null);
  assert.deepEqual(s.getPair("es", "it").known, ["b"]);
});
```

- [ ] **Step 2: Ejecutar el test y ver que falla**

Run: `node --test js/tests`
Expected: FAIL (no existe `../store.js`).

- [ ] **Step 3: Implementar `js/store.js`**

```js
// js/store.js
const NS = "naira-lingua:progress:v1";

const EMPTY = { ui: { lang: null }, lastPair: null, pairs: {} };

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
      return { ...structuredClone(EMPTY), ...data };
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
```

- [ ] **Step 4: Ejecutar el test y ver que pasa**

Run: `node --test js/tests`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/store.js js/tests/store.test.js
git commit -m "feat(web): store de progreso local"
```

---

### Task 4: Router por hash

**Files:**
- Create: `js/router.js`
- Test: `js/tests/router.test.js`

- [ ] **Step 1: Escribir el test que falla**

```js
// js/tests/router.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseHash, toHash } from "../router.js";

test("parseHash de la raíz es home", () => {
  assert.deepEqual(parseHash(""), { name: "home", param: null });
  assert.deepEqual(parseHash("#/"), { name: "home", param: null });
});

test("parseHash lee nombre y parámetro", () => {
  assert.deepEqual(parseHash("#/study"), { name: "study", param: null });
  assert.deepEqual(parseHash("#/lessons/fr-u1-l1"),
    { name: "lessons", param: "fr-u1-l1" });
});

test("toHash construye la ruta", () => {
  assert.equal(toHash("home"), "#/");
  assert.equal(toHash("study"), "#/study");
  assert.equal(toHash("lessons", "fr-u1-l1"), "#/lessons/fr-u1-l1");
});
```

- [ ] **Step 2: Ejecutar el test y ver que falla**

Run: `node --test js/tests`
Expected: FAIL (no existe `../router.js`).

- [ ] **Step 3: Implementar `js/router.js`**

```js
// js/router.js
export function parseHash(hash) {
  const raw = String(hash || "").replace(/^#\/?/, "");
  const parts = raw.split("/").filter(Boolean);
  if (parts.length === 0) return { name: "home", param: null };
  return { name: parts[0], param: parts.slice(1).join("/") || null };
}

export function toHash(name, param) {
  if (name === "home") return "#/";
  return "#/" + name + (param ? "/" + param : "");
}
```

- [ ] **Step 4: Ejecutar el test y ver que pasa**

Run: `node --test js/tests`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/router.js js/tests/router.test.js
git commit -m "feat(web): router por hash"
```

---

### Task 5: Any-to-any (`pairs.js`)

**Files:**
- Create: `js/pairs.js`
- Test: `js/tests/pairs.test.js`

- [ ] **Step 1: Escribir el test que falla**

```js
// js/tests/pairs.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { indexTerms, pickTerm, buildPair, domainsOf, filterByDomain, termsForConcept } from "../pairs.js";

const CONCEPTS = [
  { id: "c:saludos.hola", domain: "saludos", icon: "👋", gloss_es: "saludo" },
  { id: "c:numeros.uno", domain: "numeros", icon: "1️⃣", gloss_es: "uno" },
];
const ES = [
  { concept: "c:saludos.hola", lang: "es", term: "hola", review: "verified" },
  { concept: "c:numeros.uno", lang: "es", term: "uno", review: "verified" },
];
const FR = [
  { concept: "c:saludos.hola", lang: "fr", term: "bonjour", review: "needs_review" },
  { concept: "c:saludos.hola", lang: "fr", term: "salut", review: "verified" },
];

test("indexTerms agrupa por concepto", () => {
  const idx = indexTerms(FR);
  assert.equal(idx.get("c:saludos.hola").length, 2);
});

test("pickTerm prefiere verified", () => {
  assert.equal(pickTerm(FR).term, "salut");
  assert.equal(pickTerm([]), null);
});

test("buildPair solo incluye conceptos presentes en ambos idiomas", () => {
  const pairs = buildPair(CONCEPTS, ES, FR);
  assert.equal(pairs.length, 1);
  assert.deepEqual(pairs[0], {
    concept: "c:saludos.hola", domain: "saludos", icon: "👋",
    gloss_es: "saludo", src: "hola", tgt: "salut",
    srcTranslit: "", tgtTranslit: "", srcIpa: "", tgtIpa: "",
  });
});

test("domainsOf y filterByDomain", () => {
  const pairs = buildPair(CONCEPTS, ES, ES);
  assert.deepEqual(domainsOf(pairs), ["numeros", "saludos"]);
  assert.equal(filterByDomain(pairs, "saludos").length, 1);
  assert.equal(filterByDomain(pairs, null).length, 2);
});

test("termsForConcept devuelve el término por idioma", () => {
  const termsByLang = { es: ES, fr: FR };
  const out = termsForConcept("c:saludos.hola", termsByLang);
  assert.equal(out.es.term, "hola");
  assert.equal(out.fr.term, "salut");
});
```

- [ ] **Step 2: Ejecutar el test y ver que falla**

Run: `node --test js/tests`
Expected: FAIL (no existe `../pairs.js`).

- [ ] **Step 3: Implementar `js/pairs.js`**

```js
// js/pairs.js
import { uniqSorted } from "./util.js";

export function indexTerms(terms) {
  const map = new Map();
  for (const t of terms) {
    if (!map.has(t.concept)) map.set(t.concept, []);
    map.get(t.concept).push(t);
  }
  return map;
}

export function pickTerm(list) {
  if (!list || list.length === 0) return null;
  return list.find((t) => t.review === "verified") || list[0];
}

export function buildPair(concepts, srcTerms, tgtTerms) {
  const src = indexTerms(srcTerms);
  const tgt = indexTerms(tgtTerms);
  const out = [];
  for (const c of concepts) {
    const s = pickTerm(src.get(c.id));
    const g = pickTerm(tgt.get(c.id));
    if (!s || !g) continue;
    out.push({
      concept: c.id,
      domain: c.domain,
      icon: c.icon || "",
      gloss_es: c.gloss_es || "",
      src: s.term,
      tgt: g.term,
      srcTranslit: s.translit || "",
      tgtTranslit: g.translit || "",
      srcIpa: s.ipa || "",
      tgtIpa: g.ipa || "",
    });
  }
  return out;
}

export function domainsOf(pairs) {
  return uniqSorted(pairs.map((p) => p.domain).filter(Boolean));
}

export function filterByDomain(pairs, domain) {
  return !domain ? pairs : pairs.filter((p) => p.domain === domain);
}

export function termsForConcept(conceptId, termsByLang) {
  const out = {};
  for (const [lang, list] of Object.entries(termsByLang)) {
    const term = pickTerm(list.filter((t) => t.concept === conceptId));
    if (term) out[lang] = term;
  }
  return out;
}
```

- [ ] **Step 4: Ejecutar el test y ver que pasa**

Run: `node --test js/tests`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/pairs.js js/tests/pairs.test.js
git commit -m "feat(web): any-to-any (indice de terminos y buildPair)"
```

---

### Task 6: Fuente de datos (`data.js`)

**Files:**
- Create: `js/data.js`
- Test: `js/tests/data.test.js`

- [ ] **Step 1: Escribir el test que falla**

```js
// js/tests/data.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { createDataSource } from "../data.js";

function fakeFetch(responses) {
  const calls = [];
  const fn = async (url) => {
    calls.push(url);
    if (!(url in responses)) return { ok: false, status: 404 };
    return { ok: true, status: 200, json: async () => responses[url] };
  };
  fn.calls = calls;
  return fn;
}

test("carga manifest y concepts desde base", async () => {
  const f = fakeFetch({
    "./data/manifest.json": { languages: ["fr"] },
    "./data/concepts.json": [{ id: "c:x" }],
  });
  const ds = createDataSource(".", f);
  assert.deepEqual(await ds.loadManifest(), { languages: ["fr"] });
  assert.deepEqual(await ds.loadConcepts(), [{ id: "c:x" }]);
});

test("cachea: no repite fetch del mismo recurso", async () => {
  const f = fakeFetch({ "./data/terms.fr.json": [] });
  const ds = createDataSource(".", f);
  await ds.loadTerms("fr");
  await ds.loadTerms("fr");
  assert.equal(f.calls.filter((u) => u.endsWith("terms.fr.json")).length, 1);
});

test("lanza error si el recurso no existe", async () => {
  const f = fakeFetch({});
  const ds = createDataSource(".", f);
  await assert.rejects(() => ds.loadTerms("xx"), /HTTP 404/);
});
```

- [ ] **Step 2: Ejecutar el test y ver que falla**

Run: `node --test js/tests`
Expected: FAIL (no existe `../data.js`).

- [ ] **Step 3: Implementar `js/data.js`**

```js
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
```

- [ ] **Step 4: Ejecutar el test y ver que pasa**

Run: `node --test js/tests`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/data.js js/tests/data.test.js
git commit -m "feat(web): fuente de datos con cache"
```

---

### Task 7: Shell HTML + tema CSS + helpers de vista

**Files:**
- Create: `index.html`
- Create: `app.css`
- Create: `js/views/common.js`
- Test: `js/tests/views-common.test.js`

- [ ] **Step 1: Escribir el test que falla**

```js
// js/tests/views-common.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { page, optionList } from "../views/common.js";

test("page envuelve el contenido con un título y escapa", () => {
  const html = page("<b>Hola</b>", "<p>cuerpo</p>");
  assert.match(html, /<h1[^>]*>&lt;b&gt;Hola&lt;\/b&gt;<\/h1>/);
  assert.match(html, /<p>cuerpo<\/p>/);
});

test("optionList marca la opción seleccionada", () => {
  const html = optionList(["es", "fr"], "fr");
  assert.match(html, /<option value="fr" selected>fr<\/option>/);
  assert.match(html, /<option value="es">es<\/option>/);
});
```

- [ ] **Step 2: Ejecutar el test y ver que falla**

Run: `node --test js/tests`
Expected: FAIL (no existe `../views/common.js`).

- [ ] **Step 3: Implementar `js/views/common.js`**

```js
// js/views/common.js
import { esc } from "../util.js";

export function page(title, inner) {
  return `<section class="page"><h1 class="page-title">${esc(title)}</h1>${inner}</section>`;
}

export function optionList(values, selected, labelFn = (v) => v) {
  return values
    .map((v) => {
      const sel = v === selected ? " selected" : "";
      return `<option value="${esc(v)}"${sel}>${esc(labelFn(v))}</option>`;
    })
    .join("");
}

export function pairSelector({ t, langs, src, tgt, extra = "" }) {
  return `
    <div class="pair-selector">
      <label>${esc(t("common.selectSource"))}
        <select id="srcLang">${optionList(langs, src)}</select>
      </label>
      <label>${esc(t("common.selectTarget"))}
        <select id="tgtLang">${optionList(langs, tgt)}</select>
      </label>
      ${extra}
    </div>`;
}
```

- [ ] **Step 4: Crear `index.html`**

```html
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>naira·lingua</title>
  <meta name="description" content="Aprende cualquier idioma desde y hacia cualquier otro. Gratis y abierto.">
  <meta name="theme-color" content="#faf6ee">
  <link rel="manifest" href="manifest.webmanifest">
  <link rel="icon" href="assets/icons/icon.svg" type="image/svg+xml">
  <link rel="stylesheet" href="app.css">
</head>
<body>
  <header class="topbar">
    <a class="brand" href="#/">naira<span>·</span>lingua</a>
    <nav class="nav" id="nav" aria-label="Principal"></nav>
    <select id="uiLang" class="ui-lang" aria-label="Interface language"></select>
  </header>
  <main id="app" class="app" aria-live="polite"></main>
  <footer class="footer">
    <div id="donate-slot" hidden></div>
    <div id="ads-slot" hidden></div>
    <p>Código MIT · Contenido CC-BY-SA · Un proyecto de Naira</p>
  </footer>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 5: Crear `app.css`** (tema editorial/cuaderno + modo oscuro)

```css
:root{
  --bg:#faf6ee; --panel:#fffdf8; --ink:#2e2a22; --muted:#8a7a55;
  --line:#e6ddc8; --accent:#b06a2c; --accent-ink:#fff;
  --radius:10px; --maxw:880px;
}
@media (prefers-color-scheme: dark){
  :root{
    --bg:#14130f; --panel:#1c1a15; --ink:#efe9dc; --muted:#a99b78;
    --line:#312d24; --accent:#e0a45c; --accent-ink:#14130f;
  }
}
*{box-sizing:border-box}
body{margin:0;background:var(--bg);color:var(--ink);
  font:16px/1.6 system-ui,Segoe UI,Roboto,sans-serif}
h1,h2,h3{font-family:Georgia,'Times New Roman',serif;line-height:1.25}
a{color:var(--accent)}
.topbar{display:flex;gap:16px;align-items:center;padding:12px 20px;
  border-bottom:1px solid var(--line);flex-wrap:wrap}
.brand{font:600 20px Georgia,serif;text-decoration:none;color:var(--ink)}
.brand span{color:var(--accent)}
.nav{display:flex;gap:14px;flex:1;flex-wrap:wrap}
.nav a{text-decoration:none;color:var(--ink);padding:4px 2px;border-bottom:2px solid transparent}
.nav a[aria-current="page"]{border-color:var(--accent);color:var(--accent)}
.ui-lang{margin-left:auto;padding:6px 8px;border:1px solid var(--line);
  border-radius:8px;background:var(--panel);color:var(--ink)}
.app{max-width:var(--maxw);margin:0 auto;padding:24px 20px}
.page-title{margin:.2em 0 .6em}
.footer{max-width:var(--maxw);margin:40px auto 20px;padding:16px 20px;
  border-top:1px solid var(--line);color:var(--muted);font-size:14px}
.card{background:var(--panel);border:1px solid var(--line);border-radius:var(--radius);padding:22px}
.flashcard{min-height:200px;display:flex;flex-direction:column;align-items:center;
  justify-content:center;gap:8px;text-align:center;cursor:pointer}
.flashcard .term{font:600 34px Georgia,serif}
.flashcard .sub{color:var(--muted)}
.btn{border:1px solid var(--line);background:var(--panel);color:var(--ink);
  border-radius:999px;padding:8px 18px;cursor:pointer;font:600 15px system-ui}
.btn.primary{background:var(--accent);border-color:var(--accent);color:var(--accent-ink)}
.btn:focus-visible,.flashcard:focus-visible,.nav a:focus-visible{outline:3px solid var(--accent);outline-offset:2px}
.row{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-top:14px}
.grid{display:grid;gap:14px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr))}
.muted{color:var(--muted)}
.ok{color:#2e7d32}.bad{color:#c62828}
table{border-collapse:collapse;width:100%;margin-top:8px}
th,td{border:1px solid var(--line);padding:6px 10px;text-align:left}
.pair-selector{display:flex;gap:16px;flex-wrap:wrap;align-items:end}
.pair-selector select{padding:6px 8px;border:1px solid var(--line);border-radius:8px;background:var(--panel);color:var(--ink)}
```

- [ ] **Step 6: Ejecutar el test y ver que pasa**

Run: `node --test js/tests`
Expected: PASS.

- [ ] **Step 7: Commit**

```bash
git add index.html app.css js/views/common.js js/tests/views-common.test.js
git commit -m "feat(web): shell HTML, tema editorial y helpers de vista"
```

---

### Task 8: Portada y selector (`home.js`, `pick.js`)

**Files:**
- Create: `js/views/home.js`
- Create: `js/views/pick.js`
- Test: `js/tests/views-home.test.js`

- [ ] **Step 1: Escribir el test que falla**

```js
// js/tests/views-home.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderHome } from "../views/home.js";
import { renderPick } from "../views/pick.js";
import { t } from "../i18n.js";

const tt = (k) => t("es", k);

test("renderHome incluye el lema y enlaces a los modos", () => {
  const html = renderHome({ t: tt });
  assert.match(html, /Empezar a estudiar/);
  assert.match(html, /#\/pick/);
});

test("renderPick lista idiomas y modos", () => {
  const html = renderPick({
    t: tt, langs: ["es", "fr", "it"], src: "es", tgt: "fr",
    mode: "study", domains: ["saludos", "numeros"], domain: "",
  });
  assert.match(html, /<option value="it">it<\/option>/);
  assert.match(html, /value="quiz"/);
  assert.match(html, /value="saludos"/);
});
```

- [ ] **Step 2: Ejecutar el test y ver que falla**

Run: `node --test js/tests`
Expected: FAIL (no existen las vistas).

- [ ] **Step 3: Implementar `js/views/home.js`**

```js
// js/views/home.js
import { esc } from "../util.js";
import { toHash } from "../router.js";

const MODES = [
  ["study", "nav.study", "🃏"],
  ["quiz", "nav.quiz", "❓"],
  ["lessons", "nav.lessons", "📖"],
  ["dictionary", "nav.dictionary", "🔎"],
  ["progress", "nav.progress", "📈"],
];

export function renderHome({ t }) {
  const cards = MODES.map(([route, key, icon]) => `
    <a class="card mode-card" href="${toHash(route)}">
      <span class="mode-icon" aria-hidden="true">${icon}</span>
      <h3>${esc(t(key))}</h3>
    </a>`).join("");
  return `
    <section class="hero">
      <h1>naira<span>·</span>lingua</h1>
      <p class="lead">${esc(t("home.lead"))}</p>
      <a class="btn primary" href="${toHash("pick")}">${esc(t("home.start"))}</a>
    </section>
    <section class="grid" style="margin-top:28px">${cards}</section>`;
}
```

- [ ] **Step 4: Implementar `js/views/pick.js`**

```js
// js/views/pick.js
import { esc } from "../util.js";
import { page, optionList, pairSelector } from "./common.js";

const MODES = ["study", "quiz", "lessons", "dictionary", "progress"];

export function renderPick({ t, langs, src, tgt, mode, domains, domain }) {
  const modeOpts = optionList(MODES, mode, (m) => t(`nav.${m}`));
  const domainOpts =
    `<option value="">${esc(t("common.all"))}</option>` +
    optionList(domains, domain);
  const extra = `
    <label>${esc(t("pick.mode"))}
      <select id="mode">${modeOpts}</select>
    </label>
    <label>${esc(t("pick.domain"))}
      <select id="domain">${domainOpts}</select>
    </label>`;
  return page(t("pick.title"),
    pairSelector({ t, langs, src, tgt, extra }) +
    `<div class="row"><button class="btn primary" id="pickGo">${esc(t("pick.go"))}</button></div>`);
}
```

- [ ] **Step 5: Ejecutar el test y ver que pasa**

Run: `node --test js/tests`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add js/views/home.js js/views/pick.js js/tests/views-home.test.js
git commit -m "feat(web): portada y selector de par/modo"
```

---

### Task 9: Flashcards (`study.js`)

**Files:**
- Create: `js/views/study.js`
- Test: `js/tests/views-study.test.js`

- [ ] **Step 1: Escribir el test que falla**

```js
// js/tests/views-study.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderStudy } from "../views/study.js";
import { t } from "../i18n.js";
const tt = (k) => t("es", k);

const PAIRS = [
  { concept: "c:saludos.hola", domain: "saludos", src: "hola", tgt: "bonjour", tgtTranslit: "", tgtIpa: "bɔ̃.ʒuʁ" },
];

test("renderStudy muestra el término origen y oculta la respuesta", () => {
  const html = renderStudy({ t: tt, pairs: PAIRS, i: 0, flipped: false });
  assert.match(html, /hola/);
  assert.doesNotMatch(html, /bonjour/);
});

test("renderStudy al voltear muestra el destino y botones", () => {
  const html = renderStudy({ t: tt, pairs: PAIRS, i: 0, flipped: true });
  assert.match(html, /bonjour/);
  assert.match(html, /Ya la sabía/);
  assert.match(html, /Repasar/);
});

test("renderStudy avisa si no hay tarjetas", () => {
  const html = renderStudy({ t: tt, pairs: [], i: 0, flipped: false });
  assert.match(html, /No hay tarjetas/);
});
```

- [ ] **Step 2: Ejecutar el test y ver que falla**

Run: `node --test js/tests`
Expected: FAIL.

- [ ] **Step 3: Implementar `js/views/study.js`**

```js
// js/views/study.js
import { esc } from "../util.js";
import { page } from "./common.js";
import { toHash } from "../router.js";

export function renderStudy({ t, pairs, i, flipped }) {
  if (!pairs || pairs.length === 0) {
    return page(t("study.title"),
      `<p class="muted">${esc(t("study.empty"))}</p>` +
      `<a class="btn" href="${toHash("pick")}">${esc(t("pick.title"))}</a>`);
  }
  const card = pairs[i];
  const front = `
    <div class="term">${esc(card.src)}</div>
    ${card.srcIpa ? `<div class="sub">${esc(card.srcIpa)}</div>` : ""}
    <div class="sub">${esc(card.icon)} ${esc(card.domain)}</div>`;
  const back = `
    <div class="term">${esc(card.tgt)}</div>
    ${card.tgtIpa ? `<div class="sub">${esc(card.tgtIpa)}</div>` : ""}
    ${card.tgtTranslit ? `<div class="sub">${esc(card.tgtTranslit)}</div>` : ""}`;
  const actions = flipped
    ? `<div class="row">
         <button class="btn" id="review">${esc(t("study.review"))}</button>
         <button class="btn primary" id="knew">${esc(t("study.knew"))}</button>
       </div>`
    : `<p class="muted">${esc(t("study.flip"))}</p>`;
  return page(t("study.title"), `
    <p class="muted">${i + 1} / ${pairs.length}</p>
    <div class="card flashcard" id="card" tabindex="0" role="button"
         aria-pressed="${flipped ? "true" : "false"}">
      ${flipped ? back : front}
    </div>
    ${actions}`);
}

export function mountStudy(root, { pairs, i, store, src, tgt, t, go }) {
  let idx = i;
  let flipped = false;
  let list = pairs;

  function draw() {
    root.innerHTML = renderStudy({ t, pairs: list, i: idx, flipped });
    const card = root.querySelector("#card");
    card?.addEventListener("click", flip);
    card?.addEventListener("keydown", (e) => {
      if (e.key === " " || e.key === "Enter") { e.preventDefault(); flip(); }
    });
    root.querySelector("#knew")?.addEventListener("click", () => decide("known"));
    root.querySelector("#review")?.addEventListener("click", () => decide("review"));
  }

  function flip() { flipped = !flipped; draw(); }

  function decide(kind) {
    const card = list[idx];
    if (kind === "known") store.markKnown(src, tgt, card.concept);
    else store.markReview(src, tgt, card.concept);
    flipped = false;
    idx += 1;
    if (idx >= list.length) {
      root.innerHTML = page(t("study.title"),
        `<p class="term">${esc(t("study.done"))}</p>` +
        `<div class="row"><button class="btn primary" id="again">${esc(t("study.restart"))}</button></div>`);
      root.querySelector("#again")?.addEventListener("click", () => { idx = 0; draw(); });
      return;
    }
    draw();
  }

  draw();
  return { get index() { return idx; } };
}
```

- [ ] **Step 4: Ejecutar el test y ver que pasa**

Run: `node --test js/tests`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/views/study.js js/tests/views-study.test.js
git commit -m "feat(web): vista de flashcards"
```

---

### Task 10: Quiz (`quiz.js`)

**Files:**
- Create: `js/views/quiz.js`
- Test: `js/tests/views-quiz.test.js`

- [ ] **Step 1: Escribir el test que falla**

```js
// js/tests/views-quiz.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderQuiz, buildQuestions } from "../views/quiz.js";
import { t } from "../i18n.js";
const tt = (k) => t("es", k);

const PAIRS = [
  { concept: "a", domain: "saludos", src: "hola", tgt: "bonjour" },
  { concept: "b", domain: "saludos", src: "gracias", tgt: "merci" },
  { concept: "c", domain: "numeros", src: "uno", tgt: "un" },
];

test("buildQuestions usa el mismo dominio para los distractores", () => {
  const qs = buildQuestions(PAIRS, () => 0.5);
  assert.equal(qs.length, 3);
  const q = qs[0];
  assert.equal(q.answer, "bonjour");
  assert.ok(q.options.includes("bonjour"));
  assert.equal(q.options.length, 2); // solo otro concepto del dominio 'saludos'
});

test("renderQuiz muestra pregunta y opciones", () => {
  const q = { prompt: "hola", answer: "bonjour", options: ["bonjour", "merci"] };
  const html = renderQuiz({ t: tt, q, i: 0, total: 3, chosen: null });
  assert.match(html, /hola/);
  assert.match(html, /data-opt="bonjour"/);
});
```

- [ ] **Step 2: Ejecutar el test y ver que falla**

Run: `node --test js/tests`
Expected: FAIL.

- [ ] **Step 3: Implementar `js/views/quiz.js`**

```js
// js/views/quiz.js
import { esc, shuffle } from "../util.js";
import { page } from "./common.js";
import { toHash } from "../router.js";

export function buildQuestions(pairs, rng = Math.random) {
  return pairs.map((p) => {
    const sameDomain = pairs
      .filter((o) => o.concept !== p.concept && o.domain === p.domain)
      .map((o) => o.tgt);
    const distractors = shuffle([...new Set(sameDomain)], rng).slice(0, 3);
    const options = shuffle([p.tgt, ...distractors], rng);
    return { concept: p.concept, prompt: p.src, answer: p.tgt, options };
  });
}

export function renderQuiz({ t, q, i, total, chosen }) {
  const opts = q.options.map((o) => {
    let cls = "btn option";
    if (chosen) {
      if (o === q.answer) cls += " correct";
    }
    const state = chosen ? ` data-chosen="${chosen === o ? "1" : "0"}"` : "";
    return `<button class="${cls}" data-opt="${esc(o)}"${state}
      ${chosen ? "disabled" : ""}>${esc(o)}</button>`;
  }).join("");
  const feedback = chosen
    ? `<p class="${chosen === q.answer ? "ok" : "bad"}" aria-live="polite">
         ${esc(chosen === q.answer ? t("quiz.correct") : t("quiz.wrong"))}
       </p>
       <div class="row"><button class="btn primary" id="next">
         ${esc(i + 1 >= total ? t("quiz.finish") : t("quiz.next"))}
       </button></div>`
    : "";
  return page(t("quiz.title"), `
    <p class="muted">${i + 1} / ${total}</p>
    <p>${esc(t("quiz.question"))}</p>
    <div class="card flashcard"><div class="term">${esc(q.prompt)}</div></div>
    <div class="row" id="options">${opts}</div>
    ${feedback}`);
}

export function mountQuiz(root, { pairs, store, src, tgt, t, onDone }) {
  const questions = buildQuestions(pairs);
  let i = 0, chosen = null, score = 0;

  function draw() {
    root.innerHTML = renderQuiz({ t, q: questions[i], i, total: questions.length, chosen });
    root.querySelectorAll(".option").forEach((btn) => {
      btn.addEventListener("click", () => choose(btn.dataset.opt));
    });
    root.querySelector("#next")?.addEventListener("click", next);
  }

  function choose(opt) {
    if (chosen) return;
    chosen = opt;
    const ok = opt === questions[i].answer;
    if (ok) score += 1;
    store.recordQuiz(src, tgt, ok);
    draw();
  }

  function next() {
    if (i + 1 >= questions.length) {
      root.innerHTML = page(t("quiz.title"), `
        <p class="term">${esc(t("quiz.score"))}: ${score} / ${questions.length}</p>
        <div class="row"><a class="btn" href="${toHash("quiz")}">${esc(t("quiz.again"))}</a></div>`);
      onDone?.({ score, total: questions.length });
      return;
    }
    i += 1; chosen = null; draw();
  }

  draw();
}
```

- [ ] **Step 4: Ejecutar el test y ver que pasa**

Run: `node --test js/tests`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/views/quiz.js js/tests/views-quiz.test.js
git commit -m "feat(web): vista de quiz"
```

---

### Task 11: Lecciones (`lessons.js`)

**Files:**
- Create: `js/views/lessons.js`
- Test: `js/tests/views-lessons.test.js`

- [ ] **Step 1: Escribir el test que falla**

```js
// js/tests/views-lessons.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderLessonList, renderLesson } from "../views/lessons.js";
import { t } from "../i18n.js";
const tt = (k) => t("es", k);

const LESSON = {
  id: "fr-u1-l1", lang: "fr", unit: 1, lesson: 1,
  title: { fr: "Salutations", es: "Saludos" },
  dialogue: [{ speaker: "A", fr: "Bonjour !", es: "¡Hola!" }],
  explanation: { es: "Texto **markdown**" },
  tables: [{ type: "verb", title: "être", columns: ["persona", "presente"],
             rows: [["je", "suis"]] }],
};

test("renderLessonList enlaza cada lección", () => {
  const html = renderLessonList({ t: tt, lessons: [LESSON], uiLang: "es" });
  assert.match(html, /Saludos/);
  assert.match(html, /#\/lessons\/fr-u1-l1/);
});

test("renderLesson muestra diálogo y tabla", () => {
  const html = renderLesson({ t: tt, lesson: LESSON, uiLang: "es", srcLang: "es" });
  assert.match(html, /Bonjour !/);
  assert.match(html, /¡Hola!/);
  assert.match(html, /<td>je<\/td>/);
});

test("renderLessonList avisa si está vacío", () => {
  const html = renderLessonList({ t: tt, lessons: [], uiLang: "es" });
  assert.match(html, /no hay lecciones/i);
});
```

- [ ] **Step 2: Ejecutar el test y ver que falla**

Run: `node --test js/tests`
Expected: FAIL.

- [ ] **Step 3: Implementar `js/views/lessons.js`**

```js
// js/views/lessons.js
import { esc } from "../util.js";
import { page } from "./common.js";
import { toHash } from "../router.js";

function textFor(map, lang, fallback = "es") {
  if (!map) return "";
  return map[lang] ?? map[fallback] ?? Object.values(map)[0] ?? "";
}

export function renderLessonList({ t, lessons, uiLang }) {
  if (!lessons || lessons.length === 0) {
    return page(t("lessons.title"), `<p class="muted">${esc(t("lessons.empty"))}</p>`);
  }
  const items = lessons.map((l) => `
    <a class="card" href="${toHash("lessons", l.id)}">
      <h3>U${esc(l.unit)} · L${esc(l.lesson)} — ${esc(textFor(l.title, uiLang))}</h3>
    </a>`).join("");
  return page(t("lessons.title"), `<div class="grid">${items}</div>`);
}

export function renderLesson({ t, lesson, uiLang, srcLang }) {
  const title = textFor(lesson.title, uiLang);
  const dialogue = (lesson.dialogue || []).map((line) => `
    <p><strong>${esc(line.speaker)}:</strong>
      <span lang="${esc(lesson.lang)}">${esc(line[lesson.lang] ?? "")}</span>
      <br><span class="muted" lang="${esc(srcLang)}">${esc(line[srcLang] ?? line.es ?? "")}</span>
    </p>`).join("");
  const explanation = textFor(lesson.explanation, uiLang);
  const tables = (lesson.tables || []).map((tb) => `
    <h4>${esc(tb.title)} <span class="muted">(${esc(tb.type)})</span></h4>
    <table><thead><tr>${(tb.columns || []).map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>
      <tbody>${(tb.rows || []).map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>`).join("");
  return page(esc(`U${lesson.unit} · L${lesson.lesson} — ${title}`), `
    <a class="muted" href="${toHash("lessons")}">← ${esc(t("lessons.back"))}</a>
    <h2>${esc(t("lessons.dialogue"))}</h2>${dialogue}
    <h2>${esc(t("lessons.explanation"))}</h2><p>${esc(explanation)}</p>
    <h2>${esc(t("lessons.tables"))}</h2>${tables}`);
}
```

- [ ] **Step 4: Ejecutar el test y ver que pasa**

Run: `node --test js/tests`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/views/lessons.js js/tests/views-lessons.test.js
git commit -m "feat(web): vista de lecciones (dialogo, explicacion, tablas)"
```

---

### Task 12: Diccionario (`dictionary.js`)

**Files:**
- Create: `js/views/dictionary.js`
- Test: `js/tests/views-dictionary.test.js`

- [ ] **Step 1: Escribir el test que falla**

```js
// js/tests/views-dictionary.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderDictionary } from "../views/dictionary.js";
import { t } from "../i18n.js";
const tt = (k) => t("es", k);

const CONCEPTS = [
  { id: "c:saludos.hola", domain: "saludos", gloss_es: "saludo al encontrarse" },
  { id: "c:numeros.uno", domain: "numeros", gloss_es: "el número uno" },
];
const BY_LANG = {
  es: [{ concept: "c:saludos.hola", lang: "es", term: "hola", review: "verified" }],
  fr: [{ concept: "c:saludos.hola", lang: "fr", term: "bonjour", review: "verified" }],
};

test("renderDictionary filtra por consulta", () => {
  const html = renderDictionary({ t: tt, concepts: CONCEPTS, byLang: BY_LANG, query: "hola" });
  assert.match(html, /c:saludos.hola|Todos los idiomas|bonjour/);
  assert.match(html, /bonjour/);
  assert.doesNotMatch(html, /el número uno/);
});

test("renderDictionary muestra el término en varios idiomas", () => {
  const html = renderDictionary({ t: tt, concepts: CONCEPTS, byLang: BY_LANG,
    query: "", domain: "saludos" });
  assert.match(html, /hola/);
  assert.match(html, /bonjour/);
  assert.doesNotMatch(html, /el número uno/);
});
```

- [ ] **Step 2: Ejecutar el test y ver que falla**

Run: `node --test js/tests`
Expected: FAIL.

- [ ] **Step 3: Implementar `js/views/dictionary.js`**

```js
// js/views/dictionary.js
import { esc } from "../util.js";
import { page, optionList } from "./common.js";
import { pickTerm, domainsOf } from "../pairs.js";

function matches(c, q) {
  if (!q) return true;
  const s = q.toLowerCase();
  const inGloss = (c.gloss_es || "").toLowerCase().includes(s);
  const inTerms = Object.values(c._terms || {})
    .some((t) => t.term.toLowerCase().includes(s));
  return inGloss || inTerms;
}

export function renderDictionary({ t, concepts, byLang, query = "", domain = "" }) {
  const enriched = concepts.map((c) => {
    const terms = {};
    for (const [lang, list] of Object.entries(byLang)) {
      const term = pickTerm(list.filter((x) => x.concept === c.id));
      if (term) terms[lang] = term;
    }
    return { ...c, _terms: terms };
  });
  const domains = domainsOf(concepts.map((c) => ({ domain: c.domain })));
  const filtered = enriched
    .filter((c) => (!domain || c.domain === domain) && matches(c, query))
    .slice(0, 100);

  const rows = filtered.map((c) => {
    const langs = Object.entries(c._terms)
      .map(([lg, tm]) => `<li><span class="muted">${esc(lg)}</span> ${esc(tm.term)}</li>`)
      .join("");
    return `<div class="card">
      <div class="muted">${esc(c.domain)} · ${esc(c.id)}</div>
      <p>${esc(c.gloss_es)}</p>
      <ul>${langs}</ul>
    </div>`;
  }).join("");

  const body = filtered.length
    ? `<div class="grid">${rows}</div>`
    : `<p class="muted">${esc(t("dictionary.empty"))}</p>`;

  return page(t("dictionary.title"), `
    <div class="row">
      <input id="q" class="btn" type="search" placeholder="${esc(t("dictionary.placeholder"))}"
             value="${esc(query)}" aria-label="${esc(t("dictionary.placeholder"))}">
      <select id="domain" aria-label="${esc(t("common.all"))}">
        <option value="">${esc(t("common.all"))}</option>${optionList(domains, domain)}
      </select>
    </div>${body}`);
}

export function mountDictionary(root, { concepts, data, langs, t }) {
  const state = { query: "", domain: "" };
  const byLang = {};
  let pending = langs.length;

  async function loadAll() {
    await Promise.all(langs.map(async (lg) => {
      try { byLang[lg] = await data.loadTerms(lg); } catch (_) { byLang[lg] = []; }
      pending -= 1;
    }));
    draw();
  }

  function draw() {
    root.innerHTML = renderDictionary({ t, concepts, byLang, ...state });
    const q = root.querySelector("#q");
    q?.addEventListener("input", () => { state.query = q.value; draw(); q.focus(); });
    const d = root.querySelector("#domain");
    d?.addEventListener("change", () => { state.domain = d.value; draw(); });
  }

  root.innerHTML = page(t("dictionary.title"), `<p class="muted">${esc(t("common.loading"))}</p>`);
  loadAll();
}
```

- [ ] **Step 4: Ejecutar el test y ver que pasa**

Run: `node --test js/tests`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/views/dictionary.js js/tests/views-dictionary.test.js
git commit -m "feat(web): diccionario navegable multi-idioma"
```

---

### Task 13: Progreso (`progress.js`)

**Files:**
- Create: `js/views/progress.js`
- Test: `js/tests/views-progress.test.js`

- [ ] **Step 1: Escribir el test que falla**

```js
// node --test js/tests
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderProgress } from "../views/progress.js";
import { t } from "../i18n.js";
const tt = (k) => t("es", k);

test("renderProgress muestra contadores y botón de reinicio", () => {
  const html = renderProgress({ t: tt, src: "es", tgt: "fr",
    pair: { known: ["a", "b"], review: ["c"], correct: 5, wrong: 2 } });
  assert.match(html, /Aprendidas<\/dt><dd>2<\/dd>/);
  assert.match(html, /Por repasar<\/dt><dd>1<\/dd>/);
  assert.match(html, /id="reset"/);
});

test("renderProgress funciona sin datos previos", () => {
  const html = renderProgress({ t: tt, src: "es", tgt: "fr", pair: null });
  assert.match(html, /Aprendidas<\/dt><dd>0<\/dd>/);
});
```

- [ ] **Step 2: Ejecutar el test y ver que falla**

Run: `node --test js/tests`
Expected: FAIL.

- [ ] **Step 3: Implementar `js/views/progress.js`**

```js
// js/views/progress.js
import { esc } from "../util.js";
import { page } from "./common.js";

export function renderProgress({ t, src, tgt, pair }) {
  const p = pair || { known: [], review: [], correct: 0, wrong: 0 };
  return page(t("progress.title"), `
    <p class="muted">${esc(src)} → ${esc(tgt)}</p>
    <dl>
      <dt>${esc(t("progress.known"))}</dt><dd>${p.known.length}</dd>
      <dt>${esc(t("progress.review"))}</dt><dd>${p.review.length}</dd>
      <dt>${esc(t("progress.correct"))}</dt>
      <dd>${p.correct} / ${p.correct + p.wrong}</dd>
    </dl>
    <button class="btn" id="reset">${esc(t("progress.reset"))}</button>`);
}

export function mountProgress(root, { src, tgt, store, t }) {
  function draw() {
    root.innerHTML = renderProgress({ t, src, tgt, pair: store.getPair(src, tgt) });
    root.querySelector("#reset")?.addEventListener("click", () => {
      if (globalThis.confirm(t("progress.resetConfirm"))) {
        store.resetPair(src, tgt);
        draw();
      }
    });
  }
  draw();
}
```

- [ ] **Step 4: Ejecutar el test y ver que pasa**

Run: `node --test js/tests`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add js/views/progress.js js/tests/views-progress.test.js
git commit -m "feat(web): vista de progreso"
```

---

### Task 14: Orquestación (`main.js`)

**Files:**
- Create: `js/main.js`

- [ ] **Step 1: Implementar `js/main.js`**

```js
// js/main.js
import { availableLangs, normalizeLang, t as tRaw } from "./i18n.js";
import { createStore, defaultStorage } from "./store.js";
import { createDataSource } from "./data.js";
import { parseHash, toHash } from "./router.js";
import { buildPair, filterByDomain, domainsOf } from "./pairs.js";
import { renderHome } from "./views/home.js";
import { renderPick } from "./views/pick.js";
import { mountStudy, renderStudy } from "./views/study.js";
import { mountQuiz } from "./views/quiz.js";
import { renderLessonList, renderLesson } from "./views/lessons.js";
import { mountDictionary } from "./views/dictionary.js";
import { mountProgress } from "./views/progress.js";
import { page } from "./views/common.js";
import { esc } from "./util.js";

const store = createStore(defaultStorage());
const data = createDataSource(".");

const NAV = ["home", "pick", "study", "quiz", "lessons", "dictionary", "progress"];
const MODE_ROUTES = new Set(["study", "quiz", "lessons", "dictionary", "progress"]);

let uiLang = normalizeLang(store.getState().ui.lang || navigator.language);
let manifest = null;
let concepts = null;
const termsCache = new Map(); // lang -> terms[]
const lessonsCache = new Map(); // lang -> lessons[]

const t = (k) => tRaw(uiLang, k);

async function getManifest() {
  if (!manifest) manifest = await data.loadManifest();
  return manifest;
}
async function getConcepts() {
  if (!concepts) concepts = await data.loadConcepts();
  return concepts;
}
async function getTerms(lang) {
  if (!termsCache.has(lang)) termsCache.set(lang, await data.loadTerms(lang));
  return termsCache.get(lang);
}
async function getLessons(lang) {
  if (!lessonsCache.has(lang)) {
    try { lessonsCache.set(lang, await data.loadLessons(lang)); }
    catch (_) { lessonsCache.set(lang, []); }
  }
  return lessonsCache.get(lang);
}

function currentPair() {
  const s = store.getState();
  const langs = manifest?.languages ?? [];
  const src = s.lastPair?.src && langs.includes(s.lastPair.src) ? s.lastPair.src : "es";
  let tgt = s.lastPair?.tgt && langs.includes(s.lastPair.tgt) ? s.lastPair.tgt : "fr";
  if (tgt === src) tgt = langs.find((l) => l !== src) ?? tgt;
  return { src, tgt };
}

function paintNav(active) {
  const nav = document.getElementById("nav");
  nav.innerHTML = NAV.map((name) => {
    const label = name === "pick" ? t("nav.pick") : t(`nav.${name}`);
    const cur = name === active ? ' aria-current="page"' : "";
    return `<a href="${toHash(name)}"${cur}>${esc(label)}</a>`;
  }).join("");
}

function paintUiLang() {
  const sel = document.getElementById("uiLang");
  sel.innerHTML = availableLangs()
    .map((l) => `<option value="${l}"${l === uiLang ? " selected" : ""}>${l.toUpperCase()}</option>`)
    .join("");
}

function errorView(msg) {
  return page(t("common.error"), `<p class="muted">${esc(msg)}</p>`);
}

async function render() {
  const app = document.getElementById("app");
  const route = parseHash(location.hash);
  document.documentElement.lang = uiLang;

  try {
    if (route.name === "home") {
      paintNav("home");
      app.innerHTML = renderHome({ t });
      return;
    }
    await getManifest();
    const langs = manifest.languages;

    if (route.name === "pick") {
      paintNav("pick");
      const { src, tgt } = currentPair();
      const pair = buildPair(await getConcepts(), await getTerms(src), await getTerms(tgt));
      app.innerHTML = renderPick({ t, langs, src, tgt,
        mode: "study", domains: domainsOf(pair), domain: "" });
      wirePick(app);
      return;
    }

    if (route.name === "lessons") {
      paintNav("lessons");
      const { tgt } = currentPair();
      if (route.param) {
        const lessons = await getLessons(tgt);
        const lesson = lessons.find((l) => l.id === route.param);
        if (!lesson) { app.innerHTML = errorView(`No lesson ${route.param}`); return; }
        app.innerHTML = renderLesson({ t, lesson, uiLang, srcLang: "es" });
      } else {
        app.innerHTML = renderLessonList({ t, lessons: await getLessons(tgt), uiLang });
      }
      return;
    }

    if (MODE_ROUTES.has(route.name)) {
      paintNav(route.name);
      const { src, tgt } = currentPair();
      const pair = buildPair(await getConcepts(), await getTerms(src), await getTerms(tgt));

      if (route.name === "study") {
        app.innerHTML = renderStudy({ t, pairs: pair, i: 0, flipped: false });
        mountStudy(app, { pairs: pair, i: 0, store, src, tgt, t });
      } else if (route.name === "quiz") {
        mountQuiz(app, { pairs: pair, store, src, tgt, t });
      } else if (route.name === "dictionary") {
        mountDictionary(app, { concepts: await getConcepts(), data, langs, t });
      } else if (route.name === "progress") {
        mountProgress(app, { src, tgt, store, t });
      }
      return;
    }

    app.innerHTML = errorView(`Ruta desconocida: ${route.name}`);
  } catch (err) {
    app.innerHTML = errorView(String(err));
  }
}

function wirePick(app) {
  app.querySelector("#pickGo")?.addEventListener("click", () => {
    const src = app.querySelector("#srcLang").value;
    const tgt = app.querySelector("#tgtLang").value;
    const mode = app.querySelector("#mode").value;
    const domain = app.querySelector("#domain").value;
    store.setLastPair(src, tgt);
    const target = mode === "dictionary" || mode === "progress" ? mode : mode;
    location.hash = toHash(target) + (domain ? `?domain=${encodeURIComponent(domain)}` : "");
  });
  // Al cambiar de idioma origen/destino, recalcula dominios disponibles.
  for (const id of ["#srcLang", "#tgtLang"]) {
    app.querySelector(id)?.addEventListener("change", async () => {
      const src = app.querySelector("#srcLang").value;
      const tgt = app.querySelector("#tgtLang").value;
      const mode = app.querySelector("#mode").value;
      const domain = app.querySelector("#domain").value;
      const pair = buildPair(await getConcepts(), await getTerms(src), await getTerms(tgt));
      app.innerHTML = renderPick({ t, langs: manifest.languages, src, tgt, mode,
        domains: domainsOf(pair), domain });
      wirePick(app);
    });
  }
}

document.getElementById("uiLang").addEventListener("change", (e) => {
  uiLang = normalizeLang(e.target.value);
  store.setUiLang(uiLang);
  paintUiLang();
  render();
});

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", () => {
  paintUiLang();
  render();
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}
```

- [ ] **Step 2: Verificación manual**

Run:
```powershell
python "F:\TRABAJO\TO WORK ON QUICK\TRABAJO EXTRA\naira-lingua\tools\build.py" "F:\TRABAJO\TO WORK ON QUICK\TRABAJO EXTRA\naira-lingua"
cd "F:\TRABAJO\TO WORK ON QUICK\TRABAJO EXTRA\naira-lingua"
python -m http.server 8080
```
Abre `http://localhost:8080/` y comprueba: portada, selector, flashcards (volteo + botones), quiz, lecciones, diccionario y progreso; cambia el idioma de UI a EN.
Expected: todo navega sin errores en consola y el progreso persiste al recargar.

- [ ] **Step 3: Commit**

```bash
git add js/main.js
git commit -m "feat(web): orquestacion (router, nav, i18n, registro SW)"
```

---

### Task 15: PWA (manifest, service worker, icono)

**Files:**
- Create: `manifest.webmanifest`
- Create: `service-worker.js`
- Create: `assets/icons/icon.svg`

- [ ] **Step 1: Crear `assets/icons/icon.svg`**

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" role="img" aria-label="naira·lingua">
  <rect width="512" height="512" rx="96" fill="#faf6ee"/>
  <text x="50%" y="54%" text-anchor="middle" dominant-baseline="middle"
        font-family="Georgia, serif" font-size="240" fill="#b06a2c">n·l</text>
</svg>
```

- [ ] **Step 2: Crear `manifest.webmanifest`**

```json
{
  "name": "naira·lingua",
  "short_name": "naira·lingua",
  "description": "Aprende cualquier idioma desde y hacia cualquier otro. Gratis y abierto.",
  "start_url": ".",
  "scope": ".",
  "display": "standalone",
  "background_color": "#faf6ee",
  "theme_color": "#b06a2c",
  "lang": "es",
  "icons": [
    { "src": "assets/icons/icon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any maskable" }
  ]
}
```

- [ ] **Step 3: Crear `service-worker.js`**

```js
// service-worker.js
const CACHE = "naira-lingua-v1";
const SHELL = [
  "./", "./index.html", "./app.css", "./manifest.webmanifest",
  "./assets/icons/icon.svg",
  "./js/main.js", "./js/util.js", "./js/i18n.js", "./js/store.js",
  "./js/router.js", "./js/data.js", "./js/pairs.js",
  "./js/views/common.js", "./js/views/home.js", "./js/views/pick.js",
  "./js/views/study.js", "./js/views/quiz.js", "./js/views/lessons.js",
  "./js/views/dictionary.js", "./js/views/progress.js",
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return;
  // Datos del corpus: cache-first con actualización en segundo plano.
  if (url.pathname.includes("/data/")) {
    e.respondWith(
      caches.open(CACHE).then(async (c) => {
        const cached = await c.match(e.request);
        const network = fetch(e.request).then((r) => { if (r.ok) c.put(e.request, r.clone()); return r; }).catch(() => cached);
        return cached || network;
      })
    );
    return;
  }
  // Shell y navegación: cache-first.
  e.respondWith(
    caches.match(e.request).then((r) => r || fetch(e.request).then((res) => {
      if (res.ok) caches.open(CACHE).then((c) => c.put(e.request, res.clone()));
      return res;
    }).catch(() => caches.match("./index.html")))
  );
});
```

- [ ] **Step 4: Verificación manual (offline)**

Run: sirve en `http://localhost:8080/`, abre la app, espera a que cargue, activa "Offline" en DevTools → Network y recarga.
Expected: la app sigue funcionando (shell + datos desde caché) y es instalable (Chrome muestra el icono de instalación).

- [ ] **Step 5: Commit**

```bash
git add manifest.webmanifest service-worker.js assets/icons/icon.svg
git commit -m "feat(web): PWA (manifest, service worker, icono)"
```

---

### Task 16: `build.py` emite lecciones + `data/` al repo

**Files:**
- Modify: `tools/build.py`
- Modify: `.gitignore`
- Test: `tests/test_build_lessons.py`

- [ ] **Step 1: Escribir el test que falla**

```python
# tests/test_build_lessons.py
import json
from tools import build, common


def _corpus_with_lesson(tmp_path):
    (tmp_path / "corpus" / "languages" / "fr" / "lessons").mkdir(parents=True)
    common.write_jsonl(tmp_path / "corpus" / "concepts.jsonl",
                       [{"id": "c:x", "domain": "saludos", "gloss_es": "x"}])
    common.write_jsonl(tmp_path / "corpus" / "languages" / "fr" / "terms.jsonl",
                       [{"concept": "c:x", "lang": "fr", "term": "a",
                         "source": "t", "license": "CC-BY-SA-4.0",
                         "review": "verified"}])
    lesson = {"id": "fr-u1-l1", "lang": "fr", "unit": 1, "lesson": 1,
              "title": {"fr": "S"}, "dialogue": [], "tables": []}
    common.write_json(tmp_path / "corpus" / "languages" / "fr"
                      / "lessons" / "u1-l1.json", lesson)
    return lesson


def test_build_emits_lessons_per_language(tmp_path):
    lesson = _corpus_with_lesson(tmp_path)
    build.run(tmp_path)

    out = json.loads((tmp_path / "data" / "lessons.fr.json").read_text(encoding="utf-8"))
    assert out == [lesson]
    manifest = json.loads((tmp_path / "data" / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["lessons"]["fr"] == 1
```

- [ ] **Step 2: Ejecutar el test y ver que falla**

Run: `$env:PYTHONPATH="F:\TRABAJO\TO WORK ON QUICK\TRABAJO EXTRA\naira-lingua"; python -m pytest tests/test_build_lessons.py -q`
Expected: FAIL (`data/lessons.fr.json` no existe / `manifest["lessons"]` ausente).

- [ ] **Step 3: Modificar `tools/build.py`** para emitir lecciones

Sustituye `tools/build.py` por:

```python
"""Compila el corpus a un dataset plano para la web."""
from __future__ import annotations
import datetime, sys
from pathlib import Path
from . import common


def run(repo_dir) -> None:
    repo = Path(repo_dir)
    concepts = common.read_jsonl(repo / "corpus" / "concepts.jsonl")
    langs, counts, lesson_counts = [], {}, {}
    for lang_dir in sorted(p for p in (repo / "corpus" / "languages").iterdir()
                           if p.is_dir()):
        terms = common.read_jsonl(lang_dir / "terms.jsonl")
        common.write_json(repo / "data" / f"terms.{lang_dir.name}.json", terms)
        lessons = []
        lesson_dir = lang_dir / "lessons"
        if lesson_dir.exists():
            for fp in sorted(lesson_dir.glob("*.json")):
                lessons.append(common.read_json(fp, default={}))
        common.write_json(repo / "data" / f"lessons.{lang_dir.name}.json", lessons)
        langs.append(lang_dir.name)
        counts[lang_dir.name] = len(terms)
        lesson_counts[lang_dir.name] = len(lessons)
    manifest = {"generated": datetime.datetime.now(datetime.UTC).isoformat(),
                "concepts": len(concepts), "languages": langs, "counts": counts,
                "lessons": lesson_counts}
    common.write_json(repo / "data" / "manifest.json", manifest)
    common.write_json(repo / "data" / "concepts.json", concepts)
    print(f"build ok: {len(concepts)} conceptos, idiomas={langs}")


if __name__ == "__main__":
    run(sys.argv[1] if len(sys.argv) > 1 else ".")
```

- [ ] **Step 4: Ejecutar el test y ver que pasa**

Run: `$env:PYTHONPATH="F:\TRABAJO\TO WORK ON QUICK\TRABAJO EXTRA\naira-lingua"; python -m pytest tests/test_build_lessons.py -q`
Expected: PASS.

- [ ] **Step 5: Regenerar `data/` y dejar de ignorarlo**

```bash
cd "F:\TRABAJO\TO WORK ON QUICK\TRABAJO EXTRA\naira-lingua"
python tools\build.py .
```

En `.gitignore`, elimina la línea `data/` (pasa a versionarse). Añade al fichero de tests la comprobación de que `check_all.py` sigue en verde:

Run: `$env:PYTHONPATH="F:\TRABAJO\TO WORK ON QUICK\TRABAJO EXTRA\naira-lingua"; python -m pytest tests -q; python tools\check_all.py .`
Expected: PASS + `check_all` OK.

- [ ] **Step 6: Commit**

```bash
git add tools/build.py tests/test_build_lessons.py .gitignore data
git commit -m "feat(build): emitir lecciones y versionar data/ para Pages"
```

---

### Task 17: README y verificación final

**Files:**
- Create: `webapp/README.md` *(si no existe; si prefieres, añade la sección al README raíz del repo)*

- [ ] **Step 1: Documentar cómo ejecutar y publicar**

Añade un README con: qué es, cómo servirlo en local (`python tools\build.py .` + `python -m http.server 8080`), cómo correr los tests (`node --test js/tests` y `pytest tests`), y cómo se publica en GitHub Pages (rama `main`, raíz; `data/` versionado).

- [ ] **Step 2: Verificación end-to-end (criterios de aceptación)**

Comprueba y anota el resultado de cada criterio del spec §13:
- La app carga y lista los idiomas de `data/manifest.json`.
- Se puede estudiar cualquier par presente (fr→it, it→hi) sin ficheros por par.
- Flashcards, quiz, lecciones, diccionario y progreso funcionan; el progreso persiste.
- La UI cambia es↔en.
- Tras la primera visita abre sin conexión y es instalable.
- `node --test js/tests` y `pytest tests` pasan; `check_all.py` en verde.

- [ ] **Step 3: Commit**

```bash
git add README.md
git commit -m "docs(web): README de uso, tests y despliegue"
```

---

## Notas de ejecución

- **Orden de dependencias:** Tasks 1–6 son lógica pura (TDD, sin DOM) y no dependen de nada. Task 7 aporta el shell; Tasks 8–13 dependen de 1–7. Task 14 une todo; 15 añade PWA; 16 ajusta el builder; 17 cierra.
- **Ejecuta `node --test js/tests` tras cada tarea de JS** y `pytest tests -q` tras tocar Python.
- **No fabricar contenido:** este plan no añade corpus; solo consume el existente. Las lecciones fr/it de muestra (`u1-l1`) ya están en `corpus/`.
- **Commits**: un commit por tarea, mensajes estilo `feat(web): …`.
- **`data/` versionado** es requisito de Pages; si en el futuro se añade una Action, esta regenerará `data/` de forma determinista.
