# tests/test_validate_alphabets.py
from tools import validate_alphabets

GOOD = {
    "lang": "ja", "script": "japanese", "direction": "ltr",
    "title": {"es": "Kanas"},
    "sections": [{
        "title": {"es": "Hiragana"},
        "columns": [{"key": "char", "label": {"es": "Signo"}}],
        "items": [{"char": "あ"}, {"char": "い"}],
    }],
}


def test_alphabet_ok():
    assert validate_alphabets.validate_alphabet(GOOD) == []


def test_alphabet_requires_fields():
    errs = validate_alphabets.validate_alphabet({"lang": "ja"})
    assert any("falta" in e for e in errs)


def test_alphabet_bad_direction():
    bad = {**GOOD, "direction": "up"}
    assert any("direction" in e for e in validate_alphabets.validate_alphabet(bad))


def test_alphabet_duplicate_char():
    dup = {**GOOD, "sections": [{
        "columns": [{"key": "char"}],
        "items": [{"char": "あ"}, {"char": "あ"}],
    }]}
    assert any("duplicado" in e for e in validate_alphabets.validate_alphabet(dup))


def test_alphabet_item_missing_column_key():
    bad = {**GOOD, "sections": [{
        "columns": [{"key": "char"}, {"key": "romaji"}],
        "items": [{"char": "あ"}],
    }]}
    assert any("romaji" in e for e in validate_alphabets.validate_alphabet(bad))


def test_alphabet_section_without_items():
    bad = {**GOOD, "sections": [{"columns": [{"key": "char"}], "items": []}]}
    assert any("sin items" in e for e in validate_alphabets.validate_alphabet(bad))
