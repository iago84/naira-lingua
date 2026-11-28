// js/views/quiz.js
import { esc, shuffle, translitFor } from "../util.js";
import { page } from "./common.js";
import { toHash } from "../router.js";

const OPTION_TARGET = 4; // 1 correcta + 3 distractores

export function buildQuestions(pairs, rng = Math.random) {
  const pool = [...new Set(pairs.map((p) => p.tgt))];
  const translitByTgt = new Map(pairs.map((p) => [p.tgt, p.tgtTranslit || ""]));
  return pairs.map((p) => {
    const sameDomain = pairs
      .filter((o) => o.concept !== p.concept && o.domain === p.domain)
      .map((o) => o.tgt);
    let distractors = shuffle([...new Set(sameDomain)], rng).slice(0, OPTION_TARGET - 1);
    if (distractors.length < OPTION_TARGET - 1) {
      // Respaldo: si el dominio tiene pocos conceptos, completa con otros.
      const used = new Set([p.tgt, ...distractors]);
      const extra = shuffle(pool.filter((t) => !used.has(t)), rng)
        .slice(0, OPTION_TARGET - 1 - distractors.length);
      distractors = [...distractors, ...extra];
    }
    const options = shuffle([p.tgt, ...distractors], rng);
    const optionTranslit = {};
    for (const o of options) {
      const tl = translitFor(o, translitByTgt.get(o));
      if (tl) optionTranslit[o] = tl;
    }
    return { concept: p.concept, prompt: p.src, promptTranslit: p.srcTranslit || "",
             answer: p.tgt, options, optionTranslit };
  });
}

export function renderQuiz({ t, q, i, total, chosen, translit = true }) {
  const on = translit !== false;
  const promptTl = on ? translitFor(q.prompt, q.promptTranslit) : "";
  const opts = q.options.map((o) => {
    let cls = "btn option";
    if (chosen && o === q.answer) cls += " correct";
    const state = chosen ? ` data-chosen="${chosen === o ? "1" : "0"}"` : "";
    const tl = on ? translitFor(o, q.optionTranslit?.[o]) : "";
    return `<button class="${cls}" data-opt="${esc(o)}" dir="auto"${state}
      ${chosen ? "disabled" : ""}><span dir="auto">${esc(o)}</span>${tl ? `<span class="opt-translit muted" dir="auto">${esc(tl)}</span>` : ""}</button>`;
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
    <div class="card flashcard"><div class="term" dir="auto">${esc(q.prompt)}</div>
      ${promptTl ? `<div class="sub translit" dir="auto">${esc(promptTl)}</div>` : ""}</div>
    <div class="row" id="options">${opts}</div>
    ${feedback}`);
}

export function mountQuiz(root, { pairs, store, src, tgt, t, translit = true, onDone }) {
  const questions = buildQuestions(pairs);
  let i = 0, chosen = null, score = 0;

  function draw() {
    root.innerHTML = renderQuiz({ t, q: questions[i], i, total: questions.length, chosen, translit });
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
