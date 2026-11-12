# Timer for Friends — Contexto maestro

> Estado al 2026-11-12. Documento vivo: se actualiza al cerrar cada mejora.

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
- TypeScript en stores, `utils` y componentes, con `npm run typecheck` en la CI; las pruebas y la
  configuración siguen en JS; los tipos de `$firestore`/`$auth` van en un `.d.ts` sin tocar el plugin;
  no se reescriben los bloques de opciones a `<script setup>`; estricto por defecto de Nuxt (spec 07,
  Fernando, 2026-11-11).
- Auditoría técnica del 2026-11-12: orden aprobado (ajustes de Settings sin PR, SPEC 08 CI/CD,
  SPEC 09 validación en las reglas, SPEC 10 carga más ligera); Analytics se quita en la SPEC 10
  (Fernando, 2026-11-12).
- CI en jobs paralelos con un check final **Build y pruebas** (el que exige el ruleset de
  `master`), permisos mínimos, caché, acciones por SHA, Dependabot semanal, límite de 420 KB gzip
  para el JS de entrada y reglas de Firestore publicadas por `rules.yml` con una cuenta de servicio
  (secret `FIREBASE_SERVICE_ACCOUNT`); el deploy de la app no corre pruebas (spec 08, Fernando,
  2026-11-12).
- Reglas que validan los datos: título 1–40 (también en el editor), nombre 1–20, 1–12 jugadores,
  color hex, tiempos 10–120, `Users` con campos cerrados y hasta 100 timers; ids de timer con 20
  caracteres de `crypto`; sin migración porque no hay cuentas reales; las reglas no limitan cuántos
  timers se crean (App Check, otra spec) (spec 09, Fernando, 2026-11-12).
- Carga más ligera: nombres de jugador de una lista fija y color hex sin faker; Handjet variable y
  Khand 500/700 locales (OFL); Bootstrap por partes; sin `getAnalytics` (se deja `measurementId` en
  la configuración); guardado cada 15 s, al pausar y al salir; límite de tamaño = medido + 10 %
  (spec 10, Fernando, 2026-11-12).

## Pendientes

- `components/LoginFormComponent.vue` no se usa en ninguna pantalla.
- El constructor de `Timer` y `Player` ignora los campos con valor falso (`if (data[key])`): un
  `progresive: false` o un `title: ''` que lleguen en los datos no se copian. Sin efecto visible hoy.
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
  login y registro robustos. Implementada (PR #13); Fernando publicó `firestore.rules` en la consola y
  lo probó con su cuenta en producción el 2026-11-11. Favicons, manifest y timeout del loading
  salieron en el PR #12, sin spec (Fernando, 2026-11-11).
- SPEC 06, aviso al invitado, nombres largos, accesibilidad e iconos propios
  (`specs/06-pulido-accesibilidad.md`): cierra P1-5, P1-10, P2-8 y P2-9 de la revisión QA. Implementada
  (PRs #15 y #16); Fernando la probó en producción, también en el móvil, el 2026-11-11.
- SPEC 07, migrar a TypeScript (`specs/07-migrar-a-typescript.md`): stores, `utils` y componentes
  en TypeScript, tipos del modelo en `types/models.ts` y `npm run typecheck` en la CI, sin cambiar la
  lógica. Implementada (PR #19); Fernando la probó con su cuenta el 2026-11-11.
- SPEC 08, CI/CD endurecida y despliegue de reglas (`specs/08-ci-cd-endurecida.md`): jobs
  paralelos, permisos, concurrencia, caché, `npm run size`, Dependabot y `rules.yml`. Implementada
  (PR #23); deploy de la app y primera publicación de reglas con `rules.yml` en verde el 2026-11-12.
- SPEC 09, reglas de Firestore que validan los datos (`specs/09-reglas-validan-datos.md`): campos,
  tipos y tamaños en `Users`, `Timers` y jugadores, id de timer de 20 caracteres y título de 40 en
  el editor. Implementada (PR #27); `rules.yml` publicó las reglas solo tras el merge y Fernando
  lo probó con una cuenta nueva en producción el 2026-11-12.
- SPEC 10, carga más ligera (`specs/10-carga-ligera.md`): sin faker, sin Analytics, Bootstrap JS
  solo con `Modal` y SCSS por partes, fuentes Handjet y Khand locales, arranque sin sondeo y guardado
  cada 15 s y al pausar. JS de entrada de 381 a 208 KB gzip (límite de `npm run size`: 229 KB) y CSS
  de 35,6 a 25,7 KB gzip. Implementada (PR #30); Fernando la probó con una cuenta en producción
  (registro, crear, editar, jugar, pausar y borrar) el 2026-11-12.
