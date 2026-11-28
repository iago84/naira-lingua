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
  assert.equal(new Set(q.options).size, q.options.length); // sin repetidos
});

test("buildQuestions completa con otros dominios si el dominio es pequeño", () => {
  const qs = buildQuestions(PAIRS, () => 0.5);
  const q = qs[0];
  // 'saludos' sólo aporta 1 distractor ('merci'); se rellena con 'un' (numeros).
  assert.ok(q.options.includes("un"));
});

test("renderQuiz muestra pregunta y opciones", () => {
  const q = { prompt: "hola", answer: "bonjour", options: ["bonjour", "merci"] };
  const html = renderQuiz({ t: tt, q, i: 0, total: 3, chosen: null });
  assert.match(html, /hola/);
  assert.match(html, /data-opt="bonjour"/);
});

const PAIRS_TL = [
  { concept: "a", domain: "saludos", src: "こんにちは", srcTranslit: "konnichiha",
    tgt: "Dzień dobry", tgtTranslit: "djen dobre" },
  { concept: "b", domain: "despedidas", src: "adiós", srcTranslit: "",
    tgt: "こんばんは", tgtTranslit: "konbanha" },
];

test("buildQuestions adjunta lecturas a prompt y opciones", () => {
  const qs = buildQuestions(PAIRS_TL, () => 0.5);
  assert.equal(qs[0].promptTranslit, "konnichiha");
  assert.equal(qs[0].optionTranslit["Dzień dobry"], "djen dobre");
});

test("renderQuiz muestra la transliteración si está activada", () => {
  const q = { prompt: "こんにちは", promptTranslit: "konnichiha",
              answer: "こんばんは", options: ["こんばんは", "さようなら"],
              optionTranslit: { "こんばんは": "konbanha", "さようなら": "sayounara" } };
  const on = renderQuiz({ t: tt, q, i: 0, total: 2, chosen: null, translit: true });
  assert.match(on, /konnichiha/);
  assert.match(on, /opt-translit/);
});

test("renderQuiz oculta la transliteración si está desactivada", () => {
  const q = { prompt: "こんにちは", promptTranslit: "konnichiha",
              answer: "こんばんは", options: ["こんばんは", "さようなら"],
              optionTranslit: { "こんばんは": "konbanha", "さようなら": "sayounara" } };
  const off = renderQuiz({ t: tt, q, i: 0, total: 2, chosen: null, translit: false });
  assert.doesNotMatch(off, /konnichiha/);
  assert.doesNotMatch(off, /opt-translit/);
});
