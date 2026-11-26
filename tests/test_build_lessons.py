# tests/test_build_lessons.py
import json
from tools import build, common


def _corpus_with_lesson(tmp_path):
    (tmp_path / "corpus" / "languages" / "fr" / "lessons").mkdir(parents=True)
    common.write_jsonl(tmp_path / "corpus" / "concepts.jsonl",
                       [{"id": "c:x", "domain": "saludos", "gloss_es": "x"}])
    common.write_jsonl(tmp_path / "corpus" / "languages" / "fr" / "terms.jsonl",
                       [{"concept": "c:x", "lang": "fr", "term": "a",
                         "source": "t", "license": "CC-BY-SA-4.0",
                         "review": "verified"}])
    lesson = {"id": "fr-u1-l1", "lang": "fr", "unit": 1, "lesson": 1,
              "title": {"fr": "S"}, "dialogue": [], "tables": []}
    common.write_json(tmp_path / "corpus" / "languages" / "fr"
                      / "lessons" / "u1-l1.json", lesson)
    return lesson


def test_build_emits_lessons_per_language(tmp_path):
    lesson = _corpus_with_lesson(tmp_path)
    build.run(tmp_path)

    out = json.loads((tmp_path / "data" / "lessons.fr.json").read_text(encoding="utf-8"))
    assert out == [lesson]
    manifest = json.loads((tmp_path / "data" / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["lessons"]["fr"] == 1
