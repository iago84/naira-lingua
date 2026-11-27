// js/views/quiz.js
import { esc, shuffle } from "../util.js";
import { page } from "./common.js";
import { toHash } from "../router.js";

const OPTION_TARGET = 4; // 1 correcta + 3 distractores

export function buildQuestions(pairs, rng = Math.random) {
  const pool = [...new Set(pairs.map((p) => p.tgt))];
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
    return `<button class="${cls}" data-opt="${esc(o)}" dir="auto"${state}
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
    <div class="card flashcard"><div class="term" dir="auto">${esc(q.prompt)}</div></div>
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
