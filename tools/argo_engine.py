"""Motor de traducción por lotes directo sobre los modelos Argos locales.

Traduce listas de glosas cortas **sin servidor y sin detección de límites de
frase** (los glosarios son sintagmas, no prosa), reutilizando los paquetes Argos
instalados y ``ctranslate2`` directamente. Es la vía rápida para generar
``corpus/_seed`` a granel.

Los paquetes Argos indexan ``es->en`` y ``en->fr``/``en->it`` pero **no**
``es->fr`` ni ``es->it``, así que se traduce con **pivote en inglés**
(``es->en-><destino>``).

Los imports de ``ctranslate2`` y ``argostranslate`` son perezosos: este módulo
se puede importar sin esas dependencias instaladas (por ejemplo en la suite de
tests), y sólo fallan al llamar a :meth:`ArgoTranslator.translate`.
"""
from __future__ import annotations

PIVOT = "en"
INTRA_THREADS = 1
INTER_THREADS = 1
BEAM_SIZE = 1
MAX_BATCH_TOKENS = 1024
REPETITION_PENALTY = 1.5


def _translate_direction(pkg, translator, texts, beam_size, max_batch_tokens,
                         repetition_penalty):
    """Traduce ``texts`` de una sola dirección con un paquete Argos."""
    tokenized = [pkg.tokenizer.encode(t) for t in texts]
    target_prefix = None
    if pkg.target_prefix:
        target_prefix = [[pkg.target_prefix]] * len(tokenized)
    batches = translator.translate_batch(
        tokenized, target_prefix=target_prefix, replace_unknowns=True,
        max_batch_size=max_batch_tokens, batch_type="tokens",
        beam_size=beam_size, num_hypotheses=1, length_penalty=0.2,
        repetition_penalty=repetition_penalty)
    out = []
    for batch in batches:
        value = pkg.tokenizer.decode(batch.hypotheses[0])
        if pkg.target_prefix and value.startswith(pkg.target_prefix):
            value = value[len(pkg.target_prefix):]
        if value.startswith(" "):
            value = value[1:]
        out.append(value)
    return out


class ArgoTranslator:
    """Traduce lotes con pivote, cargando cada dirección Argos una sola vez."""

    def __init__(self, source="es", pivot=PIVOT, beam_size=BEAM_SIZE,
                 max_batch_tokens=MAX_BATCH_TOKENS,
                 repetition_penalty=REPETITION_PENALTY):
        self.source = source
        self.pivot = pivot
        self.beam_size = beam_size
        self.max_batch_tokens = max_batch_tokens
        self.repetition_penalty = repetition_penalty
        self._directions = {}

    def _find_package(self, from_code, to_code):
        from argostranslate import package as argosp
        for pkg in argosp.get_installed_packages():
            if pkg.from_code == from_code and pkg.to_code == to_code:
                return pkg
        raise FileNotFoundError(f"paquete Argos {from_code}->{to_code} no instalado")

    def _direction(self, from_code, to_code):
        key = (from_code, to_code)
        if key not in self._directions:
            import ctranslate2
            pkg = self._find_package(from_code, to_code)
            translator = ctranslate2.Translator(
                str(pkg.package_path / "model"), device="cpu",
                inter_threads=INTER_THREADS, intra_threads=INTRA_THREADS)
            self._directions[key] = (pkg, translator)
        return self._directions[key]

    def _run(self, from_code, to_code, texts):
        pkg, translator = self._direction(from_code, to_code)
        return _translate_direction(pkg, translator, list(texts), self.beam_size,
                                    self.max_batch_tokens, self.repetition_penalty)

    def translate(self, texts, target, source=None):
        texts = [str(t) for t in texts]
        source = source or self.source
        if target == source:
            return list(texts)
        if target == self.pivot:
            return self._run(source, target, texts)
        mid = self._run(source, self.pivot, texts)
        return self._run(self.pivot, target, mid)
