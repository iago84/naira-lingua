"""Importa packs de fuentes abiertas (JSONL) al corpus v2."""
from __future__ import annotations
import sys
from pathlib import Path
from . import common


def build_rows(pack: list[dict], lang: str, existing_concepts: list[dict]):
    index = {c["gloss_es"]: c["id"] for c in existing_concepts if c.get("gloss_es")}
    new_concepts, terms = [], []
    for item in pack:
        cid = index.get(item["gloss_es"])
        if cid is None:
            cid = f"c:{common.slugify(item['domain'])}.{common.slugify(item['gloss_es'])}"
            index[item["gloss_es"]] = cid
            new_concepts.append({"id": cid, "domain": item["domain"],
                                 "gloss_es": item["gloss_es"],
                                 "icon": item.get("icon")})
        terms.append({"concept": cid, "lang": lang, "term": item["term"],
                      "translit": item.get("translit"), "ipa": item.get("ipa"),
                      "pos": item.get("pos"), "source": item["source"],
                      "source_ref": item.get("source_ref"),
                      "license": item["license"], "review": item.get("review",
                                                                     "needs_review")})
    return new_concepts, terms


def run(repo_dir, lang: str) -> None:
    repo = Path(repo_dir)
    concepts = common.read_jsonl(repo / "corpus" / "concepts.jsonl")
    pack = common.read_jsonl(repo / "corpus" / "_seed" / f"{lang}.jsonl")
    new_concepts, terms = build_rows(pack, lang, concepts)
    common.write_jsonl(repo / "corpus" / "concepts.jsonl", concepts + new_concepts)
    out = repo / "corpus" / "languages" / lang / "terms.jsonl"
    common.write_jsonl(out, common.read_jsonl(out) + terms)
    print(f"{lang}: +{len(terms)} términos, +{len(new_concepts)} conceptos")


if __name__ == "__main__":
    run(sys.argv[1] if len(sys.argv) > 1 else ".", sys.argv[2])
