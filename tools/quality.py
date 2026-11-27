"""Gate de calidad del contenido: detecta artefactos de traducción automática.

El corpus se completa con traducción por lotes (Argos/LibreTranslate), que a
veces produce salidas degeneradas: repeticiones («Desculpe-me, desculpe-me»),
paréntesis huérfanos («(informal)»), frases encadenadas en idiomas CJK
(«早上好,我刚从你那回来») o términos sin traducir. Este módulo las detecta y
emite un recuento por idioma para priorizar el curado humano.

Por defecto sólo **informa** (no bloquea el build); con ``--strict`` falla si
hay cualquier aviso, para usarlo como puerta estricta cuando el corpus esté
limpio.
"""
from __future__ import annotations
import re, sys
from collections import Counter
from pathlib import Path
from . import common

CJK_LANGS = ("zh", "ja")
# Lenguas donde una forma idéntica al español es plausible (cognados, préstamos:
# «verde»→gl/pt, «rosa»→it, «beige»→fr/de): ahí la coincidencia NO es señal fiable
# de «sin traducir». La señal real está en las lenguas léxicamente distantes (sw).
COGNATE_OK = {"es", "en", "gl", "pt", "it", "fr", "ca", "de"}
SPLIT = re.compile(r"[,;/|，、;；]+")
PAREN_ONLY = re.compile(r"^[(\[].*[)\]]\.?$")
PUNCT = " .,;:!?¡¿\"'()[]"


def _norm(text) -> str:
    return re.sub(r"\s+", " ", str(text or "").strip().lower()).strip(PUNCT)


def _segments(term: str) -> list[str]:
    return [p for p in (_norm(p) for p in SPLIT.split(term)) if p]


def issues(term_row: dict, gloss_es: str | None = None, lang: str | None = None) -> list[str]:
    """Avisos de calidad para un término (puede devolver varios o ninguno)."""
    term = str(term_row.get("term") or "")
    lang = lang or term_row.get("lang")
    text = term.strip()
    out: list[str] = []
    if not text:
        return ["vacío"]
    if PAREN_ONLY.match(text):
        out.append("solo-paréntesis")
    # Si la glosa ya empaqueta sinónimos («morado / violeta»), que el destino los
    # colapse en una sola palabra es lo esperable, no un artefacto.
    if "/" not in str(gloss_es or ""):
        segments = _segments(text)
        if len(segments) >= 2 and len(set(segments)) < len(segments):
            out.append("repetición")
    if "\n" in term:
        out.append("salto-de-línea")
    if lang in CJK_LANGS and re.search(r"[,，、;；]", text):
        out.append("posible-run-on")
    if len(text.split()) >= 9:
        out.append("frase-larga")
    if gloss_es and lang not in COGNATE_OK and len(gloss_es) >= 4 \
            and _norm(text) == _norm(gloss_es):
        out.append("sin-traducir")
    return out


def analyze(corpus_dir, show=0) -> dict:
    """Recorre el corpus y devuelve ``{lang: Counter(avisos)}`` (+ muestras)."""
    corpus = Path(corpus_dir)
    concepts = {c["id"]: c for c in common.read_jsonl(corpus / "concepts.jsonl")}
    langs_dir = corpus / "languages"
    by_lang: dict[str, Counter] = {}
    samples: dict[str, list] = {}
    for lang_dir in sorted(p for p in langs_dir.iterdir() if p.is_dir()):
        lg = lang_dir.name
        counts: Counter = Counter()
        picked: list = []
        for row in common.read_jsonl(lang_dir / "terms.jsonl"):
            found = issues(row, concepts.get(row.get("concept"), {}).get("gloss_es"), lg)
            if found:
                counts.update(found)
                if len(picked) < show:
                    picked.append((row.get("concept"), row.get("term"), found))
        by_lang[lg] = counts
        samples[lg] = picked
    return {"by_lang": by_lang, "samples": samples}


def run(corpus_dir, show=0, fail_on=None) -> int:
    report = analyze(corpus_dir, show=show)
    by_lang = report["by_lang"]
    total = sum(sum(c.values()) for c in by_lang.values())
    print(f"calidad: {total} avisos en {sum(1 for c in by_lang.values() if c)} idiomas")
    for lg in sorted(by_lang):
        counts = by_lang[lg]
        if counts:
            print(f"  {lg}: {sum(counts.values())} {dict(counts)}")
    for lg in sorted(report["samples"]):
        for concept, term, found in report["samples"][lg]:
            print(f"    [{lg}] {concept} = {term!r} -> {found}")
    if fail_on is not None and total > fail_on:
        return 1
    return 0


def main(argv=None) -> int:
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("corpus", nargs="?", default="corpus")
    parser.add_argument("--show", type=int, default=0,
                        help="muestras por idioma (0 = ninguna)")
    parser.add_argument("--strict", action="store_true",
                        help="falla si hay cualquier aviso")
    args = parser.parse_args(argv)
    return run(args.corpus, show=args.show, fail_on=0 if args.strict else None)


if __name__ == "__main__":
    sys.exit(main())
