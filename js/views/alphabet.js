// js/views/alphabet.js
// Lecciones de escritura: listado de alfabetos y tabla interactiva por idioma.
// Cada signo se puede pulsar para verlo en grande (lightbox accesible).
import { esc } from "../util.js";
import { page } from "./common.js";
import { toHash } from "../router.js";
import { langLabel } from "../langs.js";

function textFor(map, lang, fallback = "es") {
  if (!map) return "";
  return map[lang] ?? map[fallback] ?? Object.values(map)[0] ?? "";
}

export function renderAlphabetList({ t, alphabets, uiLang }) {
  const langs = Object.keys(alphabets || {});
  if (langs.length === 0) {
    return page(t("alphabet.title"),
      `<p class="muted">${esc(t("alphabet.empty"))}</p>`);
  }
  const items = langs.map((lg) => `
    <a class="card" href="${toHash("alphabet", lg)}">
      <h3>${esc(textFor(alphabets[lg].title, uiLang))}</h3>
      <p class="muted">${esc(langLabel(lg))}</p>
    </a>`).join("");
  return page(t("alphabet.title"), `
    <p class="muted">${esc(t("alphabet.list"))}</p>
    <div class="grid">${items}</div>`);
}

export function renderAlphabet({ t, lang, alphabet, uiLang }) {
  if (!alphabet) {
    return page(t("alphabet.title"),
      `<p class="muted">${esc(t("alphabet.empty"))}</p>`);
  }
  const code = alphabet.lang || lang || "";
  const dir = alphabet.direction === "rtl" ? "rtl" : "ltr";
  const script = esc(alphabet.script || "latin");
  const sections = (alphabet.sections || []).map((sec) => {
    const cols = sec.columns || [];
    const head = cols
      .map((c) => `<th>${esc(textFor(c.label, uiLang) || c.key)}</th>`).join("");
    const rows = (sec.items || []).map((it) => {
      const cells = cols.map((c) => {
        const value = it[c.key] ?? "";
        if (c.key === "char") {
          const note = it.note
            ? ` <span class="muted note">${esc(textFor(it.note, uiLang))}</span>` : "";
          return `<td><button type="button" class="glyph" dir="${dir}"
            data-glyph="${esc(value)}" aria-label="${esc(value)}">${esc(value)}</button>${note}</td>`;
        }
        return `<td dir="${dir}">${esc(value)}</td>`;
      }).join("");
      return `<tr>${cells}</tr>`;
    }).join("");
    return `<h2>${esc(textFor(sec.title, uiLang))}</h2>
      <div class="table-wrap script-${script}" lang="${esc(code)}"><table class="alphabet" dir="${dir}">
        <thead><tr>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
  }).join("");
  return page(textFor(alphabet.title, uiLang), `
    <a class="muted" href="${toHash("alphabet")}">← ${esc(t("alphabet.back"))}</a>
    <p>${esc(textFor(alphabet.intro, uiLang))}</p>
    <p class="muted">${esc(t("alphabet.hint"))}</p>
    ${sections}
    <div id="glyphBox" class="glyph-box script-${script}" hidden>
      <div class="glyph-big" id="glyphBig" dir="${dir}"></div>
      <button type="button" class="btn" id="glyphClose">${esc(t("alphabet.close"))}</button>
    </div>`);
}

export function mountAlphabet(root) {
  const box = root.querySelector("#glyphBox");
  const big = root.querySelector("#glyphBig");
  if (!box || !big) return;
  const onKey = (e) => { if (e.key === "Escape") close(); };
  function open(ch) {
    big.textContent = ch;
    box.hidden = false;
    document.addEventListener("keydown", onKey);
    root.querySelector("#glyphClose")?.focus();
  }
  function close() {
    box.hidden = true;
    big.textContent = "";
    document.removeEventListener("keydown", onKey);
  }
  root.querySelectorAll("[data-glyph]").forEach((btn) => {
    btn.addEventListener("click", () => open(btn.dataset.glyph));
  });
  box.addEventListener("click", (e) => { if (e.target === box) close(); });
  root.querySelector("#glyphClose")?.addEventListener("click", close);
}
