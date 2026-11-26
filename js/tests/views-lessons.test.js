// js/tests/views-lessons.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderLessonList, renderLesson } from "../views/lessons.js";
import { t } from "../i18n.js";
const tt = (k) => t("es", k);

const LESSON = {
  id: "fr-u1-l1", lang: "fr", unit: 1, lesson: 1,
  title: { fr: "Salutations", es: "Saludos" },
  dialogue: [{ speaker: "A", fr: "Bonjour !", es: "¡Hola!" }],
  explanation: { es: "Texto **markdown**" },
  tables: [{ type: "verb", title: "être", columns: ["persona", "presente"],
             rows: [["je", "suis"]] }],
};

test("renderLessonList enlaza cada lección", () => {
  const html = renderLessonList({ t: tt, lessons: [LESSON], uiLang: "es" });
  assert.match(html, /Saludos/);
  assert.match(html, /#\/lessons\/fr-u1-l1/);
});

test("renderLesson muestra diálogo y tabla", () => {
  const html = renderLesson({ t: tt, lesson: LESSON, uiLang: "es", srcLang: "es" });
  assert.match(html, /Bonjour !/);
  assert.match(html, /¡Hola!/);
  assert.match(html, /<td>je<\/td>/);
});

test("renderLessonList avisa si está vacío", () => {
  const html = renderLessonList({ t: tt, lessons: [], uiLang: "es" });
  assert.match(html, /no hay lecciones/i);
});
