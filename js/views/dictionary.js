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
      .map(([lg, tm]) => `<li><span class="muted">${esc(lg)}</span> <span dir="auto">${esc(tm.term)}</span></li>`)
      .join("");
    return `<div class="card">
      <div class="muted">${esc(c.domain)} · ${esc(c.id)}</div>
      <p dir="auto">${esc(c.gloss_es)}</p>
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
