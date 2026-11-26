# tests/test_common.py
from tools import common

def test_jsonl_roundtrip(tmp_path):
    p = tmp_path / "x.jsonl"
    rows = [{"id": "c:a", "icon": "👋"}, {"id": "c:b", "icon": "➕"}]
    common.write_jsonl(p, rows)
    assert common.read_jsonl(p) == rows

def test_read_jsonl_missing_file_returns_empty(tmp_path):
    assert common.read_jsonl(tmp_path / "nope.jsonl") == []

def test_slugify_strips_accents_and_spaces():
    assert common.slugify("Saludos y expresiones") == "saludos-y-expresiones"
    assert common.slugify("¿Cómo está?") == "como-esta"
