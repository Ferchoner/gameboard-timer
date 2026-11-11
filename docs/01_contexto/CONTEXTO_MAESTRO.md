# Timer for Friends — Contexto maestro

> Estado al 2026-11-11. Documento vivo: se actualiza al cerrar cada mejora.

## Identidad y objetivo

App web de temporizadores para jugadores de juegos de mesa ("Timer for Friends", repo
`Ferchoner/gameboard-timer`). Hecha con Nuxt 4, Pinia, Bootstrap 5 y Firebase. Publicada en
GitHub Pages bajo la ruta `/gameboard-timer/`. Desarrollada en agosto de 2023 y considerada
terminada; ahora entra en una etapa de mejoras y ajustes.

## Concepto

- Un **timer** agrupa a los jugadores de una partida. Tiene título, lista de jugadores y el
  modo "Continuous" (`progresive`).
- Cada **jugador** tiene nombre, color y tiempo en minutos (todos comparten el tiempo del
  primero, de 10 a 120 min; 25 por defecto).
- Modo normal: cada jugador tiene su propio botón de iniciar, pausar y reiniciar.
- Modo Continuous: un solo control; "siguiente" pausa al jugador actual y arranca al siguiente.
- Al llegar a 0 suena `time_over.mp3`.
- **Invitado:** los timers viven solo en memoria y se pierden al recargar.
- **Con cuenta** (email y contraseña en Firebase Auth): los timers se guardan en Firestore y se
  cargan al iniciar sesión.

## Decisiones aprobadas

- Estructura de trabajo con IA basada en el proyecto `Ferchoner/pacmanlike-game`: `CLAUDE.md`,
  `docs/` y skills `/spec` y `/spec-impl` (Fernando, 2026-11-11).
- Tono de la IA: directo, sin rol de tutor (Fernando, 2026-11-11).
- Todo cambio va en rama y PR; nunca push directo a `master`, porque `master` despliega
  (Fernando, 2026-11-11).
- CI de build en cada PR (`.github/workflows/ci.yml`) (Fernando, 2026-11-11). Desde la spec 03
  corre también las pruebas unitarias y E2E (Fernando, 2026-11-11).
- Node 24, Nuxt 4, Firebase 13 y solo npm con `npm ci` en CI y deploy; se quitan
  `@sidebase/nuxt-session` y `@nuxtjs/robots`; las carpetas no se mueven a `app/` (spec 05,
  Fernando, 2026-11-11).

## Pendientes

- **Seguridad de Firestore:** las reglas publicadas (consola, 2026-11-11) dejan a cualquier usuario
  con sesión leer, cambiar y borrar datos de todos (`allow read, write: if request.auth != null`).
  La spec 04 versiona en `firestore.rules` las reglas por dueño. Falta que Fernando las publique
  en la consola después del merge.
- Avisos de deprecación de Sass en el build (vienen de Bootstrap 5 con `@import`). No rompen
  nada; corregirlos es otra spec.
- Las E2E (spec 03) solo cubren el modo invitado. Las reglas se prueban con el emulador
  (`npm run test:rules`, spec 04), pero probar la app con cuenta de punta a punta requiere que
  apunte al emulador, lo que toca `plugins/firebase.client.ts`: spec aparte.
- Origen y licencia de `time_over.mp3` y de `clock_logo.png`: desconocidos (ver
  `docs/03_recursos/RECURSOS_Y_LICENCIAS.md`).
- La página "My Account" (`/user`) está vacía y su botón está oculto en el header.

## Mejoras solicitadas

Lista de Fernando. Cada una se trabaja con su propia spec o PR.

- SPEC 01, corregir el editor de timers (`specs/01-editor-de-timers.md`): tiempo común como
  invitado, "−" quita al último, de 1 a 12 jugadores, validación del modal y confirmación al
  borrar. Implementada y fusionada en `master` (PR #3, 2026-11-11).
- SPEC 02, reloj fiable y pantalla encendida (`specs/02-reloj-fiable.md`): tiempo con
  `Date.now()`, Wake Lock en la pantalla del timer, alarma al volver, Continuous sin trabas y
  "Timer not found". Implementada (PR #6), probada por Fernando en móvil el 2026-11-11.
- Orden aprobado de las siguientes (Fernando, 2026-11-11): spec 03 (pruebas automáticas,
  `specs/03-pruebas-automaticas.md`), después spec 05 (actualizar Node y dependencias) y al final
  spec 04 (Firebase y producción). La 05 debe dejar las pruebas de la 03 en verde.
- SPEC 03, pruebas automáticas (`specs/03-pruebas-automaticas.md`): Vitest para `useCountdown` y
  `TimerStore`, Playwright para editor, reloj y rutas como invitado, y ambas en la CI. Implementada
  (PR #9).
- SPEC 05, actualizar Node y dependencias (`specs/05-actualizar-dependencias.md`): Node 24,
  Nuxt 4, Pinia 4, Firebase 13, faker 10, Vitest 5 y Playwright 1.65, solo npm con `npm ci`, y
  acciones de GitHub al día (el deploy fallaba desde antes por `upload-artifact@v3`). Implementada
  (PR #10).
- SPEC 04, Firebase seguro y sin errores silenciosos (`specs/04-firebase-seguro.md`): reglas por
  dueño probadas con el emulador, sin `accessToken`, guardado solo con cambios, errores visibles y
  login y registro robustos. Aprobada (Fernando, 2026-11-11). Favicons, manifest y timeout del
  loading van en un PR aparte, sin spec (Fernando, 2026-11-11).
