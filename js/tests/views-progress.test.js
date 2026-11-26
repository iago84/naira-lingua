// node --test js/tests
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderProgress } from "../views/progress.js";
import { t } from "../i18n.js";
const tt = (k) => t("es", k);

test("renderProgress muestra contadores y botón de reinicio", () => {
  const html = renderProgress({ t: tt, src: "es", tgt: "fr",
    pair: { known: ["a", "b"], review: ["c"], correct: 5, wrong: 2 } });
  assert.match(html, /Aprendidas<\/dt><dd>2<\/dd>/);
  assert.match(html, /Por repasar<\/dt><dd>1<\/dd>/);
  assert.match(html, /id="reset"/);
});

test("renderProgress funciona sin datos previos", () => {
  const html = renderProgress({ t: tt, src: "es", tgt: "fr", pair: null });
  assert.match(html, /Aprendidas<\/dt><dd>0<\/dd>/);
});
