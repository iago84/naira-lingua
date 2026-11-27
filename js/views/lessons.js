// js/views/lessons.js
import { esc } from "../util.js";
import { page } from "./common.js";
import { toHash } from "../router.js";

function textFor(map, lang, fallback = "es") {
  if (!map) return "";
  return map[lang] ?? map[fallback] ?? Object.values(map)[0] ?? "";
}

export function renderLessonList({ t, lessons, uiLang }) {
  if (!lessons || lessons.length === 0) {
    return page(t("lessons.title"), `<p class="muted">${esc(t("lessons.empty"))}</p>`);
  }
  const items = lessons.map((l) => `
    <a class="card" href="${toHash("lessons", l.id)}">
      <h3>U${esc(l.unit)} · L${esc(l.lesson)} — ${esc(textFor(l.title, uiLang))}</h3>
    </a>`).join("");
  return page(t("lessons.title"), `<div class="grid">${items}</div>`);
}

export function renderLesson({ t, lesson, uiLang, srcLang }) {
  const title = textFor(lesson.title, uiLang);
  const dialogue = (lesson.dialogue || []).map((line) => `
    <p><strong>${esc(line.speaker)}:</strong>
      <span lang="${esc(lesson.lang)}" dir="auto">${esc(line[lesson.lang] ?? "")}</span>
      <br><span class="muted" lang="${esc(srcLang)}" dir="auto">${esc(line[srcLang] ?? line.es ?? "")}</span>
    </p>`).join("");
  const explanation = textFor(lesson.explanation, uiLang);
  const tables = (lesson.tables || []).map((tb) => `
    <h4>${esc(tb.title)} <span class="muted">(${esc(tb.type)})</span></h4>
    <table><thead><tr>${(tb.columns || []).map((c) => `<th>${esc(c)}</th>`).join("")}</tr></thead>
      <tbody>${(tb.rows || []).map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table>`).join("");
  return page(esc(`U${lesson.unit} · L${lesson.lesson} — ${title}`), `
    <a class="muted" href="${toHash("lessons")}">← ${esc(t("lessons.back"))}</a>
    <h2>${esc(t("lessons.dialogue"))}</h2>${dialogue}
    <h2>${esc(t("lessons.explanation"))}</h2><p>${esc(explanation)}</p>
    <h2>${esc(t("lessons.tables"))}</h2>${tables}`);
}
