# Timer for Friends — Contexto maestro

> Estado al 2026-11-11. Documento vivo: se actualiza al cerrar cada mejora.

## Identidad y objetivo

App web de temporizadores para jugadores de juegos de mesa ("Timer for Friends", repo
`Ferchoner/gameboard-timer`). Hecha con Nuxt 3, Pinia, Bootstrap 5 y Firebase. Publicada en
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
- CI de build en cada PR (`.github/workflows/ci.yml`) (Fernando, 2026-11-11).
- La actualización de Node 18 y de dependencias va en una spec aparte, no ahora
  (Fernando, 2026-11-11).

## Pendientes

- Actualizar Node (el deploy usa Node 18, fuera de soporte) y dependencias. Definido en
  `specs/05-actualizar-dependencias.md` (Node 24, Nuxt 4, Firebase 13, solo npm); se aplica
  después de las specs 02 y 03 y antes de la 04.
- `package-lock.json` desincronizado con `package.json` (`npm ci` falla; falta
  `@faker-js/faker`). Hay además un `yarn.lock`. Decidir un solo gestor de paquetes.
- `@nuxt/devtools` está en `latest`; conviene fijar la versión.
- Sin pruebas automáticas.
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
