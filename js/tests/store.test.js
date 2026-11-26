// js/tests/store.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { createStore, memoryStorage } from "../store.js";

test("marca conocidas y las persiste", () => {
  const s = createStore(memoryStorage());
  s.markKnown("es", "fr", "c:saludos.hola");
  assert.deepEqual(s.getPair("es", "fr").known, ["c:saludos.hola"]);
  // Persistencia: un store nuevo sobre el mismo storage
  const s2 = createStore(s._storage);
  assert.deepEqual(s2.getPair("es", "fr").known, ["c:saludos.hola"]);
});

test("mover a repasar quita de conocidas y no duplica", () => {
  const s = createStore(memoryStorage());
  s.markKnown("es", "fr", "a");
  s.markReview("es", "fr", "a");
  s.markReview("es", "fr", "a");
  const p = s.getPair("es", "fr");
  assert.deepEqual(p.known, []);
  assert.deepEqual(p.review, ["a"]);
});

test("recordQuiz acumula aciertos y fallos", () => {
  const s = createStore(memoryStorage());
  s.recordQuiz("es", "fr", true);
  s.recordQuiz("es", "fr", false);
  const p = s.getPair("es", "fr");
  assert.equal(p.correct, 1);
  assert.equal(p.wrong, 1);
});

test("guarda y lee preferencias de UI", () => {
  const s = createStore(memoryStorage());
  s.setUiLang("en");
  s.setLastPair("es", "it");
  const s2 = createStore(s._storage);
  assert.equal(s2.getState().ui.lang, "en");
  assert.deepEqual(s2.getState().lastPair, { src: "es", tgt: "it" });
});

test("resetPair limpia solo ese par", () => {
  const s = createStore(memoryStorage());
  s.markKnown("es", "fr", "a");
  s.markKnown("es", "it", "b");
  s.resetPair("es", "fr");
  assert.equal(s.getPair("es", "fr"), null);
  assert.deepEqual(s.getPair("es", "it").known, ["b"]);
});
