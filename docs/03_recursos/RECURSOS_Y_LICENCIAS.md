# Recursos y licencias

Los recursos no se crean, reemplazan ni editan sin aprobación de Fernando. No se inventan
orígenes ni licencias: lo desconocido queda como **pendiente**.

| Recurso | Ruta | Uso | Origen | Licencia |
|---|---|---|---|---|
| Sonido de fin de tiempo | `assets/audio/time_over.mp3` | `TimerApp.vue`, al llegar a 0 | Pendiente | Pendiente |
| Logo | `assets/images/clock_logo.png` | Header | Pendiente | Pendiente |
| Icono de carga | `assets/images/loading_icon.svg` | `IsLoadingComponent.vue` | Pendiente | Pendiente |
| Favicons y manifest | `public/*.png`, `favicon.ico`, `safari-pinned-tab.svg`, `site.webmanifest`, `browserconfig.xml` | `nuxt.config.ts` | Pendiente | Pendiente |
| Material Symbols Outlined (subconjunto) | `assets/fonts/material-symbols-outlined.woff2` | Iconos de botones (`assets/css/_icons.scss`) | Google Fonts, variante `opsz 48, wght 400, FILL 0, GRAD 0` | Apache 2.0 (`assets/fonts/LICENSE-material-symbols.txt`) |
| Bootstrap 5 | dependencia npm | Estilos y modales | Bootstrap | MIT |

### Iconos (Material Symbols)

La fuente se sirve desde el propio sitio (spec 06) y solo trae los iconos que usa la app, listados
en `ICON_NAMES` de `scripts/update-icon-font.mjs`. Para usar un icono nuevo:

1. Agregar su nombre a `ICON_NAMES`.
2. Correr `node scripts/update-icon-font.mjs` (descarga el subconjunto de Google Fonts y
   reemplaza el `.woff2`).
3. Hacer commit del `.woff2` nuevo junto con el cambio.

Si se usa un icono que no está en la lista, `tests/unit/icons.spec.js` falla y dice cuál falta.
Las fuentes de texto (Handjet y Khand) siguen llegando de Google Fonts desde `master.scss`.

Al agregar un recurso nuevo: anotarlo aquí con ruta, uso, origen y licencia en el mismo PR.
