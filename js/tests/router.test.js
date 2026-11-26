// js/tests/router.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { parseHash, toHash } from "../router.js";

test("parseHash de la raíz es home", () => {
  assert.deepEqual(parseHash(""), { name: "home", param: null });
  assert.deepEqual(parseHash("#/"), { name: "home", param: null });
});

test("parseHash lee nombre y parámetro", () => {
  assert.deepEqual(parseHash("#/study"), { name: "study", param: null });
  assert.deepEqual(parseHash("#/lessons/fr-u1-l1"),
    { name: "lessons", param: "fr-u1-l1" });
});

test("toHash construye la ruta", () => {
  assert.equal(toHash("home"), "#/");
  assert.equal(toHash("study"), "#/study");
  assert.equal(toHash("lessons", "fr-u1-l1"), "#/lessons/fr-u1-l1");
});
