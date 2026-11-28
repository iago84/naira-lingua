// js/tests/util.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { esc, uniqSorted, shuffle, translitFor } from "../util.js";

test("esc escapa los caracteres peligrosos de HTML", () => {
  assert.equal(esc('<a href="x">&\'</a>'),
    "&lt;a href=&quot;x&quot;&gt;&amp;&#39;&lt;/a&gt;");
});

test("esc trata null/undefined como cadena vacía", () => {
  assert.equal(esc(null), "");
  assert.equal(esc(undefined), "");
});

test("uniqSorted deduplica y ordena", () => {
  assert.deepEqual(uniqSorted(["b", "a", "b", "c"]), ["a", "b", "c"]);
});

test("shuffle conserva los elementos (rng determinista)", () => {
  const rng = () => 0; // siempre intercambia con el índice 0
  const out = shuffle([1, 2, 3], rng);
  assert.equal(out.length, 3);
  assert.deepEqual([...out].sort(), [1, 2, 3]);
});

test("translitFor devuelve la lectura solo si aporta algo", () => {
  assert.equal(translitFor("こんにちは", "konnichiha"), "konnichiha");
  assert.equal(translitFor("habari", "habari"), ""); // igual al término: se omite
  assert.equal(translitFor("hola", ""), "");
  assert.equal(translitFor("hola", null), "");
});
