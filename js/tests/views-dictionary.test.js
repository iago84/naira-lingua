// js/tests/views-dictionary.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderDictionary } from "../views/dictionary.js";
import { t } from "../i18n.js";
const tt = (k) => t("es", k);

const CONCEPTS = [
  { id: "c:saludos.hola", domain: "saludos", gloss_es: "saludo al encontrarse" },
  { id: "c:numeros.uno", domain: "numeros", gloss_es: "el número uno" },
];
const BY_LANG = {
  es: [{ concept: "c:saludos.hola", lang: "es", term: "hola", review: "verified" }],
  fr: [{ concept: "c:saludos.hola", lang: "fr", term: "bonjour", review: "verified" }],
};

test("renderDictionary filtra por consulta", () => {
  const html = renderDictionary({ t: tt, concepts: CONCEPTS, byLang: BY_LANG, query: "hola" });
  assert.match(html, /c:saludos.hola|Todos los idiomas|bonjour/);
  assert.match(html, /bonjour/);
  assert.doesNotMatch(html, /el número uno/);
});

test("renderDictionary muestra el término en varios idiomas", () => {
  const html = renderDictionary({ t: tt, concepts: CONCEPTS, byLang: BY_LANG,
    query: "", domain: "saludos" });
  assert.match(html, /hola/);
  assert.match(html, /bonjour/);
  assert.doesNotMatch(html, /el número uno/);
});
