# SPEC 10 — Carga más ligera

> **Estado:** Aprobado
> **Depende de:** SPEC 06 (iconos locales), SPEC 08 (`npm run size` en la CI) y SPEC 09 (id de timer sin faker)
> **Fecha:** 2026-11-12
> **Objetivo:** Bajar lo que descarga la app en la primera visita, sin faker, Analytics ni Bootstrap completo, con fuentes locales y menos escrituras, sin cambiar lo que ve el usuario.

## Por qué existe esta spec

Sale de la auditoría técnica del 2026-11-12 (puntos 4 a 7, 12 y el apartado "Escrituras"). Fernando aprobó el orden, quitar Analytics y las seis recomendaciones el mismo día.

Medición del build de producción en `master` (2026-11-12, `npm run size`):

- El chunk de entrada pesa 1156 KB, **381 KB gzip**, y carga todo en la primera visita. El CSS pesa 231 KB (36 KB gzip).
- `@faker-js/faker` ocupa unos 153 KB gzip de ese chunk. Solo se usa para el nombre y el color de un jugador nuevo.
- Bootstrap JS completo (`bootstrap.bundle`, con Popper, Carousel, Tooltip…) ocupa unos 25 KB gzip. La app solo usa Modal.
- Firebase Analytics ocupa unos 14 KB gzip, más el script externo de gtag, y pone cookies sin aviso.
- `master.scss` hace `@import` de Google Fonts: el navegador baja un CSS, luego otro CSS remoto y después las fuentes, en cadena. Pide 8 pesos de Handjet y 5 de Khand.
- `app.vue` sondea cada 5 ms con una condición que siempre es verdadera (son promesas), y arranca con un `click` simulado.
- Con cuenta, el timer en marcha escribe en Firestore cada 5 s: 720 escrituras por hora de partida.

## Alcance

**Entra:**

- **Sin faker.**
  - `utils/randomPlayer.ts` con `PLAYER_NAMES` (unos 40 nombres comunes en inglés, de 20 caracteres o menos), `randomName()` y `randomColor()` (hex `#rrggbb` con `crypto.getRandomValues`).
  - `Player` en `stores/TimerStore.ts` usa esas funciones donde hoy usa `faker.person.firstName`, `faker.person.fullName` y `faker.color.rgb`.
  - Quitar `@faker-js/faker` de `package.json` y del `package-lock.json`.
- **Sin Analytics.** Quitar `getAnalytics` y su import de `plugins/firebase.client.ts` (aprobado por Fernando, 2026-11-12). El objeto `firebaseConfig`, con su `measurementId`, no cambia.
- **Bootstrap JS solo con Modal.** `plugins/useBootstrap.client.ts` importa `bootstrap/js/dist/modal` en vez de `bootstrap/dist/js/bootstrap.bundle`, y provee `{ Modal }` como hoy. Se ajusta la declaración de tipos en `types/bootstrap.d.ts`. Los `data-bs-toggle="modal"` y `data-bs-dismiss="modal"` siguen funcionando porque el módulo Modal registra su propia API de datos.
- **Bootstrap SCSS selectivo.** `master.scss` importa solo las partes que usa la app, en lugar de `bootstrap/scss/bootstrap`:
  - Base: `functions`, `variables`, `variables-dark`, `maps`, `mixins`, `utilities`, `root`, `reboot`, `type`.
  - Layout: `containers`, `grid`.
  - Componentes: `buttons`, `forms`, `transitions`, `card`, `alert`, `close`, `modal`.
  - `helpers` y `utilities/api`.
  - Se quitan, entre otros: `tables`, `dropdown`, `button-group`, `nav`, `navbar`, `accordion`, `breadcrumb`, `pagination`, `badge`, `progress`, `list-group`, `toasts`, `tooltip`, `popover`, `carousel`, `spinners`, `offcanvas` y `placeholders`.
- **Fuentes locales.**
  - Handjet en su versión variable (un `.woff2` que cubre todos los pesos) y Khand en 500 y 700, solo con el subconjunto latino, en `assets/fonts/`.
  - `@font-face` en `assets/css/_fonts.scss`, importado desde `master.scss`, con `font-display: swap`.
  - Quitar el `@import url('https://fonts.googleapis.com/…')` de `master.scss`.
  - Licencia SIL Open Font License 1.1 de cada familia en `assets/fonts/` (`LICENSE-handjet.txt`, `LICENSE-khand.txt`), copiada del repositorio de origen, y fila nueva en `docs/03_recursos/RECURSOS_Y_LICENCIAS.md` con ruta, uso, origen y licencia.
- **Arranque sin sondeo.** `app.vue` comprueba `$auth` y `$firestore` de forma síncrona en `mounted` y llama a `userStore.listenAuth()` una vez. Se quitan el `setInterval` de 5 ms, el `@click.once` y el `click` simulado. Las acciones `checkFirebaseAuth` y `checkFirestore` de `MainStore` dejan de ser `async`. Se quita el `@ts-expect-error` de `app.vue`.
- **Menos escrituras.** En `TimerApp.vue` el guardado periódico pasa de 5 s a 15 s. Además se guarda al pausar (modo normal, botón de pausa y "siguiente" en Continuous). Al salir de la pantalla se sigue guardando como hoy. `syncTimeValues` ya no escribe si nada cambió.
- **Límite de tamaño.** Al terminar se mide con `npm run size` y `LIMIT_KB` de `scripts/check-bundle-size.mjs` pasa a lo medido más un 10 %, redondeado hacia arriba.
- **Pruebas.**
  - `tests/unit/randomPlayer.spec.js`: nombres de la lista con 20 caracteres o menos y colores `#rrggbb`.
  - `tests/unit/TimerStore.spec.js`: un `Player` nuevo tiene nombre de la lista y color hex.
  - `tests/e2e/reloj.spec.js`: con sesión simulada, al pausar se llama al guardado. Si simular la sesión en E2E no es viable, va como prueba unitaria del guardado al pausar.
  - Capturas antes y después de las pantallas principales (lista, editor, timer de 2 y de 12 jugadores, registro, login) en escritorio y móvil, adjuntas al PR para revisión visual. No se guardan como prueba en el repo.
- **Documentación.** `CLAUDE.md` (stack sin Analytics, fuentes locales), `docs/02_diseno/FUNCIONALIDAD_ACTUAL.md` (guardado cada 15 s y al pausar, arranque), `docs/03_recursos/RECURSOS_Y_LICENCIAS.md`, `docs/01_contexto/CONTEXTO_MAESTRO.md` (quitar los pendientes de `app.vue` y de las fuentes) y `README.md` si menciona faker o Analytics.

**Fuera de alcance (para otras specs):**

- Cargar Firestore o Auth de forma diferida, o separar el chunk de entrada por rutas.
- Cambiar el diseño, los colores o las fuentes que se ven.
- Reemplazar Bootstrap por otra librería.
- Pruebas de regresión visual automáticas con capturas guardadas en el repo.
- Cambiar la configuración de Firebase (`firebaseConfig`) o `app.baseURL`.
- Los avisos de deprecación de Sass de Bootstrap (pendiente aparte).

## Modelo de datos

Esta spec no cambia el modelo de Firestore. Solo cambia cada cuánto se escribe `players` de un timer en marcha.

```ts
// utils/randomPlayer.ts
export const PLAYER_NAMES: readonly string[] // ~40 nombres, cada uno de 1 a 20 caracteres
export function randomName(): string          // uno de PLAYER_NAMES
export function randomColor(): string         // '#rrggbb', minúsculas
```

## Plan de implementación

Rama `spec-10-carga-ligera`, creada desde `master`. Un commit por paso; cada paso deja la CI en verde y anota en el commit el resultado de `npm run size`.

1. **Medición base y capturas "antes"** desde `master`.
2. **Sin faker.** `utils/randomPlayer.ts`, cambio en `Player`, quitar la dependencia y pruebas unitarias.
3. **Sin Analytics** en `plugins/firebase.client.ts`.
4. **Bootstrap JS solo con Modal.** Prueba: las E2E del editor y del login (abren y cierran modales) en verde.
5. **Fuentes locales**, licencias y fila en `RECURSOS_Y_LICENCIAS.md`. Prueba: en el build no queda ninguna URL de `fonts.googleapis.com` ni `fonts.gstatic.com`.
6. **Bootstrap SCSS selectivo.** Prueba: E2E en verde y capturas "después" sin diferencias visibles.
7. **Arranque sin sondeo** en `app.vue` y `MainStore`. Prueba: E2E de rutas y de login en verde; sin `@ts-expect-error` en `app.vue`.
8. **Guardado cada 15 s y al pausar**, con su prueba.
9. **Nuevo límite de tamaño** y documentación.

## Criterios de aceptación

- [ ] `@faker-js/faker` no aparece en `package.json`, `package-lock.json` ni en el build.
- [ ] `getAnalytics` no aparece en el código; el build no carga `googletagmanager.com` ni pone cookies `_ga`.
- [ ] El build no pide nada a `fonts.googleapis.com` ni a `fonts.gstatic.com`; las fuentes salen de `/gameboard-timer/_nuxt/`.
- [ ] `RECURSOS_Y_LICENCIAS.md` tiene una fila para Handjet y otra para Khand, con origen y licencia OFL, y sus archivos de licencia están en `assets/fonts/`.
- [ ] El chunk de entrada pesa al menos un 35 % menos gzip que los 381 KB de partida, y `npm run size` usa el nuevo límite.
- [ ] El CSS de entrada pesa menos gzip que los 36 KB de partida.
- [ ] Abrir y cerrar el modal de login y el editor funciona con la X, con "Update Timer" y con los botones `data-bs-*`.
- [ ] `app.vue` no tiene `setInterval` ni `@ts-expect-error`, y la app carga en `/`, `/timers`, `/timer-app/N` y `/user/signup-form` al recargar.
- [ ] Con sesión, un timer en marcha escribe cada 15 s y al pausar; en pausa no escribe.
- [ ] Las capturas antes y después están en el PR y Fernando no ve diferencias, también en el móvil.
- [ ] `npm run build`, `npm run typecheck`, `npm run size` y `npm test` en verde.
- [ ] Tras el merge, con una cuenta de prueba en producción: registrarse, crear, editar, jugar, pausar y borrar un timer funciona.

## Decisiones

- **Sí:** quitar Analytics (Fernando, 2026-11-12).
- **Sí:** dejar `measurementId` en `firebaseConfig`. Sin `getAnalytics` no hace nada, y así no cambia el bloque de configuración (Fernando, 2026-11-12).
- **Sí:** lista fija de unos 40 nombres en inglés y color hex al azar, en vez de faker (Fernando, 2026-11-12).
- **Sí:** Handjet variable y Khand 500 y 700, subconjunto latino, servidas desde `assets/fonts/` con licencia OFL anotada (Fernando, 2026-11-12).
- **Sí:** Bootstrap SCSS y JS selectivos, con revisión visual por capturas y en el móvil (Fernando, 2026-11-12).
- **Sí:** guardar cada 15 s, al pausar y al salir. Si la app se cierra de golpe se pierden como mucho 15 s (Fernando, 2026-11-12).
- **Sí:** nuevo límite de tamaño = lo medido más un 10 % (Fernando, 2026-11-12).
- **Sí:** incluir el arranque de `app.vue`, que era el punto 7 de la auditoría y entra en esta spec según el orden aprobado.
- **No:** carga diferida de Firestore o separación por rutas. Mayor ahorro posible, pero cambia cómo arranca la sesión; otra spec si hace falta.
- **No:** guardar capturas como prueba en el repo. Dependen del sistema operativo y del navegador, y fallarían entre la CI y local.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Al quitar partes de Bootstrap desaparece un estilo que sí se usaba (por ejemplo, en el modal o el formulario). | Capturas antes y después de todas las pantallas en escritorio y móvil; si algo cambia, se vuelve a importar esa parte. |
| `bootstrap/js/dist/modal` no registra los `data-bs-*` igual que el bundle. | Las E2E abren y cierran modales con esos atributos; si fallan, se registra el módulo a mano. |
| Las fuentes locales se ven distintas a las de Google Fonts (otra versión o subconjunto). | Se descargan del mismo origen; capturas antes y después. |
| Sin el sondeo, `listenAuth` corre antes de que Firebase esté listo. | Los plugins de Nuxt (`firebase.client.ts`) terminan antes de `mounted` del componente raíz; la E2E de rutas lo cubre y se prueba con cuenta en producción. |
| Guardar cada 15 s pierde más tiempo si la app se cierra de golpe. | Aceptado (Fernando, 2026-11-12); se guarda también al pausar y al salir. |

## Lo que **no** entra en esta spec

- Carga diferida de Firebase o separación del chunk por rutas.
- Cambios de diseño, colores o fuentes visibles.
- Regresión visual automática en el repo.
- Avisos de deprecación de Sass.

Cada uno, si llega, va en su propia spec.
