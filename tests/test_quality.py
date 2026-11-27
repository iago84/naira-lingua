# tests/test_quality.py
from tools import quality


def _term(lang, term):
    return {"concept": "c:x.y", "lang": lang, "term": term, "source": "s",
            "license": "CC-BY-SA-4.0", "review": "auto_imported"}


def test_clean_term_has_no_issues():
    assert quality.issues(_term("fr", "bonjour")) == []


def test_flags_repetition_from_split_segments():
    assert "repetición" in quality.issues(_term("pt", "Desculpe-me, desculpe-me"))


def test_flags_lone_parenthetical():
    assert "solo-paréntesis" in quality.issues(_term("en", "(informal)"))


def test_flags_cjk_run_on_only_in_cjk():
    assert "posible-run-on" in quality.issues(_term("zh", "早上好,我刚从你那回来"))
    assert "posible-run-on" not in quality.issues(_term("fr", "bonjour, hi"))


def test_flags_untranslated_when_equals_gloss():
    found = quality.issues(_term("sw", "colorido"), gloss_es="colorido", lang="sw")
    assert "sin-traducir" in found
    # El ancla y las lenguas con cognados plausibles (gl/pt/fr/de) no se marcan.
    assert "sin-traducir" not in quality.issues(_term("es", "hola"),
                                                gloss_es="hola", lang="es")
    assert "sin-traducir" not in quality.issues(_term("gl", "verde"),
                                                gloss_es="verde", lang="gl")


def test_repetition_skipped_when_gloss_bundles_synonyms():
    assert quality.issues(_term("gl", "violeta /violeta"),
                          gloss_es="morado / violeta", lang="gl") == []


def test_flags_empty_and_newline():
    assert quality.issues(_term("fr", "")) == ["vacío"]
    assert "salto-de-línea" in quality.issues(_term("fr", "a\nb"))


def _make_corpus(tmp_path):
    from tools import common
    common.write_jsonl(tmp_path / "corpus" / "concepts.jsonl",
                       [{"id": "c:x.y", "domain": "x", "gloss_es": "hola"}])
    common.write_jsonl(tmp_path / "corpus" / "languages" / "pt" / "terms.jsonl",
                       [_term("pt", "Desculpe-me, desculpe-me")])


def test_run_reports_and_gates_on_threshold(tmp_path):
    _make_corpus(tmp_path)
    corpus = tmp_path / "corpus"
    assert quality.run(corpus, fail_on=None) == 0
    assert quality.run(corpus, fail_on=0) == 1
