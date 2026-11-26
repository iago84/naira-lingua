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
debe estar **versionado** (Pages no ejecuta Python). Si en el futuro se añade
una GitHub Action, esta regenerará `data/` de forma determinista con
`python -m tools.build .`.
