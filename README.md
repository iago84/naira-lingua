# naira·lingua

**naira·lingua** es una plataforma web abierta para aprender cualquier idioma
desde y hacia cualquier otro: flashcards, quiz, lecciones, diccionario y
progreso. Es una **web estática** (vanilla JS, ES Modules, sin build), **PWA
instalable y offline**. El código es **MIT** y el contenido **CC-BY-SA**.

## Estructura

- `index.html` + `app.css`: shell de la aplicación.
- `js/`: lógica (router, store, i18n, datos) y vistas (`js/views/`).
- `data/`: dataset compilado del corpus, **versionado** (lo consume la web).
- `corpus/`: fuente del contenido (conceptos, idiomas y lecciones).
- `tools/`: validación y build del corpus (Python).
- `tests/`: tests Python de las herramientas.
- `js/tests/`: tests JS (Node).

## Servir en local

```powershell
python -m tools.build .
python -m http.server 8080
```

Abre `http://localhost:8080/`.

> El build debe ejecutarse **como módulo** (`python -m tools.build .`): los
> scripts de `tools/` usan imports relativos y no funcionan como script directo.

## Tests

```powershell
node --test js/tests/*.test.js
python -m pytest tests -q
python -m tools.check_all .
```

## Publicar en GitHub Pages

El sitio se sirve desde la rama `main` en la **raíz** del repositorio. `data/`
debe estar **versionado** (Pages no ejecuta Python).

El workflow [`.github/workflows/build-data.yml`](.github/workflows/build-data.yml)
regenera `data/` automáticamente: cuando un push a `main` toca `corpus/` o
`tools/`, valida el corpus y recompila el dataset, commiteando `data/` si cambió.
La fecha del manifiesto es **determinista** (proviene del último commit que tocó
`corpus/`), así que no se generan commits vacíos. También puede lanzarse a mano
desde la pestaña *Actions* (`workflow_dispatch`).

Para reproducir el resultado en local basta `python -m tools.check_all .`.
