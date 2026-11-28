// js/main.js
import { availableLangs, normalizeLang, t as tRaw } from "./i18n.js";
import { langLabel, isRtl } from "./langs.js";
import { createStore, defaultStorage } from "./store.js";
import { createDataSource } from "./data.js";
import { parseHash, toHash } from "./router.js";
import { buildPair, filterByDomain, domainsOf } from "./pairs.js";
import { renderHome } from "./views/home.js";
import { renderPick } from "./views/pick.js";
import { mountStudy, renderStudy } from "./views/study.js";
import { mountQuiz } from "./views/quiz.js";
import { renderLessonList, renderLesson } from "./views/lessons.js";
import { renderAlphabetList, renderAlphabet, mountAlphabet } from "./views/alphabet.js";
import { mountDictionary } from "./views/dictionary.js";
import { mountProgress } from "./views/progress.js";
import { page } from "./views/common.js";
import { esc } from "./util.js";

const store = createStore(defaultStorage());
const data = createDataSource(".");

const NAV = ["home", "pick", "study", "quiz", "lessons", "alphabet", "dictionary", "progress"];
const MODE_ROUTES = new Set(["study", "quiz", "lessons", "dictionary", "progress"]);

let uiLang = normalizeLang(store.getState().ui.lang || navigator.language);
let manifest = null;
let concepts = null;
let alphabets = null;
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
async function getAlphabets() {
  if (!alphabets) {
    try { alphabets = await data.loadAlphabets(); }
    catch (_) { alphabets = {}; }
  }
  return alphabets;
}

function currentPair() {
  const s = store.getState();
  const langs = manifest?.languages ?? [];
  // Los idiomas válidos son los del manifiesto compilado.
  const src = s.lastPair?.src && langs.includes(s.lastPair.src) ? s.lastPair.src : langs[0];
  let tgt = s.lastPair?.tgt && langs.includes(s.lastPair.tgt) ? s.lastPair.tgt : langs.find((l) => l !== src);
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
    .map((l) => `<option value="${l}"${l === uiLang ? " selected" : ""}>${esc(langLabel(l))}</option>`)
    .join("");
}

function paintTranslitToggle() {
  const btn = document.getElementById("translitToggle");
  if (!btn) return;
  const on = store.showTranslit();
  const label = t("common.showTranslit");
  btn.textContent = "Aa";
  btn.setAttribute("aria-pressed", on ? "true" : "false");
  btn.setAttribute("aria-label", label);
  btn.setAttribute("title", label);
}

function errorView(msg) {
  return page(t("common.error"), `<p class="muted">${esc(msg)}</p>`);
}

async function render() {
  const app = document.getElementById("app");
  const route = parseHash(location.hash);
  document.documentElement.lang = uiLang;
  document.documentElement.dir = isRtl(uiLang) ? "rtl" : "ltr";
  const translit = store.showTranslit();

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
        app.innerHTML = renderLesson({ t, lesson, uiLang, srcLang: "es", translit });
      } else {
        app.innerHTML = renderLessonList({ t, lessons: await getLessons(tgt), uiLang });
      }
      return;
    }

    if (route.name === "alphabet") {
      paintNav("alphabet");
      const all = await getAlphabets();
      if (route.param) {
        app.innerHTML = renderAlphabet({ t, lang: route.param,
          alphabet: all[route.param], uiLang });
        mountAlphabet(app);
      } else {
        app.innerHTML = renderAlphabetList({ t, alphabets: all, uiLang });
      }
      return;
    }

    if (MODE_ROUTES.has(route.name)) {
      paintNav(route.name);
      const { src, tgt } = currentPair();
      const pair = buildPair(await getConcepts(), await getTerms(src), await getTerms(tgt));

      if (route.name === "study") {
        app.innerHTML = renderStudy({ t, pairs: pair, i: 0, flipped: false, translit });
        mountStudy(app, { pairs: pair, i: 0, store, src, tgt, t, translit });
      } else if (route.name === "quiz") {
        mountQuiz(app, { pairs: pair, store, src, tgt, t, translit });
      } else if (route.name === "dictionary") {
        mountDictionary(app, { concepts: await getConcepts(), data, langs, t, translit });
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
  paintTranslitToggle();
  render();
});

document.getElementById("translitToggle").addEventListener("click", () => {
  store.setShowTranslit(!store.showTranslit());
  paintTranslitToggle();
  render();
});

window.addEventListener("hashchange", render);
window.addEventListener("DOMContentLoaded", () => {
  paintUiLang();
  paintTranslitToggle();
  render();
});

if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("service-worker.js").catch(() => {});
  });
}
