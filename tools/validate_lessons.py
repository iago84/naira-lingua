"""Validación de lecciones del corpus."""
from __future__ import annotations
import sys
from pathlib import Path
from . import common

LESSON_REQUIRED = ("id", "lang", "unit", "lesson", "title", "dialogue", "tables")


def validate_lesson(lesson: dict) -> list[str]:
    errors = []
    for f in LESSON_REQUIRED:
        if not lesson.get(f):
            errors.append(f"lección {lesson.get('id')}: falta '{f}'")
    for i, line in enumerate(lesson.get("dialogue", [])):
        if not line.get("speaker"):
            errors.append(f"lección {lesson.get('id')}: diálogo[{i}] sin speaker")
        texts = [k for k in line if k not in ("speaker", "concept")]
        if not texts:
            errors.append(f"lección {lesson.get('id')}: diálogo[{i}] sin texto")
    for i, t in enumerate(lesson.get("tables", [])):
        cols = t.get("columns", [])
        for row in t.get("rows", []):
            if len(row) != len(cols):
                errors.append(f"lección {lesson.get('id')}: tabla[{i}] fila no "
                              f"coincide con columnas")
    return errors


def run(corpus_dir) -> int:
    errors = []
    langs_dir = Path(corpus_dir) / "languages"
    if langs_dir.exists():
        for lang_dir in sorted(p for p in langs_dir.iterdir() if p.is_dir()):
            for f in sorted((lang_dir / "lessons").glob("*.json")) \
                    if (lang_dir / "lessons").exists() else []:
                errors += validate_lesson(common.read_json(f))
    for e in errors:
        print("ERROR:", e)
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(run(sys.argv[1] if len(sys.argv) > 1 else "corpus"))
