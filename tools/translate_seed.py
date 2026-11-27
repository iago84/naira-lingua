"""Genera packs ``_seed`` traduciendo el pivote español con LibreTranslate local.

El corpus es conceptocéntrico y el único anclaje textual de cada concepto es la
glosa en español (``gloss_es``). Este generador traduce esas glosas al idioma
objetivo para completar la matriz de relaciones (que todos los idiomas cubran los
mismos conceptos) y deja un pack reproducible en ``corpus/_seed/<lang>.auto.jsonl``.

Es **idempotente**: sólo traduce los conceptos que aún no tienen término en ese
idioma, así que re-ejecutarlo no duplica contenido. El contenido resultante se
marca ``review="auto_imported"`` (origen máquina) y ``source="libretranslate"``.

Los modelos Argos instalados no incluyen ``es->fr`` ni ``es->it``: sólo hay
``es->en`` y ``en->fr``/``en->it``. Por eso se traduce con **pivote en inglés**
(``es->en-><destino>``). Hay dos motores seleccionables con ``--engine``:

- ``http`` (por defecto): lotes contra un servidor LibreTranslate local
  (``LIBRETRANSLATE_URL``); requiere el servidor arrancado.
- ``argo``: lotes en proceso con ``ctranslate2`` sobre los paquetes Argos
  instalados (ver :mod:`tools.argo_engine`); requiere el entorno con
  ``argostranslate``/``ctranslate2`` (venv de LibreTranslate). Es la vía rápida.
"""
from __future__ import annotations
import json, os, sys, urllib.request
from pathlib import Path
from . import common, import_seed

DEFAULT_ENDPOINT = "http://127.0.0.1:5000"
BATCH = 25
PIVOT = "en"


def _post(q, source, target, endpoint, timeout=600):
    body = json.dumps({"q": q, "source": source, "target": target,
                       "format": "text"}).encode("utf-8")
    req = urllib.request.Request(endpoint.rstrip("/") + "/translate", data=body,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        out = json.loads(r.read().decode("utf-8")).get("translatedText")
    return [str(x) for x in out] if isinstance(out, list) else [str(out)]


def _pivot_chunk(chunk, target, endpoint, source, pivot):
    """Traduce un lote con pivote ``source->pivot->target``."""
    mid = _post(chunk, source, pivot, endpoint)
    if len(mid) != len(chunk):
        raise ValueError("longitud de pivote inesperada")
    return _post(mid, pivot, target, endpoint)


def _translate_chunk(chunk, target, endpoint, source, pivot):
    try:
        res = _pivot_chunk(chunk, target, endpoint, source, pivot)
        if len(res) == len(chunk):
            return res
    except Exception:
        pass
    out = []
    for text in chunk:  # reserva: elemento a elemento si el lote falla
        try:
            out += _pivot_chunk([text], target, endpoint, source, pivot)
        except Exception:
            out.append("")
    return out


def translate_all(texts, target, endpoint, source="es", pivot=PIVOT, batch=BATCH):
    rows = []
    for i in range(0, len(texts), batch):
        rows += _translate_chunk(texts[i:i + batch], target, endpoint, source, pivot)
    return rows


def run(repo_dir, lang: str, translate=None, endpoint=DEFAULT_ENDPOINT) -> int:
    repo = Path(repo_dir)
    concepts = common.read_jsonl(repo / "corpus" / "concepts.jsonl")
    terms_path = repo / "corpus" / "languages" / lang / "terms.jsonl"
    existing = common.read_jsonl(terms_path)
    covered = {t["concept"] for t in existing}
    todo = [c for c in concepts if c["id"] not in covered and c.get("gloss_es")]
    if not todo:
        print(f"{lang}: nada que hacer (cobertura completa)")
        return 0

    translate = translate or (lambda texts: translate_all(texts, lang, endpoint))
    translated = translate([c["gloss_es"] for c in todo])

    pack = []
    for concept, term in zip(todo, translated):
        term = (term or "").strip()
        if not term:
            continue
        pack.append({"concept": concept["id"],
                     "gloss_es": concept["gloss_es"], "domain": concept["domain"],
                     "icon": concept.get("icon"), "term": term, "translit": None,
                     "ipa": None, "pos": None, "source": "libretranslate",
                     "source_ref": f"argos es-{lang}", "license": "CC-BY-SA-4.0",
                     "review": "auto_imported"})
    common.write_jsonl(repo / "corpus" / "_seed" / f"{lang}.auto.jsonl", pack)

    new_concepts, term_rows = import_seed.build_rows(pack, lang, concepts)
    common.write_jsonl(repo / "corpus" / "concepts.jsonl", concepts + new_concepts)
    common.write_jsonl(terms_path, existing + term_rows)
    print(f"{lang}: +{len(term_rows)} términos (pack "
          f"_seed/{lang}.auto.jsonl), +{len(new_concepts)} conceptos")
    return len(term_rows)


def main(argv=None) -> int:
    import argparse
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("repo", nargs="?", default=".")
    parser.add_argument("langs", nargs="*", help="idiomas destino (por defecto fr it)")
    parser.add_argument("--engine", choices=("http", "argo"),
                        default=os.environ.get("SEED_ENGINE", "http"))
    parser.add_argument("--endpoint",
                        default=os.environ.get("LIBRETRANSLATE_URL", DEFAULT_ENDPOINT))
    args = parser.parse_args(argv)
    langs = args.langs or ["fr", "it"]
    if args.engine == "argo":
        from .argo_engine import ArgoTranslator
        translator = ArgoTranslator()
        for lg in langs:
            run(args.repo, lg,
                translate=lambda texts, lg=lg: translator.translate(texts, lg))
    else:
        for lg in langs:
            run(args.repo, lg, endpoint=args.endpoint)
    return 0


if __name__ == "__main__":
    sys.exit(main())
