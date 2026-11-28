"""Compuerta de calidad: valida corpus + lecciones y compila el dataset."""
from __future__ import annotations
import sys
from . import validate, validate_lessons, validate_alphabets, quality, build


def run(repo_dir) -> int:
    code = (validate.run(f"{repo_dir}/corpus")
            | validate_lessons.run(f"{repo_dir}/corpus")
            | validate_alphabets.run(f"{repo_dir}/corpus"))
    # Informe de calidad (no bloquea el build): cuenta artefactos por idioma.
    quality.run(f"{repo_dir}/corpus")
    if code == 0:
        build.run(repo_dir)
    return code


if __name__ == "__main__":
    sys.exit(run(sys.argv[1] if len(sys.argv) > 1 else "."))
