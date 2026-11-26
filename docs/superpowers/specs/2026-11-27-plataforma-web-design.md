# Diseño — Plataforma web (sub-proyecto b): `naira-lingua`

> Fecha: 2026-11-27 · Autor: agente TRAE · Estado: **propuesta para revisión**
> Proyecto: plataforma abierta multilengua `naira-lingua`. Este spec cubre **solo la
> plataforma web estática (sub-proyecto b)**. El núcleo de contenido (a) ya está
> implementado; monetización/legal (c) y marketing (d) tendrán su propio spec.

## 1. Contexto

El núcleo de contenido (a) ya entrega un corpus **conceptocéntrico** y su dataset
compilado:

- `data/manifest.json` — idiomas y recuentos.
- `data/concepts.json` — conceptos (sentidos) con `id` estable.
- `data/terms.<lang>.json` — términos por idioma enlazados por `concept`.

Hoy solo existe el visor v1 (`hindi_spanish_flashcards.html`), plano, acoplado a un
solo par (español pivote) y sin lecciones, quiz, diccionario ni progreso. Este spec
define la **app web** que consume el corpus v2.

## 2. Objetivo

Una **web estática, gratuita y sin backend** que permita aprender **cualquier
idioma desde y hacia cualquier otro** de la lista, con:

1. Flashcards any-to-any (volteo).
2. Quiz de opción múltiple con repaso de fallos.
3. Lecciones con diálogo, explicación y tablas (verbos/adjetivos).
4. Diccionario navegable (ver un concepto en todos los idiomas).
5. Progreso guardado en el dispositivo, sin cuentas.
6. Funciona **offline** e instalable (PWA).

## 3. Alcance / No-alcance

**Dentro:**
- App web estática en vanilla JS (sin build) servida desde GitHub Pages.
- Vistas: Portada, Selector de par, Flashcards, Quiz, Lecciones, Diccionario, Progreso.
- Consumo del dataset `data/*.json` y cálculo de pares en el cliente.
- Interfaz multi-idioma (**es + en**) con selector.
- PWA instalable y offline (service worker).
- Estilo **editorial/cuaderno** y accesibilidad AA.
- Ajuste en `tools/build.py` para emitir también `lessons.<lang>.json`.
- Commiteo del directorio `data/` (hoy en `.gitignore`) para que Pages lo sirva.

**Fuera (specs propios):**
- (c) Donaciones, publicidad y páginas legales (privacidad/cookies/licencias).
- (d) Políticas de marketing.
- Backend, cuentas de usuario, sincronización en la nube.

## 4. Decisiones de diseño

| Tema | Decisión |
|---|---|
| Experiencia v1 | Plataforma **completa**: flashcards + quiz + lecciones + diccionario + progreso (no solo flashcards). |
| Base técnica | **Estática vanilla JS, sin build** (ES Modules, `fetch` de JSON). |
| Estilo visual | **Editorial / cuaderno** (crema + serif), con modo oscuro opcional. |
| Idioma de UI | **Multi-idioma es + en** con selector persistido; estructura lista para más. |
| Offline | **PWA instalable** con service worker (cache-first). |
| Progreso | Local (`localStorage`), sin cuentas. |
| Hosting | **GitHub Pages** desde la raíz de `main`. |

## 5. Arquitectura y estructura de ficheros

Web estática; **sin** paso de compilación ni dependencias Node en producción. El
router funciona por **hash** (`#/study`, `#/lessons/fr-u1-l1`) para no depender de
reescrituras del servidor.

```
naira-lingua/
├─ index.html              # shell: <header>, <main id="app">, <footer>
├─ app.css                 # tema editorial (+ variante oscura)
├─ manifest.webmanifest    # PWA (nombre, iconos, theme, display)
├─ service-worker.js       # cache-first del shell + data/*
├─ assets/
│  └─ icons/               # icon-192.png, icon-512.png, maskable
├─ js/
│  ├─ main.js              # arranque: i18n, router, registro SW
│  ├─ router.js            # rutas por hash → vista
│  ├─ data.js              # carga+memoria: manifest, concepts, terms.<lang>, lessons.<lang>
│  ├─ pairs.js             # any-to-any: concept_id → {origen, destino}
│  ├─ store.js             # progreso en localStorage (namespace versionado)
│  ├─ i18n.js              # textos UI (es/en) + t(clave) + selector
│  └─ views/
│     ├─ home.js
│     ├─ study.js          # flashcards
│     ├─ quiz.js
│     ├─ lessons.js
│     ├─ dictionary.js
│     └─ progress.js
├─ data/                   # GENERADO por tools/build.py — se commitea
│  ├─ manifest.json
│  ├─ concepts.json
│  ├─ terms.<lang>.json
│  └─ lessons.<lang>.json
├─ tests/                  # tests Python existentes (tools/)
└─ js/tests/               # tests node:test de lógica pura
```

Responsabilidades: cada módulo de `js/` tiene una misión única; las vistas solo
componen HTML a partir de datos ya cargados y no hablan directamente con `fetch`.

## 6. Datos y "any-to-any" en el cliente

Flujo de datos:

1. `data.js` carga una vez `manifest.json` y `concepts.json`.
2. Al elegir un par (origen, destino), carga `terms.<origen>.json` y
   `terms.<destino>.json` (cache en memoria; no se recargan si ya están).
3. `pairs.js` construye `Map<concept_id, {src, tgt}>` uniendo ambos por `concept`.
4. Las vistas (study/quiz/dictionary) consumen ese mapa.

Reglas:

- Un concepto puede tener **varios términos por idioma** (sinónimos): la vista usa el
  primero `verified` o, si no hay, el primero disponible, y puede mostrar el resto.
- El **diccionario** necesita todos los idiomas: carga perezosa de
  `terms.<lang>.json` de cada idioma del manifest (hoy son pocos y pequeños); el
  resto de vistas solo cargan el par seleccionado.
- Filtro/etiqueta por `domain` (categorías actuales) reutilizado en study y dictionary.
- Sin ficheros N²: añadir un idioma = añadir `terms.<lang>.json` al manifest.

## 7. Vistas

**Portada (`#/`).** Qué es, "gratis y abierto", botón "Empezar"; enlaces a cada modo;
pie con licencias (código MIT / contenido CC-BY-SA) y proyectos de Naira.

**Selector de par.** Origen y destino (cualquiera del manifest, intercambiables),
modo (flashcards/quiz/lecciones/diccionario) y filtro por `domain`. Se recuerda el
último par en `localStorage`.

**Flashcards (`#/study`).** Tarjeta con término origen; clic/tecla para voltear y
ver el destino (con `translit`/`ipa` si existen); botones "Ya la sabía" / "Repasar";
recorrido con barra de progreso; guardado por par.

**Quiz (`#/quiz`).** Pregunta tipo "¿Cómo se dice «X»?" con N opciones (distractores
del mismo `domain`); feedback inmediato con `aria-live`; puntuación final y repaso de
los fallos.

**Lecciones (`#/lessons`, `#/lessons/<id>`).** Lista de unidades/lecciones del idioma
destino; vista de lección con **diálogo** (interlocutor + texto original +
traducción), **explicación** y **tablas** (verbos/adjetivos/nombres) renderizadas
genéricamente desde `columns`/`rows`.

**Diccionario (`#/dictionary`).** Buscador + filtro por `domain`; lista de conceptos;
al abrir uno, muestra su término en **todos** los idiomas del manifest.

**Progreso (`#/progress`).** Por par: tarjetas aprendidas, por repasar, aciertos de
quiz y racha; botón de reinicio. Sin cuentas: todo local.

Todas las vistas respetan el router por hash y son enlazables/compartibles.

## 8. i18n de la interfaz

- `js/i18n.js`: objeto de textos `{es:{...}, en:{...}}`, función `t(clave)`, y
  atributos de `lang`.
- Selector de idioma de UI en la cabecera; persistido en `localStorage`; por defecto
  `navigator.language` (fallback `es`).
- Los textos de UI son independientes de los idiomas del **contenido**.
- Claves iniciales (ejemplos): `nav.home`, `nav.study`, `nav.quiz`, `nav.lessons`,
  `nav.dictionary`, `nav.progress`, `study.knew`, `study.review`, `quiz.correct`,
  `quiz.wrong`, `common.selectSource`, `common.selectTarget`.

## 9. PWA / offline

- `manifest.webmanifest`: `name`, `short_name`, `start_url: "."`, `display:
  standalone`, `theme_color`, `background_color`, iconos 192/512 (+ maskable).
- `service-worker.js`: precachea el **shell** (`index.html`, `app.css`, `js/**`) y
  los `data/*.json`; estrategia **cache-first** con versión de caché (p. ej.
  `naira-lingua-v1`); `activate` limpia cachés antiguas.
- Registro del SW en `main.js` solo en `http(s)`.
- Resultado: instalable y funcional sin conexión tras la primera visita.

## 10. Estilo visual y accesibilidad

- Tema **editorial/cuaderno**: fondo crema, tipografía serif para los términos,
  sans para la UI, bordes finos, acentos cálidos.
- **Modo oscuro** opcional vía `prefers-color-scheme` (variables CSS).
- Accesibilidad: HTML semántico, foco visible, navegación por teclado (volteo y
  opciones del quiz), `aria-live` para feedback, contraste AA, `lang` correcto en
  textos multilingües y `dir` cuando aplique (p. ej. urdu).

## 11. Testing

- **Lógica pura** (`pairs.js`, `store.js`, `i18n.js`, `router.js`) con **`node:test`**
  (integrado en Node, sin dependencias): `node --test js/tests`.
- **Corpus**: los tests Python existentes (`tools/`, `pytest`) siguen siendo la
  compuerta de contenido; `check_all.py` valida y compila.
- **Vistas**: verificación manual con `python -m http.server` servido desde la raíz
  del repo (y, opcionalmente, el skill de navegador para revisar flujos).
- **PWA**: comprobación manual de que tras la primera carga la app abre en modo
  offline.

## 12. Despliegue en GitHub Pages

- Pages sirve la **raíz de la rama `main`** (repo de proyecto:
  `https://<usuario>.github.io/naira-lingua/`).
- Se **commitea `data/`** (se quita de `.gitignore`) para que los JSON estén
  disponibles; `tools/build.py` los regenera de forma determinista.
- Sin CI obligatoria. (Futuro, opcional: una Action que corra `check_all` + `build`
  y falle el push si el corpus no valida o `data/` no está al día.)
- Rutas relativas (sin barra inicial) para funcionar bajo el subpath del repo.

## 13. Criterios de aceptación

- La app carga desde `main` en GitHub Pages y muestra los idiomas de
  `data/manifest.json`.
- Se puede estudiar **cualquier par** presente (p. ej. fr→it, it→hi) sin ficheros por
  par.
- Flashcards, quiz, lecciones, diccionario y progreso funcionan y persisten el
  progreso entre sesiones.
- La UI cambia **es↔en** con el selector, y el texto de contenido es independiente.
- Tras la primera visita, la app abre y funciona **sin conexión** y es instalable.
- Los tests `node --test js/tests` y `pytest tools tests` pasan.
- No se rompe el flujo de contenido existente (`check_all.py` sigue en verde).

## 14. Riesgos y mitigaciones

| Riesgo | Mitigación |
|---|---|
| `data/` desactualizado en el repo | `check_all` + `build` como paso previo al commit; opcional Action futura. |
| Descarga excesiva de JSON | Cargar solo el par necesario; diccionario con carga perezosa; cache del SW. |
| Cache del service worker sirviendo datos viejos | Versionar la caché y limpiar en `activate`. |
| Accesibilidad en idiomas RTL (urdu) | `dir="rtl"` por término/lección; revisión manual. |
| Sin build → duplicación JS | Módulos ES pequeños y enfocados; tests de lógica pura. |

## 15. Relación con otros sub-proyectos

| # | Sub-proyecto | Estado |
|---|---|---|
| a | Núcleo de contenido v2 | Implementado y verificado |
| b | **Plataforma web gratis (este spec)** | Diseño aprobado; pendiente plan de implementación |
| c | Monetización (donaciones + publicidad) y legal | Pendiente de spec |
| d | Políticas de marketing | Pendiente de spec |

La plataforma (b) deja **puntos de anclaje** para (c): un slot de cabecera/pie para
enlace de donaciones y un contenedor reservado para publicidad, sin activarlos aún.
