// js/views/study.js
import { esc, translitFor } from "../util.js";
import { page } from "./common.js";
import { toHash } from "../router.js";

export function renderStudy({ t, pairs, i, flipped, translit = true }) {
  if (!pairs || pairs.length === 0) {
    return page(t("study.title"),
      `<p class="muted">${esc(t("study.empty"))}</p>` +
      `<a class="btn" href="${toHash("pick")}">${esc(t("pick.title"))}</a>`);
  }
  const card = pairs[i];
  const on = translit !== false;
  const srcTl = on ? translitFor(card.src, card.srcTranslit) : "";
  const tgtTl = on ? translitFor(card.tgt, card.tgtTranslit) : "";
  const front = `
    <div class="term" dir="auto">${esc(card.src)}</div>
    ${srcTl ? `<div class="sub translit" dir="auto">${esc(srcTl)}</div>` : ""}
    ${card.srcIpa ? `<div class="sub">${esc(card.srcIpa)}</div>` : ""}
    <div class="sub">${esc(card.icon)} ${esc(card.domain)}</div>`;
  const back = `
    <div class="term" dir="auto">${esc(card.tgt)}</div>
    ${tgtTl ? `<div class="sub translit" dir="auto">${esc(tgtTl)}</div>` : ""}
    ${card.tgtIpa ? `<div class="sub">${esc(card.tgtIpa)}</div>` : ""}`;
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

export function mountStudy(root, { pairs, i, store, src, tgt, t, translit = true }) {
  let idx = i;
  let flipped = false;
  let list = pairs;

  function draw() {
    root.innerHTML = renderStudy({ t, pairs: list, i: idx, flipped, translit });
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
