# tests/test_import_seed.py
from tools import import_seed

PACK = [
    {"gloss_es": "hola", "domain": "saludos", "icon": "👋", "term": "bonjour",
     "translit": None, "ipa": "bɔ̃.ʒuʁ", "pos": "interj", "source": "wiktionary",
     "source_ref": "fr/bonjour", "license": "CC-BY-SA-4.0", "review": "verified"},
]

def test_seed_creates_concept_when_missing():
    concepts, terms = import_seed.build_rows(PACK, lang="fr", existing_concepts=[])
    assert concepts == [{"id": "c:saludos.hola", "domain": "saludos",
                         "gloss_es": "hola", "icon": "👋"}]
    assert terms[0]["term"] == "bonjour"
    assert terms[0]["lang"] == "fr"
    assert terms[0]["concept"] == "c:saludos.hola"

def test_seed_reuses_existing_concept():
    existing = [{"id": "c:saludos.hola", "domain": "saludos", "gloss_es": "hola"}]
    concepts, terms = import_seed.build_rows(PACK, lang="fr", existing_concepts=existing)
    assert concepts == []
    assert terms[0]["concept"] == "c:saludos.hola"

def test_seed_honours_explicit_concept_id():
    pack = [{"concept": "c:otro.hola", "gloss_es": "hola", "domain": "otro",
             "term": "bonjour", "source": "manual", "license": "CC-BY-SA-4.0",
             "review": "verified"}]
    existing = [{"id": "c:saludos.hola", "domain": "saludos", "gloss_es": "hola"}]
    concepts, terms = import_seed.build_rows(pack, lang="fr", existing_concepts=existing)
    assert concepts == []
    assert terms[0]["concept"] == "c:otro.hola"
