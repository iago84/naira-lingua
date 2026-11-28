// js/tests/views-alphabet.test.js
import { test } from "node:test";
import assert from "node:assert/strict";
import { renderAlphabetList, renderAlphabet } from "../views/alphabet.js";
import { t } from "../i18n.js";
const tt = (k) => t("es", k);

const ALPHABETS = {
  fr: { lang: "fr", script: "latin", direction: "ltr",
        title: { es: "Alfabeto francés" } },
  ja: { lang: "ja", script: "japanese", direction: "ltr",
        title: { es: "Kanas" } },
};

const ALPHABET = {
  lang: "ja", script: "japanese", direction: "ltr",
  title: { es: "Kanas" }, intro: { es: "Dos silabarios" },
  sections: [{
    title: { es: "Hiragana" },
    columns: [{ key: "char", label: { es: "Signo" } },
              { key: "romaji", label: { es: "Lectura" } }],
    items: [{ char: "あ", romaji: "a" }, { char: "い", romaji: "i" }],
  }],
};

test("renderAlphabetList enlaza cada idioma", () => {
  const html = renderAlphabetList({ t: tt, alphabets: ALPHABETS, uiLang: "es" });
  assert.match(html, /Alfabeto francés/);
  assert.match(html, /#\/alphabet\/ja/);
});

test("renderAlphabetList avisa si está vacío", () => {
  const html = renderAlphabetList({ t: tt, alphabets: {}, uiLang: "es" });
  assert.match(html, /No hay alfabeto/i);
});

test("renderAlphabet genera botones por signo y lightbox", () => {
  const html = renderAlphabet({ t: tt, lang: "ja", alphabet: ALPHABET, uiLang: "es" });
  assert.match(html, /data-glyph="あ"/);
  assert.match(html, /data-glyph="い"/);
  assert.match(html, /id="glyphBox"/);
  assert.match(html, /id="glyphBig"/);
  assert.match(html, /script-japanese/);
});

test("renderAlphabet aplica dirección rtl y nota", () => {
  const rtl = {
    lang: "ur", script: "arabic", direction: "rtl",
    title: { es: "Urdu" }, intro: { es: "RTL" },
    sections: [{
      title: { es: "Letras" },
      columns: [{ key: "char", label: { es: "Signo" } }],
      items: [{ char: "ا", note: { es: "alif" } }],
    }],
  };
  const html = renderAlphabet({ t: tt, lang: "ur", alphabet: rtl, uiLang: "es" });
  assert.match(html, /dir="rtl"/);
  assert.match(html, /alif/);
  assert.match(html, /script-arabic/);
});

test("renderAlphabet sin datos avisa", () => {
  const html = renderAlphabet({ t: tt, lang: "xx", alphabet: null, uiLang: "es" });
  assert.match(html, /No hay alfabeto/i);
});
