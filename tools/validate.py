"""Validación de schema y estado de revisión del corpus."""
from __future__ import annotations
import sys
from pathlib import Path
from . import common


def validate_concepts(rows: list[dict]) -> list[str]:
    errors, seen = [], set()
    for i, r in enumerate(rows):
        for f in common.CONCEPT_REQUIRED:
            if not r.get(f):
                errors.append(f"concept[{i}]: falta '{f}'")
        cid = r.get("id")
        if cid in seen:
            errors.append(f"concept[{i}]: id duplicado '{cid}'")
        seen.add(cid)
    return errors


def validate_terms(rows: list[dict], concept_ids: set[str]) -> list[str]:
    errors, seen = [], set()
    for i, r in enumerate(rows):
        for f in common.TERM_REQUIRED:
            if not r.get(f):
                errors.append(f"term[{i}]: falta '{f}'")
        if r.get("review") not in common.REVIEW_STATES:
            errors.append(f"term[{i}]: review inválido '{r.get('review')}'")
        if r.get("concept") and r["concept"] not in concept_ids:
            errors.append(f"term[{i}]: concept desconocido '{r['concept']}'")
        key = (r.get("concept"), r.get("lang"), r.get("term"))
        if key in seen:
            errors.append(f"term[{i}]: duplicado {key}")
        seen.add(key)
    return errors


def review_report(terms: list[dict]) -> dict:
    rep = {s: 0 for s in common.REVIEW_STATES}
    rep["otros"] = 0
    for r in terms:
        state = r.get("review")
        if state in rep:
            rep[state] += 1
        else:
            rep["otros"] += 1
    return rep


def run(corpus_dir) -> int:
    corpus = Path(corpus_dir)
    concepts = common.read_jsonl(corpus / "concepts.jsonl")
    cids = {c.get("id") for c in concepts}
    errors = validate_concepts(concepts)
    all_terms = []
    langs_dir = corpus / "languages"
    if langs_dir.exists():
        for lang_dir in sorted(p for p in langs_dir.iterdir() if p.is_dir()):
            terms = common.read_jsonl(lang_dir / "terms.jsonl")
            all_terms += terms
            errors += validate_terms(terms, cids)
    rep = review_report(all_terms)
    print(f"conceptos: {len(concepts)} | términos: {len(all_terms)}")
    print("revisión:", rep)
    for e in errors:
        print("ERROR:", e)
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(run(sys.argv[1] if len(sys.argv) > 1 else "corpus"))
