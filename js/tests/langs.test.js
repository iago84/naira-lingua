// js/tests/langs.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { LANGS, langInfo, langLabel, isRtl } from "../langs.js";

test("langInfo devuelve nombre y bandera endónimos", () => {
  assert.equal(langInfo("es").name, "Español");
  assert.equal(langInfo("ja").name, "日本語");
  assert.equal(langInfo("en-US").name, "English"); // normaliza a 2 letras
});

test("langInfo cae a un descriptor seguro para códigos desconocidos", () => {
  const info = langInfo("zz");
  assert.equal(info.name, "ZZ");
  assert.equal(info.flag, "🌐");
  assert.equal(info.rtl, false);
});

test("isRtl marca las direcciones derecha-a-izquierda", () => {
  assert.equal(isRtl("ur"), true);
  assert.equal(isRtl("es"), false);
});

test("langLabel combina bandera y nombre", () => {
  assert.equal(langLabel("fr"), "🇫🇷 Français");
});

test("el corpus de idiomas cubre 12 lenguas", () => {
  assert.equal(Object.keys(LANGS).length, 12);
});
