// js/tests/views-home.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderHome } from "../views/home.js";
import { renderPick } from "../views/pick.js";
import { t } from "../i18n.js";

const tt = (k) => t("es", k);

test("renderHome incluye el lema y enlaces a los modos", () => {
  const html = renderHome({ t: tt });
  assert.match(html, /Empezar a estudiar/);
  assert.match(html, /#\/pick/);
});

test("renderPick lista idiomas y modos", () => {
  const html = renderPick({
    t: tt, langs: ["es", "fr", "it"], src: "es", tgt: "fr",
    mode: "study", domains: ["saludos", "numeros"], domain: "",
  });
  assert.match(html, /value="it">🇮🇹 Italiano<\/option>/);
  assert.match(html, /value="quiz"/);
  assert.match(html, /value="saludos"/);
});
