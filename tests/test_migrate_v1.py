# tests/test_migrate_v1.py
from tools import migrate_v1

V1 = {"version": 1, "count": 2, "cards": [
    {"id": 1, "category": "Saludos y expresiones", "hindi": "नमस्ते",
     "transliteration": "namaste", "spanish": "hola", "icon": "👋"},
    {"id": 2, "category": "Números", "hindi": "एक",
     "transliteration": "ek", "spanish": "uno", "icon": "1️⃣"},
]}

def test_build_rows_produces_concepts_and_terms():
    concepts, terms = migrate_v1.build_rows(V1, lang="hi", language_key="hindi")
    assert concepts[0]["id"] == "c:saludos-y-expresiones.hola"
    assert concepts[0]["domain"] == "saludos-y-expresiones"
    assert concepts[0]["icon"] == "👋"
    assert terms[0] == {
        "concept": "c:saludos-y-expresiones.hola", "lang": "hi", "term": "नमस्ते",
        "translit": "namaste", "source": "legacy_v1", "source_ref": "card:1",
        "license": "CC-BY-SA-4.0", "review": "verified", "reviewer": "migrate_v1",
    }
    assert len(terms) == 2

def test_build_rows_dedups_concepts_by_id():
    concepts, _ = migrate_v1.build_rows(V1, lang="hi", language_key="hindi")
    ids = [c["id"] for c in concepts]
    assert len(ids) == len(set(ids))
