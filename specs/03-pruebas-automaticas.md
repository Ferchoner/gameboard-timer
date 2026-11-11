# SPEC 03 — Pruebas automáticas

> **Estado:** Borrador
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-11-11
> **Objetivo:** Que cada PR corra en la CI pruebas unitarias y E2E que cubran el editor de timers y el reloj, para detectar regresiones antes de fusionar a `master`.

## Por qué existe esta spec

El proyecto no tiene pruebas automáticas. Hoy la CI solo comprueba que la app compila, y todo lo demás se revisa a mano con `docs/07_publicacion/CHECKLIST_PRUEBAS.md`.

La revisión QA del 2026-11-11 encontró 5 bugs P0 que una prueba básica habría detectado. Además, la siguiente spec en el orden es la 05, que actualiza Nuxt 3 a 4, Pinia, Firebase y Node. Sin pruebas, ese salto solo se puede validar a mano. Esta spec va antes de la 05 para que la actualización tenga red de seguridad (orden aprobado por Fernando el 2026-11-11: 03, 05, 04).

## Alcance

**Entra:**

- Pruebas unitarias con Vitest de:
  - `composables/useCountdown.ts`
  - `stores/TimerStore.js`
  - las clases `Timer` y `Player`
- Pruebas E2E con Playwright de los flujos de invitado, contra el build de producción servido bajo `/gameboard-timer/`. Corren en Chromium de escritorio y en una emulación de móvil.
- Un servidor estático mínimo para las E2E que imita GitHub Pages: sirve `.output/public` bajo `/gameboard-timer/` y responde `404.html` a las rutas que no existen.
- Scripts `test:unit`, `test:e2e` y `test` en `package.json`.
- Correr las unitarias y las E2E en `.github/workflows/ci.yml` en cada PR.
- Actualizar `CLAUDE.md`, `README.md`, `CHECKLIST_PRUEBAS.md` y `CONTEXTO_MAESTRO.md`: ya hay pruebas, y se explica cómo correrlas.

**Fuera de alcance (para otras specs):**

- Pruebas con cuenta (registro, login, Firestore) usando el emulador de Firebase. Requieren que la app pueda apuntar al emulador, lo que toca `plugins/firebase.client.ts` y necesita aprobación.
- `@nuxt/test-utils` y pruebas de componentes montados.
- Typecheck y linter.
- Probar favicons y manifest en producción; se agrega con la futura spec 04, que los arregla.
- Actualizar Node, Nuxt y demás dependencias (futura spec 05).
- Cambiar de gestor de paquetes o regenerar `package-lock.json` y `yarn.lock` (futura spec 05).
- Cambiar código de la app, salvo lo mínimo para que sea probable. Si una prueba descubre un bug, se anota como pendiente y no se arregla aquí.

## Modelo de datos

Esta spec no introduce estructuras de datos ni cambia el modelo de Firestore.

Estructura de archivos nueva:

```
vitest.config.mjs           # entorno node, alias ~ y @ a la raíz
playwright.config.mjs       # proyectos desktop-chromium y mobile-chromium (Pixel 7)
tests/
  unit/
    useCountdown.spec.js
    TimerStore.spec.js
  e2e/
    serve.mjs               # servidor estático tipo GitHub Pages en el puerto 4173
    fixtures.js             # bloquea Analytics y registra errores de consola
    editor.spec.js
    reloj.spec.js
    rutas.spec.js
```

Dependencias de desarrollo nuevas, con versión fija porque la CI usa Node 18:

- `vitest@3.2.7` (Node ^18).
- `@playwright/test@1.61.1`, la última que acepta Node 18; desde la 1.62 exige Node 20.

## Plan de implementación

Rama `spec-03-pruebas-automaticas`. Cada paso deja la app y las pruebas funcionando.

1. **Vitest.** Agregar `vitest`, `vitest.config.mjs` y el script `test:unit`. `useFirestore` y `useFirebaseAuth` son auto-imports de Nuxt, así que en las pruebas se simulan con `vi.stubGlobal`. Primera prueba: `Player` sin datos usa 25 minutos. Comando: `npm run test:unit`.
2. **Unitarias de `useCountdown`** con relojes falsos (`vi.useFakeTimers`):
   - Inicio, pausa y reanudación.
   - Descuenta el tiempo real aunque el intervalo no corra, como en segundo plano.
   - Llega a 0 y avisa una sola vez con `onFinish`.
   - `reset` y `resetAll`.
   - `centisecondsNow`.
   - Sin intervalos vivos tras `dispose`.
3. **Unitarias de `TimerStore`** con Pinia real (`createPinia`) y Firestore simulado:
   - `addPlayer` respeta el máximo de 12 y usa el tiempo actual.
   - `removePlayer` quita al último y respeta el mínimo de 1.
   - `applySharedTime` iguala tiempos como número, aunque llegue `"60"`.
   - `removeTimer` mantiene `index` en rango.
   - Sin sesión no se llama a Firestore; con sesión se llama a `updateDocument`.
4. **Playwright y servidor.** Agregar `@playwright/test`, `playwright.config.mjs`, `tests/e2e/serve.mjs`, `tests/e2e/fixtures.js` y el script `test:e2e`. El `webServer` de Playwright arranca `serve.mjs` sobre un build ya hecho. El fixture bloquea las peticiones a Google Analytics y Tag Manager, para no ensuciar las métricas reales, y hace fallar la prueba si hay errores de consola propios de la app. Primera prueba: la lista carga en `/gameboard-timer/`.
5. **E2E del editor** (spec 01):
   - Crear un timer.
   - Con el tiempo en 60, todos los jugadores arrancan en `60 : 00`.
   - "−" quita al último.
   - Límites de 1 y 12 jugadores.
   - Título y nombre vacíos bloquean el guardado.
   - Borrar pide confirmación.
   - Borrar el último timer editado no da errores.
6. **E2E del reloj** (spec 02), con `page.clock`:
   - Modo normal: descuenta y queda en play al llegar a 0.
   - Continuous: se salta a los jugadores en 0 y pausa al que corre.
   - Alarma al volver de segundo plano, con la visibilidad simulada.
   - Wake Lock simulado: se pide al entrar y se libera al salir.
7. **E2E de rutas:**
   - Recargar `/gameboard-timer/timers` funciona.
   - `/timer-app/0` como invitado y `/timer-app/abc` muestran "Timer not found".
8. **CI.** En `ci.yml`, después del build: `npm run test:unit`, `npx playwright install --with-deps chromium` y `npm run test:e2e`. Si falla, el reporte de Playwright se sube como artefacto.
9. **Documentación.** Actualizar `CLAUDE.md` (comandos y "no hay pruebas"), `README.md`, `CHECKLIST_PRUEBAS.md` (qué cubre la parte automática y qué sigue siendo manual) y `CONTEXTO_MAESTRO.md`. Agregar `test-results/` y `playwright-report/` a `.gitignore`.

## Criterios de aceptación

- [ ] `npm run test:unit` pasa en local y en la CI, con al menos las pruebas de los pasos 2 y 3.
- [ ] `npm run test:e2e` pasa en local, después de `NITRO_PRESET=github-pages npm run build`, y en la CI, en los proyectos de escritorio y móvil.
- [ ] Las E2E cubren cada criterio de aceptación de las specs 01 y 02 que se puede comprobar como invitado y sin un teléfono real.
- [ ] Si se revierte a mano el arreglo de P0-2 ("−" borra al primero), al menos una prueba falla. Se comprueba una vez y no se sube.
- [ ] Ninguna prueba E2E envía peticiones a Google Analytics.
- [ ] Un error de consola de la app hace fallar la prueba E2E donde ocurre.
- [ ] El job de CI de un PR corre build, unitarias y E2E, y queda en rojo si cualquiera falla.
- [ ] `package-lock.json` y `yarn.lock` no cambian en este PR.
- [ ] `CLAUDE.md` ya no dice que no hay pruebas e indica cómo correrlas.

## Decisiones

- **Sí:** dos capas, unitarias (Vitest) y E2E de invitado (Playwright) (Fernando, 2026-11-11).
- **No:** pruebas con cuenta usando el emulador de Firebase por ahora. Tocan la config de Firebase; van en otra spec.
- **Sí:** Vitest y Playwright "puros", sin `@nuxt/test-utils`. Así sobreviven al salto a Nuxt 4 de la spec 05 (Fernando, 2026-11-11).
- **Sí:** correr unitarias y E2E en `ci.yml` en cada PR (Fernando, 2026-11-11).
- **Sí:** la spec 03 va antes de la 05 y la 05 antes de la 04 (Fernando, 2026-11-11).
- **Sí:** las E2E van contra el build de producción y no contra `nuxt dev`. Es lo que se publica, y evita el problema de HTTPS del modo dev.
- **Sí:** versiones fijas compatibles con Node 18 (`vitest@3.2.7`, `@playwright/test@1.61.1`). La spec 05 las sube junto con Node.
- **No:** tocar los lockfiles. Están desincronizados y elegir gestor de paquetes es parte de la spec 05; la CI ya usa `npm install`.
- **Sí:** solo Chromium, con un proyecto de escritorio y otro de móvil emulado. WebKit y Firefox alargan la CI y no cubren lo que solo se ve en un iPhone real.
- **Sí:** bloquear Analytics en las E2E para no mezclar visitas de la CI con las reales.
- **Sí:** nombres de pruebas en español, como los docs.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| La red de la CI no llega a Firebase y la app no sale del loading. | Las pruebas de invitado no necesitan sesión; si Auth tarda, el fixture espera a que desaparezca el loading con un límite de tiempo y falla con un mensaje claro. |
| Pruebas inestables por tiempos reales. | `page.clock` y `vi.useFakeTimers` en todo lo que dependa del reloj; nada de esperas fijas para medir tiempo. |
| Sin lockfile sincronizado, `npm install` resuelve versiones distintas en cada corrida. | Versiones exactas en las dependencias de prueba; el resto queda como hoy hasta la spec 05. |
| La CI tarda más. | Solo Chromium con `--with-deps`; se reutiliza el build del mismo job. |
| Una prueba descubre un bug existente. | Se anota en `CONTEXTO_MAESTRO.md` como pendiente; esta spec no lo arregla. |

## Lo que **no** entra en esta spec

- Pruebas con cuenta y emulador de Firebase.
- `@nuxt/test-utils`, typecheck y linter.
- Favicons y manifest (futura spec 04).
- Actualizar dependencias o lockfiles (futura spec 05).
- Arreglar bugs que encuentren las pruebas.

Cada uno, si llega, va en su propia spec.
