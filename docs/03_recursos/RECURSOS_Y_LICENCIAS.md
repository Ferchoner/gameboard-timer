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
| Handjet (variable, pesos 100–900, subconjunto latino) | `assets/fonts/handjet-latin.woff2` | Textos y números del timer (`assets/css/_fonts.scss`) | Google Fonts (proyecto en github.com/google/fonts, `ofl/handjet`) | SIL OFL 1.1 (`assets/fonts/LICENSE-handjet.txt`) |
| Khand 500 y 700 (subconjunto latino) | `assets/fonts/khand-500-latin.woff2`, `assets/fonts/khand-700-latin.woff2` | Nombres de jugador y títulos (`assets/css/_fonts.scss`) | Google Fonts (proyecto en github.com/google/fonts, `ofl/khand`) | SIL OFL 1.1 (`assets/fonts/LICENSE-khand.txt`) |
| Bootstrap 5 | dependencia npm | Estilos y modales; solo las partes usadas (`assets/css/master.scss` y `plugins/useBootstrap.client.ts`, SPEC 10) | Bootstrap | MIT |

### Iconos (Material Symbols)

La fuente se sirve desde el propio sitio (spec 06) y solo trae los iconos que usa la app, listados
en `ICON_NAMES` de `scripts/update-icon-font.mjs`. Para usar un icono nuevo:

1. Agregar su nombre a `ICON_NAMES`.
2. Correr `node scripts/update-icon-font.mjs` (descarga el subconjunto de Google Fonts y
   reemplaza el `.woff2`).
3. Hacer commit del `.woff2` nuevo junto con el cambio.

Si se usa un icono que no está en la lista, `tests/unit/icons.spec.js` falla y dice cuál falta.

### Fuentes de texto (Handjet y Khand)

Las fuentes de texto (Handjet y Khand) se sirven desde `assets/fonts/` desde la SPEC 10: solo el
subconjunto latino (incluye acentos y ñ), Handjet como fuente variable y Khand en los pesos 500 y 700.
La app ya no pide nada a Google Fonts al cargar. Los `@font-face` están en `assets/css/_fonts.scss`.
Para usar otro peso de Khand hay que agregar su archivo latino y su `@font-face`; la licencia OFL
incluida lo cubre.

Al agregar un recurso nuevo: anotarlo aquí con ruta, uso, origen y licencia en el mismo PR.
