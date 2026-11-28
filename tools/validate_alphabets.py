"""Validación del contenido de alfabetos (``corpus/alphabets/*.json``)."""
from __future__ import annotations
import sys
from pathlib import Path
from . import common

REQUIRED = ("lang", "script", "direction", "title", "sections")
DIRECTIONS = ("ltr", "rtl")


def validate_alphabet(obj: dict, name: str = "") -> list[str]:
    errors = []
    tag = name or obj.get("lang", "?")
    for f in REQUIRED:
        if not obj.get(f):
            errors.append(f"{tag}: falta '{f}'")
    if obj.get("direction") and obj["direction"] not in DIRECTIONS:
        errors.append(f"{tag}: direction inválida '{obj['direction']}'")
    if not (obj.get("title") or {}).get("es"):
        errors.append(f"{tag}: title sin 'es'")
    for si, sec in enumerate(obj.get("sections") or []):
        if not sec.get("items"):
            errors.append(f"{tag}: sección[{si}] sin items")
            continue
        keys = [c.get("key") for c in (sec.get("columns") or [])]
        if not keys:
            errors.append(f"{tag}: sección[{si}] sin columnas")
        seen = set()
        for ii, it in enumerate(sec["items"]):
            if not it.get("char"):
                errors.append(f"{tag}: sección[{si}] item[{ii}] sin 'char'")
            if it.get("char") in seen:
                errors.append(f"{tag}: sección[{si}] char duplicado '{it['char']}'")
            seen.add(it.get("char"))
            for k in keys:
                if k not in it:
                    errors.append(f"{tag}: sección[{si}] item[{ii}] sin '{k}'")
    return errors


def run(corpus_dir) -> int:
    corpus = Path(corpus_dir)
    adir = corpus / "alphabets"
    langs_dir = corpus / "languages"
    known = {p.name for p in langs_dir.iterdir() if p.is_dir()} if langs_dir.exists() else set()
    errors, n = [], 0
    if not adir.exists():
        print("alfabetos: carpeta ausente")
        return 1
    for fp in sorted(adir.glob("*.json")):
        obj = common.read_json(fp, default={})
        n += 1
        errors += validate_alphabet(obj, fp.stem)
        if fp.stem != obj.get("lang"):
            errors.append(f"{fp.stem}: 'lang' ({obj.get('lang')}) no coincide con el nombre del archivo")
        if known and obj.get("lang") not in known:
            errors.append(f"{fp.stem}: idioma desconocido '{obj.get('lang')}'")
    missing = known - {fp.stem for fp in adir.glob("*.json")}
    print(f"alfabetos: {n} archivos" + (f" | faltan: {sorted(missing)}" if missing else ""))
    for e in errors:
        print("ERROR:", e)
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(run(sys.argv[1] if len(sys.argv) > 1 else "corpus"))
