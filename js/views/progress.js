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
