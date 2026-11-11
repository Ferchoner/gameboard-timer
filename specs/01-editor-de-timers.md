# SPEC 01 — Corregir el editor de timers

> **Estado:** Borrador
> **Depende de:** ninguna
> **Fecha:** 2026-11-11
> **Objetivo:** Que editar, quitar jugadores y borrar un timer funcione igual como invitado y con cuenta, sin perder datos ni romper la página.

## Por qué existe esta spec

La revisión QA del 2026-11-11 encontró en el editor tres bugs que se reproducen en el navegador (P0-1, P0-2 y P0-3) y la falta de validaciones (P1-1, P1-3, P1-4 y P1-5):

- Como invitado, mover el slider a 60 min no tiene efecto: el timer arranca en 25:00. El slider solo cambia `players[0].timeValue`, y `syncTimer` iguala `timeValue` y `currentTime` de todos los jugadores únicamente cuando hay sesión.
- El botón "−" llama a `removePlayer(timerIndex)` sin índice, y `splice(undefined, 1)` borra siempre al primer jugador, y con él el tiempo elegido. Con 0 jugadores el modal revienta.
- Si se edita el último timer de la lista y luego se borra, `timerStore.index` queda fuera de rango y la página lanza `Cannot read properties of undefined (reading 'title')`.
- "Update Timer" está fuera del `<form>`, así que los `required` no actúan y se guardan títulos y nombres vacíos.
- No hay máximo de jugadores, aunque `TimerApp.vue` está pensado para 12.
- El slider guarda el tiempo como texto (`"60"`) y no como número.
- Borrar un timer no pide confirmación.

## Alcance

**Entra:**

- Un solo tiempo para todos los jugadores, aplicado como invitado y con cuenta (comportamiento actual con cuenta).
- Un jugador nuevo (botón "+") recibe el tiempo actual del timer, no 25.
- El botón "−" quita al último jugador.
- Mínimo 1 y máximo 12 jugadores; "−" y "+" se desactivan al llegar a cada límite.
- Validación de título y nombres no vacíos (sin contar espacios): al pulsar "Update Timer" o la X, si hay errores no se guarda, el modal no se cierra y se muestra el mensaje.
- Mensajes de error en inglés, como el resto de la interfaz.
- `timeValue` y `currentTime` siempre como número; un valor guardado como texto se convierte al leerlo.
- Confirmación antes de borrar un timer.
- Corregir `timerStore.index` al borrar para que nunca quede fuera de rango.
- Actualizar `docs/02_diseno/FUNCIONALIDAD_ACTUAL.md` y `docs/07_publicacion/CHECKLIST_PRUEBAS.md`.

**Fuera de alcance (para otras specs):**

- Tiempos distintos por jugador.
- Botón de borrar en cada jugador.
- Cambios en la pantalla del timer en marcha (`TimerApp.vue`): reloj con `Date.now()`, modo Continuous con jugador en 0, página de "timer no encontrado", audio. Van en la futura spec 02.
- Pruebas automáticas. Van en la futura spec 03.
- Manejo de errores de Firestore, reglas de seguridad y favicons. Van en la futura spec 04.
- Traducir la interfaz al español.

## Modelo de datos

Esta spec no introduce estructuras nuevas ni cambia el modelo de Firestore (`Users` y `Timers`, ver `docs/02_diseno/FUNCIONALIDAD_ACTUAL.md`).

Lo único que cambia es el tipo con que se escribe un campo que ya existe:

```js
// Timers/{FSid}.players[n]
{ name: 'Ana', color: '#a1b2c3', timeValue: 60, currentTime: 60 } // números, no '60'
```

Constantes nuevas en `stores/TimerStore.js`:

```js
export const MIN_PLAYERS = 1;
export const MAX_PLAYERS = 12;
```

## Plan de implementación

Rama `spec-01-editor-de-timers`. Cada paso deja la app funcionando y se prueba con `npm run dev`.

1. **Tiempo común también como invitado.** En `stores/TimerStore.js`, separar de `syncTimer` la parte que iguala `timeValue` y `currentTime` de todos los jugadores al del primero (convertidos con `Number`) en una acción que corre siempre. La escritura a Firestore sigue ocurriendo solo con sesión. Prueba: invitado, slider a 60, guardar, jugar: muestra 60:00 en todos.
2. **Slider numérico.** En `components/TimerModal.vue`, `v-model.number` en el slider. Prueba: con sesión, el documento en Firestore guarda `60` como número.
3. **Agregar y quitar jugadores.** En `TimerStore.js`, `addPlayer` crea el jugador con el tiempo actual del timer y no pasa de `MAX_PLAYERS`; `removePlayer` quita el último y no baja de `MIN_PLAYERS`. En el modal, "−" y "+" se ven desactivados en los límites. Prueba: con 60 min, "+" agrega un jugador con 60; "−" quita al último; con 1 jugador "−" no hace nada; con 12, "+" no hace nada.
4. **Validación del modal.** En `TimerModal.vue`, quitar `data-bs-dismiss` de "Update Timer" y de la X, validar título y nombres, y cerrar el modal desde código (instancia de Bootstrap expuesta como `$bootstrap`) solo si no hay errores. Mensajes: `Title is required` y `Player N needs a name`. Prueba: borrar el título y pulsar "Update Timer" o la X: el modal sigue abierto con el mensaje; al corregir, se cierra y guarda.
5. **Borrar con confirmación e índice seguro.** En `components/TimerComponent.vue`, pedir confirmación con `window.confirm('Delete "<título>"?')` antes de `removeTimer`. En `removeTimer`, si `index` queda fuera de rango, ajustarlo a `timers.length - 1` (o 0 si la lista queda vacía). Prueba: crear 2 timers, editar el 2.º, guardarlo y borrarlo: no hay error en consola; cancelar la confirmación no borra.
6. **Documentación.** Actualizar `FUNCIONALIDAD_ACTUAL.md` (límites, validación, confirmación) y añadir a `CHECKLIST_PRUEBAS.md` los casos de los criterios de aceptación.

## Criterios de aceptación

- [ ] `NITRO_PRESET=github-pages npm run build` termina sin errores.
- [ ] Como invitado, con el slider en 60, todos los jugadores arrancan en 60:00, y "reiniciar" los devuelve a 60:00.
- [ ] Con cuenta, el mismo caso guarda `timeValue: 60` y `currentTime: 60` como número en todos los jugadores, y se mantiene al recargar.
- [ ] Un jugador agregado con "+" tiene el tiempo actual del timer.
- [ ] "−" quita al último jugador; el primero y el tiempo elegido se conservan.
- [ ] Con 1 jugador "−" está desactivado; con 12, "+" está desactivado.
- [ ] Con título vacío o un nombre vacío, ni "Update Timer" ni la X cierran el modal, y se ve el mensaje de error.
- [ ] Borrar un timer pide confirmación; al cancelar, el timer sigue en la lista.
- [ ] Editar y luego borrar el último timer de la lista no deja errores en consola.
- [ ] Un timer viejo con `timeValue: "60"` (texto) en Firestore se abre y arranca en 60:00.
- [ ] La checklist manual de `CHECKLIST_PRUEBAS.md` para "Invitado" y "Con cuenta" pasa.

## Decisiones

- **Sí:** un solo tiempo para todos los jugadores, en ambos modos. Es el comportamiento actual con cuenta (Fernando, 2026-11-11).
- **No:** tiempos por jugador. Es una función nueva; si llega, va en otra spec.
- **Sí:** "−" quita al último jugador. Es el arreglo mínimo y no cambia el diseño (Fernando, 2026-11-11).
- **No:** botón de borrar por jugador. Cambia el diseño del modal.
- **Sí:** mínimo 1 y máximo 12 jugadores. `TimerApp.vue` ya soporta 1 jugador y sus arreglos y estilos llegan a 12 (Fernando, 2026-11-11).
- **Sí:** bloquear el guardado con datos vacíos, también al cerrar con la X (Fernando, 2026-11-11).
- **No:** rellenar en silencio con "New Timer" o "Player N". Oculta el error al usuario.
- **Sí:** mensajes en inglés, como el resto de la interfaz (Fernando, 2026-11-11).
- **Sí:** confirmación de borrado dentro de esta spec; es el mismo flujo (Fernando, 2026-11-11).
- **Sí:** `window.confirm` para confirmar. Es una línea y funciona en móvil. Un modal propio de Bootstrap queda como mejora visual futura.
- **Sí:** convertir con `Number` al leer y escribir. Arregla los timers viejos sin migrar datos ni cambiar el modelo.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Quitar `data-bs-dismiss` deja el modal sin poder cerrarse si falla la instancia de Bootstrap. | Probar en escritorio y móvil que el modal cierra con datos válidos; `getOrCreateInstance` en vez de `getInstance`. |
| Timers viejos con más de 12 jugadores no podrían crecer. | Solo se bloquea el "+"; un timer existente con más de 12 se sigue abriendo y puede quitar jugadores. |
| `window.confirm` puede verse distinto en cada navegador. | Aceptado; el texto es corto y la acción queda clara. |

## Lo que **no** entra en esta spec

- Tiempos distintos por jugador.
- Botón de borrar en cada jugador.
- Cualquier cambio en `TimerApp.vue` (futura spec 02).
- Pruebas automáticas (futura spec 03).
- Errores de Firestore, reglas y favicons (futura spec 04).

Cada uno, si llega, va en su propia spec.
