// js/tests/i18n.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { STRINGS, normalizeLang, t, availableLangs } from "../i18n.js";

test("normalizeLang reduce y cae a español", () => {
  assert.equal(normalizeLang("en-US"), "en");
  assert.equal(normalizeLang("ES"), "es");
  assert.equal(normalizeLang("zz-ZZ"), "es");
  assert.equal(normalizeLang(undefined), "es");
});

test("t devuelve el texto del idioma pedido", () => {
  assert.equal(t("es", "nav.home"), STRINGS.es["nav.home"]);
  assert.equal(t("en", "nav.home"), STRINGS.en["nav.home"]);
});

test("t cae a español y luego a la clave", () => {
  assert.equal(t("en", "clave.inexistente"), "clave.inexistente");
});

test("availableLangs lista los idiomas de UI", () => {
  assert.deepEqual(availableLangs().sort(), ["en", "es"]);
});
