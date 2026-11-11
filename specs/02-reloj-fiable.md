# SPEC 02 — Reloj fiable y pantalla encendida en móviles

> **Estado:** Borrador
> **Depende de:** SPEC 01
> **Fecha:** 2026-11-11
> **Objetivo:** Que el reloj de cada jugador marque el tiempo real aunque el móvil cambie de app o se bloquee, y que la pantalla no se apague mientras el timer está abierto.

## Por qué existe esta spec

La revisión QA del 2026-11-11 encontró estos problemas en `components/Page/TimerApp.vue`:

- **P0-5.** El tiempo se descuenta con un `setInterval` de 10 ms que resta una centésima por tick. Los navegadores frenan los intervalos en segundo plano y con la pantalla bloqueada, así que el reloj se atrasa o se detiene. Además, la pantalla del móvil se apaga por inactividad en plena partida.
- **P0-4.** En modo Continuous, si el jugador actual llega a 0, el botón de play llama a `startTimer(current)`, que no hace nada con tiempo 0, y la ronda queda trabada. Si "siguiente" cae en un jugador sin tiempo, no pausa al anterior, que sigue corriendo y ya no se puede pausar.
- **P1-2.** Abrir `/timer-app/N` sin datos deja la pantalla en blanco. Los `setInterval` de 500 ms de `mounted`, que simulan clicks para cargar los tiempos, nunca se limpian.
- **P1-8.** `audio.play()` no maneja la promesa rechazada, y en segundo plano la alarma puede no sonar.
- **P1-9.** En modo normal, un jugador que llega a 0 sigue marcado "en curso" y su botón muestra pausa.

## Alcance

**Entra:**

- Calcular el tiempo restante con `Date.now()` en lugar de contar ticks. El intervalo solo refresca la pantalla.
- Mientras el reloj corre, el tiempo sigue descontándose aunque la app pase a segundo plano o se bloquee el teléfono. Al volver se muestra el tiempo real.
- Mantener la pantalla encendida (Wake Lock API) mientras la pantalla del timer está abierta, corra o no el reloj. El bloqueo se pide de nuevo al volver a la app y se libera al salir de la pantalla.
- Si un jugador llega a 0 mientras la app está en segundo plano, la alarma suena al volver a la app.
- Manejar el rechazo de `audio.play()` sin errores en consola.
- Modo Continuous: "siguiente" y play se saltan a los jugadores sin tiempo; si no queda ninguno con tiempo, todo se detiene.
- Modo normal: un jugador que llega a 0 queda como detenido y su botón vuelve a play.
- Pantalla "Timer not found" con un botón para volver a la lista cuando `/timer-app/N` no tiene timer.
- Cargar los tiempos iniciales sin clicks simulados ni intervalos que nunca se limpian.
- Actualizar `docs/02_diseno/FUNCIONALIDAD_ACTUAL.md` y `docs/07_publicacion/CHECKLIST_PRUEBAS.md`.

**Fuera de alcance (para otras specs):**

- Cambiar el guardado cada 5 s en Firestore (`syncTimeValues`); sigue igual (futura spec 04).
- Trucos de compatibilidad para navegadores sin Wake Lock (por ejemplo, un video en bucle).
- Notificaciones del sistema o vibración al acabarse el tiempo.
- Pausar solo al perder el foco.
- Pasar de turno automáticamente cuando el jugador actual llega a 0.
- Pruebas automáticas (futura spec 03).
- Actualizar Node y dependencias (hilo aparte).

## Modelo de datos

Esta spec no cambia el modelo de Firestore. `syncTimeValues(i, timeValues)` sigue recibiendo centésimas de segundo por jugador, igual que hoy.

Estado del reloj en el composable nuevo `composables/useCountdown.ts`, solo en memoria:

```js
// Un registro por jugador
{
  remainingMs: 1500000,   // tiempo restante al último inicio o pausa
  startedAt: null,        // Date.now() al iniciar; null si está en pausa
  finished: false,        // llegó a 0
  alarmPending: false     // llegó a 0 con la app en segundo plano y falta sonar
}
// Tiempo restante en un instante: remainingMs - (Date.now() - startedAt), mínimo 0
```

Composable nuevo `composables/useWakeLock.ts`: `request()`, `release()` y el estado `isActive`. Si el navegador no tiene `navigator.wakeLock`, todas las funciones no hacen nada.

## Plan de implementación

Rama `spec-02-reloj-fiable`. Cada paso deja la app funcionando y se prueba con `npm run dev`.

1. **Composable `useCountdown`.** Crear `composables/useCountdown.ts` con `init(minutesPerPlayer)`, `start(i)`, `pause(i)`, `reset(i, minutes)`, `resetAll(minutes)`, `remaining(i)` (en centésimas, para la pantalla y `syncTimeValues`) y `onFinish(callback)`. Un solo intervalo de 250 ms actualiza un `ref` con `Date.now()` mientras haya algún reloj corriendo. Todavía no se usa en la app.
2. **Usar `useCountdown` en `TimerApp.vue`.** Reemplazar `timeInSeconds`, `counters` y `startCountdown` por el composable. Los tiempos iniciales se cargan con un `watch` inmediato sobre el timer del store, y desaparecen los clicks simulados y los intervalos de 500 ms de `mounted`. Prueba: iniciar, pausar y reiniciar en modo normal; el display coincide con un cronómetro a los 60 s.
3. **Modo normal al llegar a 0.** `onFinish` marca al jugador como detenido (`playersInProgress[i] = false`) y suena la alarma. Prueba: con 10 min y el reloj adelantado, el botón vuelve a play al llegar a 0.
4. **Modo Continuous.** "Siguiente" pausa al actual y arranca al siguiente jugador con tiempo; play arranca al actual o, si no tiene tiempo, al siguiente con tiempo. Si nadie tiene tiempo, todo queda detenido. Pausa detiene al jugador que realmente corre. Prueba: 3 jugadores, agotar uno; "siguiente" se lo salta y pausa siempre funciona.
5. **Alarma.** `playTimeAlert` captura el rechazo de `audio.play()`. Si `document.visibilityState` es `hidden` al llegar a 0, se marca `alarmPending`, y al recibir `visibilitychange` con `visible` suena una vez. Prueba: en el móvil, iniciar, bloquear hasta pasar el tiempo, desbloquear: suena la alarma.
6. **Pantalla encendida.** Crear `composables/useWakeLock.ts`. `TimerApp.vue` lo pide al montarse, lo pide de nuevo en `visibilitychange` con `visible` y lo libera en `unmounted`. Prueba: en Chrome Android y en un iPhone con iOS 16.4 o posterior, con el timer abierto y en pausa, la pantalla no se apaga pasado el tiempo de bloqueo automático.
7. **Timer no encontrado.** Si `timerStore.timers[timerIndex]` no existe una vez que `userStore.usrChecked` es `true`, mostrar "Timer not found" y un botón "Back to timers" que lleva a `/`. Prueba: recargar `/timer-app/0` como invitado.
8. **Documentación.** Actualizar `FUNCIONALIDAD_ACTUAL.md` (cómo se mide el tiempo, Wake Lock, alarma, Continuous) y añadir a `CHECKLIST_PRUEBAS.md` los casos de los criterios de aceptación.

## Criterios de aceptación

- [ ] `NITRO_PRESET=github-pages npm run build` termina sin errores.
- [ ] Con el reloj corriendo, tras 60 s reales el display marca 60 s menos (±1 s).
- [ ] En el móvil, con el reloj corriendo, cambiar de app o bloquear la pantalla 60 s y volver muestra 60 s menos (±1 s).
- [ ] En Chrome Android y en iPhone con iOS 16.4 o posterior, la pantalla no se apaga mientras el timer está abierto, corra o esté en pausa.
- [ ] Al salir de la pantalla del timer, el bloqueo de pantalla vuelve a funcionar con normalidad.
- [ ] En un navegador sin Wake Lock, el timer funciona igual y no hay errores en consola.
- [ ] Si un jugador llega a 0 con la app en segundo plano, la alarma suena una vez al volver.
- [ ] En modo normal, un jugador que llega a 0 muestra el botón de play, no el de pausa.
- [ ] En modo Continuous, "siguiente" se salta a los jugadores en 0, y pausa detiene siempre al jugador que corre.
- [ ] En modo Continuous, si todos llegan a 0, ningún reloj corre y el control vuelve a play.
- [ ] Recargar `/timer-app/0` como invitado muestra "Timer not found" y el botón lleva a la lista.
- [ ] Con sesión, el guardado cada 5 s sigue escribiendo el `currentTime` correcto en minutos.
- [ ] No quedan intervalos activos después de salir de la pantalla del timer.

## Decisiones

- **Sí:** tiempo restante calculado con `Date.now()`. Es inmune al freno de intervalos en segundo plano.
- **Sí:** el reloj sigue corriendo en segundo plano, como un reloj de ajedrez (Fernando, 2026-11-11).
- **No:** pausar solo al perder el foco. Permite que el tiempo se detenga sin querer (Fernando, 2026-11-11).
- **Sí:** Wake Lock mientras la pantalla del timer está abierta, aunque esté en pausa. El gasto de batería es aceptable (Fernando, 2026-11-11).
- **No:** trucos de compatibilidad con video en bucle para navegadores sin Wake Lock. Son frágiles; en esos navegadores la pantalla se comporta como hoy (Fernando, 2026-11-11).
- **Sí:** la alarma perdida en segundo plano suena al volver (Fernando, 2026-11-11).
- **Sí:** en Continuous, saltar a los jugadores sin tiempo y detener todo si nadie tiene tiempo (Fernando, 2026-11-11).
- **No:** pasar de turno solo cuando el jugador actual llega a 0. Cambia la dinámica del juego; si se quiere, va en otra spec.
- **Sí:** "Timer not found" con botón a la lista (Fernando, 2026-11-11).
- **Sí:** refresco de pantalla cada 250 ms. Basta para mostrar segundos y gasta menos que 10 ms.
- **Sí:** composables en `.ts`, como los que ya existen en `composables/`.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| iOS anterior a 16.4 no tiene Wake Lock. | Aceptado; la app funciona igual y la pantalla se apaga como hoy. Se anota en `FUNCIONALIDAD_ACTUAL.md`. |
| El sistema libera el Wake Lock al cambiar de app. | Se pide de nuevo en `visibilitychange` con `visible`. |
| Cambiar la hora del teléfono durante una partida altera `Date.now()`. | Aceptado; es raro en una partida. `performance.now()` no sigue contando con el teléfono suspendido en todos los navegadores. |
| El navegador bloquea el audio al volver si no hubo un toque. | La alarma intenta sonar y, si falla, no rompe nada; el display ya muestra 0:00. |
| El guardado cada 5 s escribe tiempos que cambian en segundo plano. | Sin cambios de comportamiento: escribe lo que marca el reloj en ese instante. |

## Lo que **no** entra en esta spec

- Cambios en el guardado a Firestore (futura spec 04).
- Trucos para navegadores sin Wake Lock.
- Notificaciones o vibración.
- Pasar de turno automáticamente en Continuous.
- Pruebas automáticas (futura spec 03).
- Actualizar Node y dependencias.

Cada uno, si llega, va en su propia spec o hilo.
