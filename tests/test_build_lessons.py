# tests/test_build_lessons.py
from tools import build_lessons, validate_lessons

CONCEPTS = [
    {"id": "c:g.hola", "domain": "g", "gloss_es": "hola", "icon": "👋"},
    {"id": "c:g.adios", "domain": "g", "gloss_es": "adiós", "icon": "👋"},
]

THEME = {
    "unit": 1, "lesson": 1, "domain": "g", "glosses": ["hola", "adiós"],
    "title": {"es": "Saludos", "en": "Greetings"},
    "objectives": {"es": ["Saludar"], "en": ["Greet"]},
    "explanation": {"es": "Básico", "en": "Basic"},
}


def _term(concept, lang, term):
    return {"concept": concept, "lang": lang, "term": term, "source": "s",
            "license": "CC-BY-SA-4.0", "review": "verified"}


def test_build_lesson_is_data_driven_and_valid():
    terms = {
        "es": [_term("c:g.hola", "es", "hola"), _term("c:g.adios", "es", "adiós")],
        "fr": [_term("c:g.hola", "fr", "bonjour")],
    }
    lesson = build_lessons.build_lesson(CONCEPTS, terms, "fr", THEME)
    assert lesson["id"] == "fr-u1-l1"
    assert lesson["lang"] == "fr"
    assert lesson["generator"] == "build_lessons"
    # Sólo se incluye 'hola': 'adiós' aún no tiene término en francés.
    assert [l["concept"] for l in lesson["dialogue"]] == ["c:g.hola"]
    assert lesson["dialogue"][0]["fr"] == "bonjour"
    assert lesson["dialogue"][0]["es"] == "hola"
    table = lesson["tables"][0]
    assert table["columns"] == ["es", "fr"]
    assert table["rows"] == [["hola", "bonjour"]]
    # Sin traductor, el andamiaje sólo trae los idiomas redactados a mano.
    assert lesson["title"] == {"es": "Saludos", "en": "Greetings"}
    assert validate_lessons.validate_lesson(lesson) == []


def test_build_lesson_prefers_verified_term():
    terms = {
        "es": [_term("c:g.hola", "es", "hola")],
        "fr": [
            {"concept": "c:g.hola", "lang": "fr", "term": "machine",
             "source": "s", "license": "L", "review": "auto_imported"},
            _term("c:g.hola", "fr", "bonjour"),
        ],
    }
    lesson = build_lessons.build_lesson(CONCEPTS, terms, "fr", THEME)
    assert lesson["dialogue"][0]["fr"] == "bonjour"


def test_scaffolding_is_translated_to_lesson_language():
    terms = {"es": [_term("c:g.hola", "es", "hola")],
             "ja": [_term("c:g.hola", "ja", "こんにちは")]}
    seen = {}

    def translate(texts):
        seen["texts"] = list(texts)
        return ["タイトル", "あいさつする", "きほん"]

    lesson = build_lessons.build_lesson(CONCEPTS, terms, "ja", THEME,
                                        translate=translate)
    assert seen["texts"] == ["Saludos", "Saludar", "Básico"]
    assert lesson["title"]["ja"] == "タイトル"
    assert lesson["objectives"]["ja"] == ["あいさつする"]
    assert lesson["explanation"]["ja"] == "きほん"


def test_themes_have_distinct_ids_and_scaffolding():
    ids = [(t["unit"], t["lesson"]) for t in build_lessons.THEMES]
    assert len(ids) == len(set(ids))
    for t in build_lessons.THEMES:
        assert t["title"]["es"] and t["explanation"]["es"]
