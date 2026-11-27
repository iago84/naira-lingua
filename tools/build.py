"""Compila el corpus a un dataset plano para la web."""
from __future__ import annotations
import datetime, os, subprocess, sys
from pathlib import Path
from . import common


def _build_timestamp(repo: Path) -> str:
    """Fecha de build determinista y reproducible.

    Prioriza ``SOURCE_DATE_EPOCH`` (convención de builds reproducibles); si no
    está, usa la fecha del último commit que tocó ``corpus/``; como último
    recurso, la hora actual. Así, recompilar el mismo corpus produce siempre el
    mismo campo ``generated`` y no se generan diffs espurios.
    """
    epoch = os.environ.get("SOURCE_DATE_EPOCH")
    if epoch:
        try:
            return datetime.datetime.fromtimestamp(int(epoch),
                                                   datetime.UTC).isoformat()
        except ValueError:
            pass
    try:
        cp = subprocess.run(["git", "log", "-1", "--format=%cI", "--", "corpus"],
                            cwd=repo, capture_output=True, text=True, timeout=10)
        if cp.returncode == 0 and cp.stdout.strip():
            return cp.stdout.strip()
    except (OSError, subprocess.SubprocessError):
        pass
    return datetime.datetime.now(datetime.UTC).isoformat()


def run(repo_dir) -> None:
    repo = Path(repo_dir)
    concepts = common.read_jsonl(repo / "corpus" / "concepts.jsonl")
    langs, counts, lesson_counts = [], {}, {}
    for lang_dir in sorted(p for p in (repo / "corpus" / "languages").iterdir()
                           if p.is_dir()):
        terms = common.read_jsonl(lang_dir / "terms.jsonl")
        common.write_json(repo / "data" / f"terms.{lang_dir.name}.json", terms)
        lessons = []
        lesson_dir = lang_dir / "lessons"
        if lesson_dir.exists():
            for fp in sorted(lesson_dir.glob("*.json")):
                lessons.append(common.read_json(fp, default={}))
        common.write_json(repo / "data" / f"lessons.{lang_dir.name}.json", lessons)
        langs.append(lang_dir.name)
        counts[lang_dir.name] = len(terms)
        lesson_counts[lang_dir.name] = len(lessons)
    manifest = {"generated": _build_timestamp(repo),
                "concepts": len(concepts), "languages": langs, "counts": counts,
                "lessons": lesson_counts}
    common.write_json(repo / "data" / "manifest.json", manifest)
    common.write_json(repo / "data" / "concepts.json", concepts)
    print(f"build ok: {len(concepts)} conceptos, idiomas={langs}")


if __name__ == "__main__":
    run(sys.argv[1] if len(sys.argv) > 1 else ".")
