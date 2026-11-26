// js/tests/views-common.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { page, optionList } from "../views/common.js";

test("page envuelve el contenido con un título y escapa", () => {
  const html = page("<b>Hola</b>", "<p>cuerpo</p>");
  assert.match(html, /<h1[^>]*>&lt;b&gt;Hola&lt;\/b&gt;<\/h1>/);
  assert.match(html, /<p>cuerpo<\/p>/);
});

test("optionList marca la opción seleccionada", () => {
  const html = optionList(["es", "fr"], "fr");
  assert.match(html, /<option value="fr" selected>fr<\/option>/);
  assert.match(html, /<option value="es">es<\/option>/);
});
