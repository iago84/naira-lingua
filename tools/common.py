"""Utilidades y schema del corpus naira-lingua."""
from __future__ import annotations
import json, re, unicodedata
from pathlib import Path

REVIEW_STATES = ("auto_imported", "needs_review", "verified")

CONCEPT_FIELDS = ("id", "wikidata", "concepticon", "pos", "domain", "icon",
                  "gloss_es", "gloss_en")
CONCEPT_REQUIRED = ("id", "domain", "gloss_es")

TERM_FIELDS = ("concept", "lang", "term", "translit", "ipa", "script", "pos",
               "gender", "notes", "source", "source_ref", "license", "review",
               "reviewer")
TERM_REQUIRED = ("concept", "lang", "term", "source", "license", "review")


def slugify(text: str) -> str:
    text = unicodedata.normalize("NFKD", str(text))
    text = "".join(c for c in text if not unicodedata.combining(c))
    text = re.sub(r"[^a-zA-Z0-9]+", "-", text).strip("-").lower()
    return text or "x"


def read_jsonl(path) -> list[dict]:
    path = Path(path)
    if not path.exists():
        return []
    rows = []
    with path.open(encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return rows


def write_jsonl(path, rows) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False, sort_keys=True) + "\n")


def read_json(path, default=None):
    path = Path(path)
    if not path.exists():
        return default
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def write_json(path, obj) -> None:
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as f:
        json.dump(obj, f, ensure_ascii=False, indent=2, sort_keys=True)
