"""Migra el contenido v1 (formato plano) al modelo conceptocéntrico v2."""
from __future__ import annotations
import sys
from pathlib import Path
from . import common

LANG_KEYS = {"hi": "hindi", "ur": "urdu", "sw": "swahili"}
LANG_FILES = {"hi": "hindi_spanish_flashcards.json",
              "ur": "urdu_spanish_flashcards.json",
              "sw": "swahili_spanish_flashcards.json"}


def build_rows(v1: dict, lang: str, language_key: str):
    concepts, terms, seen = [], [], set()
    for card in v1["cards"]:
        domain = common.slugify(card["category"])
        cid = f"c:{domain}.{common.slugify(card['spanish'])}"
        if cid not in seen:
            seen.add(cid)
            concepts.append({"id": cid, "domain": domain,
                             "gloss_es": card["spanish"], "icon": card.get("icon")})
        terms.append({"concept": cid, "lang": lang,
                      "term": card[language_key],
                      "translit": card.get("transliteration"),
                      "source": "legacy_v1", "source_ref": f"card:{card['id']}",
                      "license": "CC-BY-SA-4.0", "review": "verified",
                      "reviewer": "migrate_v1"})
    return concepts, terms


def run(repo_dir) -> None:
    repo = Path(repo_dir)
    all_concepts, by_lang = [], {}
    for lang, fname in LANG_FILES.items():
        v1 = common.read_json(repo / "legacy" / "v1" / fname)
        concepts, terms = build_rows(v1, lang, LANG_KEYS[lang])
        all_concepts += concepts
        by_lang[lang] = terms
    # fusionar conceptos por id
    merged, seen = [], set()
    for c in all_concepts:
        if c["id"] not in seen:
            seen.add(c["id"])
            merged.append(c)
    common.write_jsonl(repo / "corpus" / "concepts.jsonl", merged)
    for lang, terms in by_lang.items():
        common.write_jsonl(repo / "corpus" / "languages" / lang / "terms.jsonl", terms)
    print(f"conceptos: {len(merged)} | " +
          ", ".join(f"{k}:{len(v)}" for k, v in by_lang.items()))


if __name__ == "__main__":
    run(sys.argv[1] if len(sys.argv) > 1 else ".")
