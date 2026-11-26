# tests/test_validate_lessons.py
from tools import validate_lessons

GOOD = {"id": "fr-u1-l1", "lang": "fr", "unit": 1, "lesson": 1,
        "title": {"fr": "Salutations", "es": "Saludos"},
        "dialogue": [{"speaker": "A", "fr": "Bonjour !", "es": "¡Hola!"}],
        "tables": [{"type": "verb", "title": "être", "columns": ["persona", "presente"],
                    "rows": [["je", "suis"]]}]}

def test_valid_lesson_has_no_errors():
    assert validate_lessons.validate_lesson(GOOD) == []

def test_missing_dialogue_speaker_is_error():
    bad = dict(GOOD, dialogue=[{"fr": "Bonjour !"}])
    assert any("speaker" in e for e in validate_lessons.validate_lesson(bad))

def test_table_rows_must_match_columns():
    bad = dict(GOOD, tables=[{"type": "verb", "title": "x",
                              "columns": ["a", "b"], "rows": [["only-one"]]}])
    assert any("columnas" in e for e in validate_lessons.validate_lesson(bad))
