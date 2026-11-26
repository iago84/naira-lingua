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
