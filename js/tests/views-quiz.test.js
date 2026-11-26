// js/tests/views-quiz.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderQuiz, buildQuestions } from "../views/quiz.js";
import { t } from "../i18n.js";
const tt = (k) => t("es", k);

const PAIRS = [
  { concept: "a", domain: "saludos", src: "hola", tgt: "bonjour" },
  { concept: "b", domain: "saludos", src: "gracias", tgt: "merci" },
  { concept: "c", domain: "numeros", src: "uno", tgt: "un" },
];

test("buildQuestions usa el mismo dominio para los distractores", () => {
  const qs = buildQuestions(PAIRS, () => 0.5);
  assert.equal(qs.length, 3);
  const q = qs[0];
  assert.equal(q.answer, "bonjour");
  assert.ok(q.options.includes("bonjour"));
  assert.equal(q.options.length, 2); // solo otro concepto del dominio 'saludos'
});

test("renderQuiz muestra pregunta y opciones", () => {
  const q = { prompt: "hola", answer: "bonjour", options: ["bonjour", "merci"] };
  const html = renderQuiz({ t: tt, q, i: 0, total: 3, chosen: null });
  assert.match(html, /hola/);
  assert.match(html, /data-opt="bonjour"/);
});
