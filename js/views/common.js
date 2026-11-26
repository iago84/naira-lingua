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
