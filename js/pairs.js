// js/pairs.js
import { uniqSorted } from "./util.js";

export function indexTerms(terms) {
  const map = new Map();
  for (const t of terms) {
    if (!map.has(t.concept)) map.set(t.concept, []);
    map.get(t.concept).push(t);
  }
  return map;
}

export function pickTerm(list) {
  if (!list || list.length === 0) return null;
  return list.find((t) => t.review === "verified") || list[0];
}

// La lectura (translit) solo aporta en escrituras no latinas; en alfabeto
// latino sería una repetición (p. ej. la silabación sw «ha-ba-ri»).
export function translitOf(term) {
  if (!term || term.script === "latin") return "";
  return term.translit || "";
}

export function buildPair(concepts, srcTerms, tgtTerms) {
  const src = indexTerms(srcTerms);
  const tgt = indexTerms(tgtTerms);
  const out = [];
  for (const c of concepts) {
    const s = pickTerm(src.get(c.id));
    const g = pickTerm(tgt.get(c.id));
    if (!s || !g) continue;
    out.push({
      concept: c.id,
      domain: c.domain,
      icon: c.icon || "",
      gloss_es: c.gloss_es || "",
      src: s.term,
      tgt: g.term,
      srcTranslit: translitOf(s),
      tgtTranslit: translitOf(g),
      srcIpa: s.ipa || "",
      tgtIpa: g.ipa || "",
    });
  }
  return out;
}

export function domainsOf(pairs) {
  return uniqSorted(pairs.map((p) => p.domain).filter(Boolean));
}

export function filterByDomain(pairs, domain) {
  return !domain ? pairs : pairs.filter((p) => p.domain === domain);
}

export function termsForConcept(conceptId, termsByLang) {
  const out = {};
  for (const [lang, list] of Object.entries(termsByLang)) {
    const term = pickTerm(list.filter((t) => t.concept === conceptId));
    if (term) out[lang] = term;
  }
  return out;
}
