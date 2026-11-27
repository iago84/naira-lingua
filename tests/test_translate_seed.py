# tests/test_translate_seed.py
from tools import translate_seed, common


def _corpus(tmp_path):
    common.write_jsonl(tmp_path / "corpus" / "concepts.jsonl", [
        {"id": "c:a", "domain": "d", "gloss_es": "hola", "icon": "👋"},
        {"id": "c:b", "domain": "d", "gloss_es": "adiós", "icon": "👋"},
    ])
    common.write_jsonl(tmp_path / "corpus" / "languages" / "it" / "terms.jsonl", [
        {"concept": "c:a", "lang": "it", "term": "ciao", "source": "manual",
         "license": "CC-BY-SA-4.0", "review": "verified"},
    ])


def test_translate_seed_only_fills_missing(tmp_path):
    _corpus(tmp_path)
    seen = []

    def fake(texts):
        seen.append(list(texts))
        return ["ARRIVEDERCI"]

    n = translate_seed.run(tmp_path, "it", translate=fake)
    assert seen == [["adiós"]]  # sólo el concepto sin término
    assert n == 1
    terms = common.read_jsonl(tmp_path / "corpus" / "languages" / "it" / "terms.jsonl")
    assert [t["term"] for t in terms] == ["ciao", "ARRIVEDERCI"]
    assert terms[1]["review"] == "auto_imported"
    assert terms[1]["source"] == "libretranslate"
    pack = common.read_jsonl(tmp_path / "corpus" / "_seed" / "it.auto.jsonl")
    assert pack[0]["gloss_es"] == "adiós"


def test_translate_seed_is_idempotent(tmp_path):
    _corpus(tmp_path)
    translate_seed.run(tmp_path, "it", translate=lambda t: ["X"] * len(t))
    again = translate_seed.run(tmp_path, "it", translate=lambda t: ["Y"] * len(t))
    assert again == 0


def test_translate_seed_identity_for_anchor_language(tmp_path):
    """El idioma ancla (es) no se traduce: el término es la propia glosa."""
    _corpus(tmp_path)

    def boom(texts):  # nunca debe llamarse para el ancla
        raise AssertionError("el ancla no debe traducirse")

    n = translate_seed.run(tmp_path, "es", translate=boom, source="es")
    assert n == 2
    terms = common.read_jsonl(tmp_path / "corpus" / "languages" / "es" / "terms.jsonl")
    assert [t["term"] for t in terms] == ["hola", "adiós"]
    assert all(t["review"] == "verified" for t in terms)
    assert all(t["source"] == "corpus_anchor" for t in terms)
