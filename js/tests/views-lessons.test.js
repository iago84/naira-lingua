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

test("renderLesson muestra ejercicios y marca la respuesta", () => {
  const lesson = {
    ...LESSON,
    exercises: [{
      type: "choice",
      title: { es: "Elige" },
      items: [{ concept: "c:x", prompt: "rojo", answer: "rouge",
                options: ["rouge", "bleu", "vert", "noir"] }],
    }],
  };
  const html = renderLesson({ t: tt, lesson, uiLang: "es", srcLang: "es" });
  assert.match(html, /Ejercicios/);
  assert.match(html, /rojo/);
  assert.match(html, /rouge/);
  assert.match(html, /respuesta/);
});

test("renderLesson sin ejercicios no muestra la sección", () => {
  const html = renderLesson({ t: tt, lesson: LESSON, uiLang: "es", srcLang: "es" });
  assert.doesNotMatch(html, /Ejercicios/);
});

const LESSON_TL = {
  ...LESSON,
  lang: "ja",
  dialogue: [{ speaker: "A", ja: "こんにちは", translit: "konnichiha", es: "¡Hola!" }],
  exercises: [{
    type: "choice",
    title: { es: "Elige" },
    items: [{ concept: "c:x", prompt: "hola", answer: "こんにちは",
              options: ["こんにちは", "さようなら"],
              optionTranslit: { "こんにちは": "konnichiha", "さようなら": "sayounara" } }],
  }],
};

test("renderLesson muestra transliteración en diálogo y ejercicios", () => {
  const html = renderLesson({ t: tt, lesson: LESSON_TL, uiLang: "es", srcLang: "es", translit: true });
  assert.match(html, /konnichiha/);
  assert.match(html, /sayounara/);
});

test("renderLesson omite la transliteración si está desactivada", () => {
  const html = renderLesson({ t: tt, lesson: LESSON_TL, uiLang: "es", srcLang: "es", translit: false });
  assert.doesNotMatch(html, /konnichiha/);
  assert.doesNotMatch(html, /sayounara/);
});
