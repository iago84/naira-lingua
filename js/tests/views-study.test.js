// js/tests/views-study.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderStudy } from "../views/study.js";
import { t } from "../i18n.js";
const tt = (k) => t("es", k);

const PAIRS = [
  { concept: "c:saludos.hola", domain: "saludos", src: "hola", tgt: "bonjour", tgtTranslit: "", tgtIpa: "bɔ̃.ʒuʁ" },
];

test("renderStudy muestra el término origen y oculta la respuesta", () => {
  const html = renderStudy({ t: tt, pairs: PAIRS, i: 0, flipped: false });
  assert.match(html, /hola/);
  assert.doesNotMatch(html, /bonjour/);
});

test("renderStudy al voltear muestra el destino y botones", () => {
  const html = renderStudy({ t: tt, pairs: PAIRS, i: 0, flipped: true });
  assert.match(html, /bonjour/);
  assert.match(html, /Ya la sabía/);
  assert.match(html, /Repasar/);
});

test("renderStudy avisa si no hay tarjetas", () => {
  const html = renderStudy({ t: tt, pairs: [], i: 0, flipped: false });
  assert.match(html, /No hay tarjetas/);
});
