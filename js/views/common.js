// js/views/common.js
import { esc } from "../util.js";
import { langLabel } from "../langs.js";

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
  // Any-to-any: el origen y el destino nunca pueden coincidir.
  const srcLangs = langs.filter((l) => l !== tgt);
  const tgtLangs = langs.filter((l) => l !== src);
  return `
    <div class="pair-selector">
      <label>${esc(t("common.selectSource"))}
        <select id="srcLang">${optionList(srcLangs, src, langLabel)}</select>
      </label>
      <label>${esc(t("common.selectTarget"))}
        <select id="tgtLang">${optionList(tgtLangs, tgt, langLabel)}</select>
      </label>
      ${extra}
    </div>`;
}
