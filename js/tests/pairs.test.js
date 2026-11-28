// js/tests/pairs.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { indexTerms, pickTerm, buildPair, domainsOf, filterByDomain, termsForConcept, translitOf } from "../pairs.js";

const CONCEPTS = [
  { id: "c:saludos.hola", domain: "saludos", icon: "👋", gloss_es: "saludo" },
  { id: "c:numeros.uno", domain: "numeros", icon: "1️⃣", gloss_es: "uno" },
];
const ES = [
  { concept: "c:saludos.hola", lang: "es", term: "hola", review: "verified" },
  { concept: "c:numeros.uno", lang: "es", term: "uno", review: "verified" },
];
const FR = [
  { concept: "c:saludos.hola", lang: "fr", term: "bonjour", review: "needs_review" },
  { concept: "c:saludos.hola", lang: "fr", term: "salut", review: "verified" },
];

test("indexTerms agrupa por concepto", () => {
  const idx = indexTerms(FR);
  assert.equal(idx.get("c:saludos.hola").length, 2);
});

test("pickTerm prefiere verified", () => {
  assert.equal(pickTerm(FR).term, "salut");
  assert.equal(pickTerm([]), null);
});

test("buildPair solo incluye conceptos presentes en ambos idiomas", () => {
  const pairs = buildPair(CONCEPTS, ES, FR);
  assert.equal(pairs.length, 1);
  assert.deepEqual(pairs[0], {
    concept: "c:saludos.hola", domain: "saludos", icon: "👋",
    gloss_es: "saludo", src: "hola", tgt: "salut",
    srcTranslit: "", tgtTranslit: "", srcIpa: "", tgtIpa: "",
  });
});

test("domainsOf y filterByDomain", () => {
  const pairs = buildPair(CONCEPTS, ES, ES);
  assert.deepEqual(domainsOf(pairs), ["numeros", "saludos"]);
  assert.equal(filterByDomain(pairs, "saludos").length, 1);
  assert.equal(filterByDomain(pairs, null).length, 2);
});

test("termsForConcept devuelve el término por idioma", () => {
  const termsByLang = { es: ES, fr: FR };
  const out = termsForConcept("c:saludos.hola", termsByLang);
  assert.equal(out.es.term, "hola");
  assert.equal(out.fr.term, "salut");
});

test("translitOf omite la lectura en alfabeto latino", () => {
  assert.equal(translitOf({ term: "Habari", translit: "ha-ba-ri", script: "latin" }), "");
  assert.equal(translitOf({ term: "こんにちは", translit: "konnichiha", script: "japanese" }), "konnichiha");
  assert.equal(translitOf({ term: "hola" }), "");
  assert.equal(translitOf(null), "");
});

test("buildPair descarta la transliteración latina (sw) pero conserva la no latina", () => {
  const concepts = [{ id: "c:saludos.hola", domain: "saludos", icon: "👋", gloss_es: "hola" }];
  const sw = [{ concept: "c:saludos.hola", lang: "sw", term: "Habari", translit: "ha-ba-ri", script: "latin" }];
  const ja = [{ concept: "c:saludos.hola", lang: "ja", term: "こんにちは", translit: "konnichiha", script: "japanese" }];
  assert.equal(buildPair(concepts, sw, ja)[0].srcTranslit, "");
  assert.equal(buildPair(concepts, sw, ja)[0].tgtTranslit, "konnichiha");
});
