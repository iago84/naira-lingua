# tests/test_validate.py
from tools import validate

CONCEPTS = [
    {"id": "c:x", "domain": "saludos", "gloss_es": "hola", "icon": "👋"},
    {"id": "c:x", "domain": "saludos", "gloss_es": "duplicado", "icon": "👋"},
]

TERMS = [
    {"concept": "c:x", "lang": "fr", "term": "bonjour", "source": "manual",
     "license": "CC-BY-SA-4.0", "review": "verified"},
    {"concept": "c:zzz", "lang": "fr", "term": "fantasma", "source": "manual",
     "license": "CC-BY-SA-4.0", "review": "nope"},
]

def test_concepts_detects_duplicate_id():
    errs = validate.validate_concepts(CONCEPTS)
    assert any("duplicado" in e for e in errs)

def test_terms_detects_unknown_concept_and_bad_review():
    errs = validate.validate_terms(TERMS, concept_ids={"c:x"})
    assert any("desconocido" in e for e in errs)
    assert any("review" in e for e in errs)

def test_terms_ok():
    ok = [{"concept": "c:x", "lang": "fr", "term": "bonjour", "source": "manual",
           "license": "CC-BY-SA-4.0", "review": "verified"}]
    assert validate.validate_terms(ok, concept_ids={"c:x"}) == []

def test_review_report_counts():
    rep = validate.review_report(TERMS)
    assert rep["verified"] == 1
    assert rep["otros"] == 1
