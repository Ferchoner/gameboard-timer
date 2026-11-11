# CLAUDE.md — Timer for Friends (gameboard-timer)

Guía para Claude (y cualquier IA) que trabaje en este repositorio. **Responde siempre en español.**
Sé directo: propone, implementa lo acordado e informa. Pregunta solo cuando falte una decisión.

## Qué es

**Timer for Friends**: app web de temporizadores para juegos de mesa. Cada timer tiene varios
jugadores con nombre, color y tiempo; en modo "Continuous" (`progresive`) los turnos pasan de un
jugador al siguiente. Funciona como invitado (datos solo en memoria) o con cuenta (Firebase Auth),
en cuyo caso los timers se guardan en Firestore. El proyecto está terminado y publicado en
GitHub Pages; el trabajo actual es de **mejoras y ajustes**.

## Stack

Nuxt 4 (Vue 3) + Pinia + Bootstrap 5 + SCSS + Firebase 13 (Auth, Firestore, Analytics), con Node 24
(`.nvmrc`). Gestor de paquetes: solo npm.
Iconos: Material Symbols (Google Fonts). Git/GitHub, deploy con GitHub Actions a GitHub Pages.

## Fuente de verdad (leer antes de trabajar)

Toda la documentación vive en `docs/`. Si algo aquí contradice `docs/`, gana `docs/`.

- `docs/01_contexto/CONTEXTO_MAESTRO.md` — qué es, decisiones aprobadas, pendientes y mejoras.
- `docs/02_diseno/FUNCIONALIDAD_ACTUAL.md` — rutas, flujos y modelo de datos de Firestore.
- `docs/03_recursos/RECURSOS_Y_LICENCIAS.md` — audio, imágenes e iconos y su origen.
- `docs/06_prompts_IA/REGLAS_DE_TRABAJO_IA.md` — reglas y ciclo de una mejora.
- `docs/07_publicacion/` — cómo se despliega y checklist de pruebas manuales.
- `specs/` — specs de mejoras (flujo `/spec` → `/spec-impl`).

## Reglas no negociables

1. **Nunca trabajar ni hacer push directo a `master`.** Cada push a `master` publica en
   GitHub Pages. Todo va en una rama con su PR; el merge lo hace Fernando.
2. **No cambiar sin aprobación** `app.baseURL: '/gameboard-timer/'` (`nuxt.config.ts`), el workflow
   de deploy (`.github/workflows/main.yml`) ni la configuración de Firebase
   (`plugins/firebase.client.ts`).
3. **No cambiar el modelo de datos de Firestore** (colecciones `Users` y `Timers`, ver
   `docs/02_diseno/FUNCIONALIDAD_ACTUAL.md`) sin una spec aprobada: hay datos reales guardados.
4. **No reemplazar** el audio, el logo ni los iconos/favicons. Son recursos del proyecto.
5. **No ampliar el alcance** de una mejora sin aprobación. Lo que surja va a otra spec.
6. **No inventar** licencias, orígenes de recursos, datos ni decisiones. Lo desconocido queda
   como pendiente.

## Arquitectura

- `pages/` — solo enrutan; cada una renderiza un componente de `components/Page/`.
  Rutas: `/` y `/timers` (lista), `/timer-app/[id]` (timer en marcha, `id` = índice en el store),
  `/user` y `/user/signup-form`.
- `components/Page/` — lógica de cada pantalla (`TimerApp.vue` es el temporizador).
  `components/` — piezas reutilizables (header, footer, modal de timer, login, loading).
- `stores/` (Pinia) — `TimerStore.js` (timers, jugadores y sincronización con Firestore, clases
  `Timer` y `Player`), `UserStore.js` (sesión y usuario), `MainStore.js` (Firebase listo).
- `composables/` — `useFirebaseAuth.ts` y `useFirestore.ts`, envoltorios finos sobre Firebase.
- `plugins/` — `firebase.client.ts` (inicializa Firebase) y `useBootstrap.client.ts`.
- `assets/` — `css/master.scss`, `audio/time_over.mp3`, `images/`. `public/` — favicons y manifest.

## Forma de trabajar

- Cambios pequeños: rama, cambio, build, PR.
- Mejoras grandes: flujo spec-driven. `/spec` crea la spec en `specs/` (estado Borrador) y
  `/spec-impl` implementa solo specs con estado Aprobado, en su rama `spec-NN-slug`.
  Las specs se escriben en español (`Borrador`, `En revisión`, `Aprobado`, `Implementado`, `Obsoleto`).
- Antes de abrir un PR: `npm run build` sin errores, `npm test` en verde y la checklist manual de
  `docs/07_publicacion/CHECKLIST_PRUEBAS.md` en lo que toque el cambio. La CI
  (`.github/workflows/ci.yml`) repite el build, las unitarias y las E2E en cada PR.
- Un cambio de comportamiento lleva su prueba en `tests/unit/` o `tests/e2e/`.
- Al terminar: informa archivos modificados, pruebas hechas, riesgos y siguiente paso, y revisa
  qué documentos de `docs/` y el `README.md` quedaron desfasados.

## Comandos

- `npm ci` — instalar dependencias exactamente como el `package-lock.json` (igual que la CI y el
  deploy). `npm install <paquete>` solo para agregar o actualizar uno.
- `npm run dev` — servidor de desarrollo (http://localhost:3000/gameboard-timer/).
- `npm run build` — build de producción. Con `NITRO_PRESET=github-pages` genera `.output/public`,
  igual que el deploy.
- `npm run preview` — servir el build localmente.
- `npm run test:unit` — pruebas unitarias con Vitest (`tests/unit/`: `useCountdown` y `TimerStore`).
- `npm run test:e2e` — pruebas E2E con Playwright (`tests/e2e/`) contra el build de producción, en
  Chromium de escritorio y móvil emulado. Antes: `NITRO_PRESET=github-pages npm run build`. La
  primera vez: `npx playwright install chromium`.
- `npm test` — unitarias y E2E.

No hay typecheck ni linter configurados.
