// js/tests/data.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { createDataSource } from "../data.js";

function fakeFetch(responses) {
  const calls = [];
  const fn = async (url) => {
    calls.push(url);
    if (!(url in responses)) return { ok: false, status: 404 };
    return { ok: true, status: 200, json: async () => responses[url] };
  };
  fn.calls = calls;
  return fn;
}

test("carga manifest y concepts desde base", async () => {
  const f = fakeFetch({
    "./data/manifest.json": { languages: ["fr"] },
    "./data/concepts.json": [{ id: "c:x" }],
  });
  const ds = createDataSource(".", f);
  assert.deepEqual(await ds.loadManifest(), { languages: ["fr"] });
  assert.deepEqual(await ds.loadConcepts(), [{ id: "c:x" }]);
});

test("cachea: no repite fetch del mismo recurso", async () => {
  const f = fakeFetch({ "./data/terms.fr.json": [] });
  const ds = createDataSource(".", f);
  await ds.loadTerms("fr");
  await ds.loadTerms("fr");
  assert.equal(f.calls.filter((u) => u.endsWith("terms.fr.json")).length, 1);
});

test("lanza error si el recurso no existe", async () => {
  const f = fakeFetch({});
  const ds = createDataSource(".", f);
  await assert.rejects(() => ds.loadTerms("xx"), /HTTP 404/);
});
