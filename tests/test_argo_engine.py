# tests/test_argo_engine.py
from tools import argo_engine


class _FakeDirection:
    def __init__(self, mapping):
        self.mapping = mapping

    def translate(self, texts):
        return [self.mapping.get(t, t.upper()) for t in texts]


def _wire(monkeypatch, tr, mapping):
    dirs = {k: _FakeDirection(v) for k, v in mapping.items()}
    monkeypatch.setattr(tr, "_run", lambda a, b, texts: dirs[(a, b)].translate(texts))


def test_translates_directly_to_pivot(monkeypatch):
    tr = argo_engine.ArgoTranslator()
    _wire(monkeypatch, tr, {("es", "en"): {"hola": "hello"}})
    assert tr.translate(["hola"], "en") == ["hello"]


def test_translates_with_pivot(monkeypatch):
    tr = argo_engine.ArgoTranslator()
    _wire(monkeypatch, tr, {("es", "en"): {"hola": "hello"},
                            ("en", "fr"): {"hello": "bonjour"}})
    assert tr.translate(["hola"], "fr") == ["bonjour"]


def test_identity_when_target_equals_source():
    tr = argo_engine.ArgoTranslator()
    assert tr.translate(["hola"], "es") == ["hola"]
