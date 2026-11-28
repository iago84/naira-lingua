"""Transliteración y escritura del corpus.

Rellena dos campos del schema de términos:

* ``translit`` — romanización legible para quien no lee el alfabeto:
  rōmaji (Hepburn) para japonés y pinyin con tonos para chino. Los idiomas que
  ya traen transliteración curada (``hi``, ``ur``) no se tocan.
* ``script`` — familia de escritura del idioma (``latin``, ``devanagari``,
  ``arabic``, ``japanese``, ``han``), útil para elegir fuente y dirección.

Es idempotente: sólo rellena ``translit`` vacío en los idiomas que lo necesitan
y fija ``script`` si falta o difiere. Por defecto **no escribe** (dry-run);
hay que pasar ``--apply``.

Uso::

    python -m tools.translit .            # informe en seco
    python -m tools.translit . --apply    # escribe el corpus
"""
from __future__ import annotations
import sys
from pathlib import Path
from . import common

SCRIPT_BY_LANG = {
    "es": "latin", "en": "latin", "fr": "latin", "it": "latin",
    "pt": "latin", "de": "latin", "gl": "latin", "sw": "latin",
    "hi": "devanagari", "ur": "arabic", "ja": "japanese", "zh": "han",
}

# Idiomas cuya transliteración se genera aquí (el resto ya viene curada).
GENERATED = ("ja", "zh")

_ja = None
_zh = None


def romaji(term: str) -> str:
    """Romaniza japonés con Hepburn (kanji → lectura → rōmaji).

    Los tokens se separan con un espacio para que los compuestos
    (``正式な挨拶`` → ``seishiki na aisatsu``) sean legibles.
    """
    global _ja
    if _ja is None:
        import pykakasi
        _ja = pykakasi.kakasi()
    parts = [item.get("hepburn", "") for item in _ja.convert(term)]
    return " ".join(p for p in (s.strip() for s in parts) if p)


def pinyin(term: str) -> str:
    """Romaniza chino con pinyin y tonos (``nǐ hǎo``)."""
    global _zh
    if _zh is None:
        from pypinyin import Style, lazy_pinyin
        _zh = (lazy_pinyin, Style.TONE)
    lazy, style = _zh
    return " ".join(lazy(term, style=style))


def transliterate(term: str, lang: str) -> str:
    if lang == "ja":
        return romaji(term)
    if lang == "zh":
        return pinyin(term)
    return ""


def apply_lang(rows, lang):
    """Devuelve ``(filas_nuevas, n_cambiadas)`` sin escribir nada.

    En los idiomas generados (``ja``/``zh``) el campo ``translit`` se recalcula
    siempre desde el término, así que reejecutar nunca deja valores obsoletos.
    """
    changed = 0
    out = []
    for r in rows:
        row = dict(r)
        script = SCRIPT_BY_LANG.get(lang)
        if script and row.get("script") != script:
            row["script"] = script
        if lang in GENERATED:
            value = transliterate(str(row.get("term") or ""), lang)
            if value and row.get("translit") != value:
                row["translit"] = value
        if row != r:
            changed += 1
        out.append(row)
    return out, changed


def run(repo_dir, apply: bool = False, langs=None) -> int:
    repo = Path(repo_dir)
    langs_dir = repo / "corpus" / "languages"
    langs = langs or sorted(p.name for p in langs_dir.iterdir() if p.is_dir())
    total = 0
    for lg in langs:
        path = langs_dir / lg / "terms.jsonl"
        rows = common.read_jsonl(path)
        if not rows:
            continue
        out, changed = apply_lang(rows, lg)
        total += changed
        print(f"{lg}: {changed} filas ({'escrito' if apply else 'en seco'})")
        if apply and changed:
            common.write_jsonl(path, out)
    print(f"total: {total} filas {'escritas' if apply else 'por escribir'}")
    return 0


def main(argv=None) -> int:
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("repo", nargs="?", default=".")
    parser.add_argument("--apply", action="store_true",
                        help="escribe el corpus (por defecto sólo informa)")
    parser.add_argument("--langs", default="",
                        help="lista separada por comas para acotar idiomas")
    args = parser.parse_args(argv)
    langs = [x.strip() for x in args.langs.split(",") if x.strip()] or None
    return run(args.repo, apply=args.apply, langs=langs)


if __name__ == "__main__":
    sys.exit(main())
