# tests/test_build.py
import json
from tools import build, common

def _corpus(tmp_path):
    (tmp_path / "corpus" / "languages" / "fr").mkdir(parents=True)
    common.write_jsonl(tmp_path / "corpus" / "concepts.jsonl",
                       [{"id": "c:saludos.hola", "domain": "saludos",
                         "gloss_es": "hola", "icon": "👋"}])
    common.write_jsonl(tmp_path / "corpus" / "languages" / "fr" / "terms.jsonl",
                       [{"concept": "c:saludos.hola", "lang": "fr", "term": "bonjour",
                         "source": "manual", "license": "CC-BY-SA-4.0",
                         "review": "verified"}])

def test_build_writes_manifest_and_language_files(tmp_path):
    _corpus(tmp_path)
    build.run(tmp_path)
    manifest = json.loads((tmp_path / "data" / "manifest.json").read_text(encoding="utf-8"))
    assert manifest["concepts"] == 1
    assert "fr" in manifest["languages"]
    assert (tmp_path / "data" / "terms.fr.json").exists()
