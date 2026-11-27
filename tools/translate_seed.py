"""Genera packs ``_seed`` traduciendo el pivote español con LibreTranslate local.

El corpus es conceptocéntrico y el único anclaje textual de cada concepto es la
glosa en español (``gloss_es``). Este generador traduce esas glosas al idioma
objetivo para completar la matriz de relaciones (que todos los idiomas cubran los
mismos conceptos) y deja un pack reproducible en ``corpus/_seed/<lang>.auto.jsonl``.

Es **idempotente**: sólo traduce los conceptos que aún no tienen término en ese
idioma, así que re-ejecutarlo no duplica contenido. El contenido resultante se
marca ``review="auto_imported"`` (origen máquina) y ``source="libretranslate"``.
"""
from __future__ import annotations
import json, os, sys, urllib.request
from pathlib import Path
from . import common, import_seed

DEFAULT_ENDPOINT = "http://127.0.0.1:5000"
BATCH = 25


def _post(q, source, target, endpoint, timeout=300):
    body = json.dumps({"q": q, "source": source, "target": target,
                       "format": "text"}).encode("utf-8")
    req = urllib.request.Request(endpoint.rstrip("/") + "/translate", data=body,
                                 headers={"Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return json.loads(r.read().decode("utf-8")).get("translatedText")


def _translate_chunk(chunk, source, target, endpoint):
    try:
        res = _post(chunk, source, target, endpoint)
        if isinstance(res, list) and len(res) == len(chunk):
            return [str(x) for x in res]
    except Exception:
        pass
    out = []
    for text in chunk:  # reserva: uno a uno si el lote falla
        try:
            res = _post(text, source, target, endpoint)
            if isinstance(res, list):
                res = res[0] if res else ""
            out.append(str(res or ""))
        except Exception:
            out.append("")
    return out


def translate_all(texts, target, endpoint, source="es", batch=BATCH):
    rows = []
    for i in range(0, len(texts), batch):
        rows += _translate_chunk(texts[i:i + batch], source, target, endpoint)
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
        pack.append({"gloss_es": concept["gloss_es"], "domain": concept["domain"],
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


if __name__ == "__main__":
    repo = sys.argv[1] if len(sys.argv) > 1 else "."
    langs = sys.argv[2:] or ["fr", "it"]
    url = os.environ.get("LIBRETRANSLATE_URL", DEFAULT_ENDPOINT)
    for lg in langs:
        run(repo, lg, endpoint=url)
