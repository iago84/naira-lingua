"""Genera lecciones uniformes para cada idioma del corpus.

Cada **temática** (unidad) cubre el mismo conjunto de conceptos en todas las
lenguas —el cuerpo de la lección se construye desde el corpus, sin inventar
contenido—, de modo que la matriz de relaciones encaja entre idiomas. El
andamiaje pedagógico (título, objetivos y explicación) se redacta en español e
inglés y, si se pasa un traductor (``--engine argo``), se traduce al idioma de
cada lección: así la explicación se entiende siempre **en el idioma de origen**
de la lección, sea cual sea el par de idiomas que use el estudiante.

Es determinista e idempotente: mismo corpus y mismas traducciones ⇒ mismo JSON.
El campo ``generator`` marca el origen automático de cada lección.
"""
from __future__ import annotations
import sys
from pathlib import Path
from . import common

GLOSS_LANGS = ("es", "en")
SPEAKERS = ["A", "B"]
DEFAULT_LIMIT = 12

# Temáticas comunes a todas las lenguas. ``glosses`` fija el orden exacto de un
# diálogo; si falta, se toman los conceptos del ``domain`` (hasta ``limit``).
THEMES = [
    {"unit": 1, "lesson": 1, "domain": "saludos-y-expresiones",
     "glosses": ["hola", "buenos días", "buenas tardes", "buenas noches",
                 "gracias", "por favor", "perdón / disculpe", "adiós",
                 "hasta luego", "sí", "no"],
     "title": {"es": "Saludos y cortesía", "en": "Greetings and courtesy"},
     "objectives": {
         "es": ["Saludar y despedirse", "Dar las gracias y pedir por favor"],
         "en": ["Greet and say goodbye", "Thank and say please"]},
     "explanation": {
         "es": ("Expresiones básicas de cortesía para abrir y cerrar una "
                "conversación."),
         "en": ("Basic courtesy expressions to open and close a conversation.")}},
    {"unit": 2, "lesson": 1, "domain": "numeros",
     "title": {"es": "Los números", "en": "Numbers"},
     "objectives": {
         "es": ["Contar del cero al diez", "Reconocer los números básicos"],
         "en": ["Count from zero to ten", "Recognise basic numbers"]},
     "explanation": {
         "es": ("Los números del día a día: sirven para contar, decir la edad "
                "y hablar de precios."),
         "en": ("Everyday numbers: used to count, give your age and talk about "
                "prices.")}},
    {"unit": 3, "lesson": 1, "domain": "colores",
     "title": {"es": "Los colores", "en": "Colours"},
     "objectives": {
         "es": ["Nombrar los colores básicos", "Describir objetos por su color"],
         "en": ["Name basic colours", "Describe objects by colour"]},
     "explanation": {
         "es": "Los colores sirven para describir objetos, ropa y lugares.",
         "en": "Colours are used to describe objects, clothes and places."}},
    {"unit": 4, "lesson": 1, "domain": "familia-y-personas",
     "title": {"es": "La familia y las personas", "en": "Family and people"},
     "objectives": {
         "es": ["Nombrar a los miembros de la familia", "Hablar de personas"],
         "en": ["Name family members", "Talk about people"]},
     "explanation": {
         "es": "Palabras para referirse a la familia y a las personas cercanas.",
         "en": "Words to refer to family and the people around you."}},
    {"unit": 5, "lesson": 1, "domain": "cuerpo-humano",
     "title": {"es": "El cuerpo humano", "en": "The human body"},
     "objectives": {
         "es": ["Nombrar las partes del cuerpo", "Hablar de la salud"],
         "en": ["Name parts of the body", "Talk about health"]},
     "explanation": {
         "es": "Las partes del cuerpo, útiles para hablar de salud y cuidados.",
         "en": "Parts of the body, useful to talk about health and care."}},
    {"unit": 6, "lesson": 1, "domain": "comida-y-bebida",
     "title": {"es": "La comida y la bebida", "en": "Food and drink"},
     "objectives": {
         "es": ["Nombrar alimentos y bebidas", "Pedir en un restaurante"],
         "en": ["Name food and drinks", "Order in a restaurant"]},
     "explanation": {
         "es": ("Alimentos y bebidas básicos, muy útiles al comprar o comer "
                "fuera de casa."),
         "en": ("Basic foods and drinks, very useful when shopping or eating "
                "out.")}},
    {"unit": 7, "lesson": 1, "domain": "casa-y-hogar",
     "title": {"es": "La casa y el hogar", "en": "Home and household"},
     "objectives": {
         "es": ["Nombrar partes de la casa", "Describir objetos del hogar"],
         "en": ["Name parts of the house", "Describe household objects"]},
     "explanation": {
         "es": ("Vocabulario de la casa: habitaciones, muebles y objetos "
                "cotidianos."),
         "en": "House vocabulary: rooms, furniture and everyday objects."}},
    {"unit": 8, "lesson": 1, "domain": "tiempo-y-calendario",
     "title": {"es": "El tiempo y el calendario", "en": "Time and calendar"},
     "objectives": {
         "es": ["Decir días, meses y estaciones", "Hablar de fechas"],
         "en": ["Say days, months and seasons", "Talk about dates"]},
     "explanation": {
         "es": ("Palabras para situar acciones en el tiempo: días, meses y "
                "estaciones."),
         "en": "Words to place actions in time: days, months and seasons."}},
    {"unit": 9, "lesson": 1, "domain": "animales",
     "title": {"es": "Los animales", "en": "Animals"},
     "objectives": {
         "es": ["Nombrar animales comunes", "Describir animales"],
         "en": ["Name common animals", "Describe animals"]},
     "explanation": {
         "es": "Animales frecuentes, tanto domésticos como salvajes.",
         "en": "Common animals, both domestic and wild."}},
    {"unit": 10, "lesson": 1, "domain": "ciudad-y-lugares",
     "title": {"es": "La ciudad y los lugares", "en": "City and places"},
     "objectives": {
         "es": ["Nombrar lugares de la ciudad", "Pedir direcciones"],
         "en": ["Name places in the city", "Ask for directions"]},
     "explanation": {
         "es": "Lugares de la ciudad para moverse y pedir indicaciones.",
         "en": "Places in the city to move around and ask for directions."}},
    {"unit": 11, "lesson": 1, "domain": "ropa-y-accesorios",
     "title": {"es": "La ropa y los accesorios", "en": "Clothing and accessories"},
     "objectives": {
         "es": ["Nombrar prendas de ropa", "Ir de compras"],
         "en": ["Name clothes", "Go shopping"]},
     "explanation": {
         "es": "Prendas y accesorios, con palabras útiles para comprar ropa.",
         "en": "Clothes and accessories, with words useful for clothes shopping."}},
    {"unit": 12, "lesson": 1, "domain": "trabajo-y-profesiones",
     "title": {"es": "El trabajo y las profesiones", "en": "Work and professions"},
     "objectives": {
         "es": ["Nombrar profesiones", "Hablar del trabajo"],
         "en": ["Name professions", "Talk about work"]},
     "explanation": {
         "es": "Profesiones y palabras del mundo laboral.",
         "en": "Professions and words from the world of work."}},
]


def _pick(terms: list[dict]) -> dict | None:
    """Término preferido de un concepto (``verified`` primero), o ``None``."""
    if not terms:
        return None
    return next((t for t in terms if t.get("review") == "verified"), terms[0])


def _index(rows: list[dict]) -> dict:
    out: dict[str, list[dict]] = {}
    for t in rows:
        out.setdefault(t["concept"], []).append(t)
    return out


def _theme_concepts(concepts: list[dict], theme: dict) -> list[dict]:
    """Conceptos de una temática, en el orden fijado (o el del corpus)."""
    if theme.get("glosses"):
        order = list(theme["glosses"])
        want = set(order)
        selected = [c for c in concepts if c.get("gloss_es") in want]
        selected.sort(key=lambda c: order.index(c["gloss_es"]))
    else:
        selected = [c for c in concepts if c.get("domain") == theme["domain"]]
    limit = theme.get("limit", DEFAULT_LIMIT)
    return selected[:limit] if limit else selected


def _scaffold(theme: dict, lang: str, translate=None):
    """Título, objetivos y explicación de la temática, en el idioma pedido.

    Sin traductor sólo incluye los idiomas redactados a mano (es/en). Con
    traductor añade el idioma de la lección traduciendo desde español, de modo
    que la explicación se entiende en el idioma de origen.
    """
    title = dict(theme["title"])
    objectives = {k: list(v) for k, v in theme["objectives"].items()}
    explanation = dict(theme["explanation"])
    if translate is not None and lang not in title:
        texts = ([title["es"]] + list(objectives["es"]) + [explanation["es"]])
        try:
            out = list(translate(texts))
        except Exception:  # sin modelo para ese idioma: cae a es/en
            out = []
        if len(out) == len(texts):
            title[lang] = out[0]
            objectives[lang] = out[1:1 + len(objectives["es"])]
            explanation[lang] = out[-1]
    return title, objectives, explanation


def lesson_id(lang: str, theme: dict) -> str:
    return f"{lang}-u{theme['unit']}-l{theme['lesson']}"


def build_lesson(concepts, terms_by_lang, lang, theme, translate=None) -> dict:
    """Construye la lección de ``theme`` para el idioma ``lang`` desde el corpus."""
    selected = _theme_concepts(concepts, theme)
    index = {lg: _index(rows) for lg, rows in terms_by_lang.items()}
    cols = []
    for lg in (*GLOSS_LANGS, lang):
        if lg in terms_by_lang and lg not in cols:
            cols.append(lg)

    dialogue, table_rows, used = [], [], []
    for i, c in enumerate(selected):
        cid = c["id"]
        term = _pick(index.get(lang, {}).get(cid))
        if term is None:
            continue
        line = {"speaker": SPEAKERS[i % len(SPEAKERS)], "concept": cid,
                lang: term["term"]}
        row = []
        for lg in cols:
            ref = _pick(index.get(lg, {}).get(cid))
            value = ref["term"] if ref else ""
            if lg != lang:
                line[lg] = value
            row.append(value)
        dialogue.append(line)
        table_rows.append(row)
        used.append(cid)

    title, objectives, explanation = _scaffold(theme, lang, translate)
    return {
        "id": lesson_id(lang, theme), "lang": lang,
        "unit": theme["unit"], "lesson": theme["lesson"],
        "generator": "build_lessons",
        "title": title,
        "objectives": objectives,
        "explanation": explanation,
        "dialogue": dialogue,
        "tables": [{"type": "vocabulary", "title": " · ".join(cols),
                    "columns": list(cols), "rows": table_rows}],
        "exercises": [], "concepts": used,
    }


def run(repo_dir, translate_for=None, langs=None, themes=None) -> None:
    """Genera todas las lecciones para todos los idiomas del corpus.

    ``translate_for`` es ``(lang, texts) -> list[str]`` o ``None`` (sin
    traducción del andamiaje). ``langs``/``themes`` permiten acotar el trabajo.
    """
    repo = Path(repo_dir)
    concepts = common.read_jsonl(repo / "corpus" / "concepts.jsonl")
    langs_dir = repo / "corpus" / "languages"
    langs = langs or sorted(p.name for p in langs_dir.iterdir() if p.is_dir())
    themes = themes or THEMES
    terms_by_lang = {lg: common.read_jsonl(langs_dir / lg / "terms.jsonl")
                     for lg in langs}
    for lg in langs:
        translate = (lambda texts, lg=lg: translate_for(lg, texts)) \
            if translate_for else None
        written = 0
        for theme in themes:
            lesson = build_lesson(concepts, terms_by_lang, lg, theme,
                                  translate=translate)
            if not lesson["dialogue"]:
                continue
            path = langs_dir / lg / "lessons" / f"u{theme['unit']}-l{theme['lesson']}.json"
            common.write_json(path, lesson)
            written += 1
        print(f"{lg}: {written} lecciones")


def main(argv=None) -> int:
    import argparse, os
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("repo", nargs="?", default=".")
    parser.add_argument("--engine", choices=("none", "argo"),
                        default=os.environ.get("LESSONS_ENGINE", "none"),
                        help="traducción del andamiaje (título/objetivos/explicación)")
    parser.add_argument("--source", default="es",
                        help="idioma en que se redacta el andamiaje")
    args = parser.parse_args(argv)
    translate_for = None
    if args.engine == "argo":
        from .argo_engine import ArgoTranslator
        translator = ArgoTranslator(source=args.source)
        translate_for = lambda lang, texts: translator.translate(texts, lang)
    run(repo_dir=args.repo, translate_for=translate_for)
    return 0


if __name__ == "__main__":
    sys.exit(main())
