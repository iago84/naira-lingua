// js/langs.js
// Metadatos de los idiomas del corpus: nombre endónimo, bandera y dirección.
// El conjunto es el que cubre el dataset compilado (data/manifest.json).
export const LANGS = {
  es: { name: "Español", flag: "🇪🇸", rtl: false },
  en: { name: "English", flag: "🇬🇧", rtl: false },
  fr: { name: "Français", flag: "🇫🇷", rtl: false },
  it: { name: "Italiano", flag: "🇮🇹", rtl: false },
  pt: { name: "Português", flag: "🇵🇹", rtl: false },
  de: { name: "Deutsch", flag: "🇩🇪", rtl: false },
  gl: { name: "Galego", flag: "🌐", rtl: false },
  ja: { name: "日本語", flag: "🇯🇵", rtl: false },
  zh: { name: "中文", flag: "🇨🇳", rtl: false },
  hi: { name: "हिन्दी", flag: "🇮🇳", rtl: false },
  sw: { name: "Kiswahili", flag: "🇰🇪", rtl: false },
  ur: { name: "اردو", flag: "🇵🇰", rtl: true },
};

const FALLBACK = { name: "", flag: "🌐", rtl: false };

export function langInfo(code) {
  const short = String(code || "").slice(0, 2).toLowerCase();
  const info = LANGS[short];
  return info ? { ...info } : { ...FALLBACK, name: String(code || "").toUpperCase() };
}

export function langLabel(code) {
  const info = langInfo(code);
  return `${info.flag} ${info.name}`.trim();
}

export function isRtl(code) {
  return Boolean(langInfo(code).rtl);
}
