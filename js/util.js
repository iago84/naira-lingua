// js/util.js
export function esc(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Devuelve la transliteración solo si aporta algo: no vacía y distinta del
// término (evita repetir el propio texto en las escrituras latinas).
export function translitFor(term, translit) {
  const tl = String(translit ?? "").trim();
  if (!tl) return "";
  if (tl.toLowerCase() === String(term ?? "").trim().toLowerCase()) return "";
  return tl;
}

export function uniqSorted(arr) {
  return [...new Set(arr)].sort((a, b) => a.localeCompare(b));
}

export function shuffle(arr, rng = Math.random) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
