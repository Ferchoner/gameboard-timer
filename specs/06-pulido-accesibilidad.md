# SPEC 06 — Aviso al invitado, nombres largos, accesibilidad e iconos propios

> **Estado:** Borrador
> **Depende de:** SPEC 01 (editor) y SPEC 04 (último cambio a los componentes de sesión)
> **Fecha:** 2026-11-11
> **Objetivo:** Cerrar los ajustes pequeños de la revisión QA: avisar al invitado antes de que pierda sus timers, que los nombres largos no rompan la pantalla del timer, que los controles tengan nombre accesible y que los iconos se vean sin depender de Google Fonts.

## Por qué existe esta spec

Quedaron cuatro hallazgos de la revisión QA del 2026-11-11 que la revisión marcó como ajustes pequeños:

- **P1-5 (resto).** Como invitado, recargar o cerrar la página borra todos los timers sin aviso. La confirmación al borrar un timer ya se hizo en la spec 01.
- **P1-10.** Con 5 jugadores o más, un nombre largo se sale de la tarjeta en la pantalla del timer (`white-space: nowrap` sin recorte). El editor no limita el largo del nombre.
- **P2-8.** Accesibilidad:
  - Los botones de jugar, editar y borrar de la lista, y el "+" para crear un timer, solo tienen icono y no tienen nombre accesible. Un lector de pantalla lee "play_circle".
  - Varias etiquetas no apuntan a su campo: login (`floatingInput`, `floatingPassword`), registro (`firstname`, `lastname`, `email`, `password`) y el editor (`timer-title`, `players`, `timer-player-name` y `timer-player-color`, cuyos campos llevan el índice en el id).
  - Sin conexión a Google Fonts, los iconos se ven como texto ("play_circle").
- **P2-9.** `FUNCIONALIDAD_ACTUAL.md` dice que el color se guarda como `rgb(…)`. Fernando confirmó en Firestore que se guarda en hex (2026-11-11), que es lo que genera `faker.color.rgb()`.

## Alcance

**Entra:**

- **Aviso al invitado.**
  - Si la sesión es de invitado y hay al menos un timer, al recargar o cerrar la página el navegador pide confirmación (`beforeunload`). El texto de ese diálogo lo pone el navegador y no se puede cambiar.
  - Por eso la lista también muestra, a invitados con timers, un aviso en inglés: "Guest mode: your timers are lost if you reload or close this page. Sign up to keep them."
  - Con sesión, o sin timers, no hay ni diálogo ni aviso.
- **Nombres largos.**
  - En la pantalla del timer, el nombre del jugador se corta con "…" si no cabe, en todas las distribuciones de 1 a 12 jugadores.
  - En el editor, el nombre de cada jugador admite hasta 20 caracteres (`maxlength="20"`).
  - Los nombres más largos que ya estén guardados se siguen mostrando, cortados con "…".
- **Nombre accesible.**
  - `aria-label` en los botones de solo icono de la lista: "Play {título}", "Edit {título}", "Delete {título}" y "New timer".
  - Los `<span>` de icono llevan `aria-hidden="true"` donde el botón ya tiene nombre.
- **Etiquetas.** Cada `label for` del login, el registro y el editor apunta al `id` de su campo. En el editor, los ids por jugador quedan `timer-player-name-{i}` y `timer-player-color-{i}`.
- **Iconos desde el propio sitio.**
  - La fuente Material Symbols Outlined (la misma de Google, con la misma variante `opsz 48, wght 400, FILL 0, GRAD 0`) se sirve desde `assets/fonts/`.
  - Es un subconjunto con solo los iconos que usa la app.
  - Se quita el `<link>` a `fonts.googleapis.com` de `nuxt.config.ts`.
  - El subconjunto se regenera con un script cuando se agrega un icono.
- Documentar la fuente y su licencia en `RECURSOS_Y_LICENCIAS.md`, con el archivo de licencia Apache 2.0 junto a la fuente.
- Corregir el color a hex en `FUNCIONALIDAD_ACTUAL.md`.
- Pruebas unitarias y E2E de lo anterior, y actualizar `CHECKLIST_PRUEBAS.md`.

**Fuera de alcance:**

- Guardar los timers de invitado en el navegador (`localStorage`). Cambia la idea de que el invitado vive solo en memoria; si se quiere, va en otra spec.
- Cambiar el icono de algún botón o el diseño. La fuente es la misma, servida desde otro lugar.
- Una auditoría completa de accesibilidad (contraste, foco, navegación con teclado del modal).
- Limitar el largo del título del timer. La lista ya lo corta a 13 caracteres.
- Cambiar datos guardados: los nombres largos existentes no se recortan en Firestore.

## Modelo de datos

Esta spec no cambia el modelo de Firestore. Solo se corrige la documentación del campo `color`:

```js
// Timers/{FSid}.players[n]
{ name: 'Jack', color: '#a1b2c3', timeValue: 25, currentTime: 25 } // color en hex
```

Constante nueva en `stores/TimerStore.js`:

```js
export const MAX_NAME_LENGTH = 20;
```

Archivos nuevos:

```
assets/fonts/material-symbols-outlined.woff2   # subconjunto con los iconos de la app
assets/fonts/LICENSE-material-symbols.txt      # Apache 2.0
assets/css/_icons.scss                         # @font-face y clase .material-symbols-outlined
scripts/update-icon-font.mjs                   # descarga el subconjunto desde Google Fonts
components/GuestNotice.vue                     # aviso de invitado en la lista
tests/unit/icons.spec.js                       # todo icono usado está en el subconjunto
tests/e2e/pulido.spec.js
```

Iconos del subconjunto, en `scripts/update-icon-font.mjs`: `add`, `add_circle`, `cancel`, `delete`, `edit`, `home`, `pause_circle`, `play_circle`, `remove`, `skip_next` y `stop_circle`.

## Plan de implementación

Rama `spec-06-pulido-accesibilidad`. Cada paso deja la app funcionando, con `npm test` en verde.

1. **Iconos propios.**
   - Crear `scripts/update-icon-font.mjs`. Pide a Google Fonts la misma variante con `icon_names=` y la lista de iconos, y guarda el `.woff2` en `assets/fonts/`.
   - Correrlo una vez y agregar `LICENSE-material-symbols.txt` y `_icons.scss`, importado desde `master.scss`.
   - Quitar el `<link>` de Google Fonts.
   - Unitaria `icons.spec.js`: busca en `components/` el texto de cada `material-symbols-outlined` y falla si alguno no está en la lista del script.
   - E2E: la app no pide nada a `fonts.googleapis.com` ni a `fonts.gstatic.com`, `document.fonts.check('24px "Material Symbols Outlined"')` es verdadero y el ancho del icono de "+" es el de un icono, no el de un texto.
2. **Nombre accesible y etiquetas.**
   - `aria-label` en los botones de la lista y `aria-hidden` en los iconos.
   - Ids que coinciden con cada `label for` en el login, el registro y el editor.
   - E2E: `getByRole('button', { name: 'New timer' })` y `getByLabel('Email address')`, entre otros, encuentran sus elementos.
3. **Nombres largos.**
   - `MAX_NAME_LENGTH` y `maxlength` en el campo de nombre del editor.
   - CSS en `TimerApp.vue`: `overflow: hidden` y `text-overflow: ellipsis` en `.player-name` para todas las distribuciones.
   - E2E: escribir 30 caracteres deja 20. Con 12 jugadores de nombre largo, ningún nombre es más ancho que su tarjeta.
4. **Aviso al invitado.**
   - `GuestNotice.vue` en la lista, visible si `userStore.isGuest` y hay timers.
   - Un `beforeunload` en `app.vue` que pide confirmación en ese mismo caso.
   - E2E: sin timers no hay aviso ni diálogo. Con un timer aparece el aviso, y recargar abre el diálogo `beforeunload`; al cancelarlo el timer sigue ahí.
5. **Documentación.**
   - `RECURSOS_Y_LICENCIAS.md`: la fila de Material Symbols pasa a `assets/fonts/`, con cómo regenerarla.
   - `FUNCIONALIDAD_ACTUAL.md`: color en hex, aviso al invitado y límite de 20 caracteres.
   - `CHECKLIST_PRUEBAS.md` y `CONTEXTO_MAESTRO.md`.

## Criterios de aceptación

- [ ] `NITRO_PRESET=github-pages npm run build` termina sin errores.
- [ ] `npm test` y `npm run test:rules` pasan en local y en la CI.
- [ ] Sin conexión a Google, los iconos se ven como iconos y no como texto.
- [ ] La app no hace peticiones a `fonts.googleapis.com` ni a `fonts.gstatic.com`.
- [ ] Los iconos se ven igual que antes, porque son la misma fuente y la misma variante.
- [ ] Todo icono usado en `components/` está en el subconjunto; si no, falla una prueba.
- [ ] Un lector de pantalla anuncia "Play {título}", "Edit {título}", "Delete {título}" y "New timer" en la lista.
- [ ] Cada etiqueta del login, el registro y el editor, al tocarla, enfoca su campo.
- [ ] El nombre de un jugador no pasa de 20 caracteres en el editor.
- [ ] Con 12 jugadores, un nombre largo se corta con "…" y no se sale de su tarjeta.
- [ ] Como invitado con al menos un timer, recargar o cerrar pide confirmación, y la lista muestra el aviso.
- [ ] Con sesión, o sin timers, no hay diálogo ni aviso.
- [ ] `FUNCIONALIDAD_ACTUAL.md` documenta el color en hex.

## Decisiones

- **Sí:** diálogo del navegador al recargar o cerrar como invitado con timers (Fernando, 2026-11-11).
- **Sí:** aviso visible en la lista que dice que se pierden los timers. El navegador no deja personalizar el texto de su diálogo, y Fernando pidió que el aviso diga que se perderá lo hecho (2026-11-11).
- **No:** guardar los timers de invitado en el navegador. Es otra spec.
- **Sí:** máximo de 20 caracteres por nombre y corte con "…" en la pantalla del timer (Fernando, 2026-11-11).
- **Sí:** servir Material Symbols desde el propio sitio (Fernando, 2026-11-11).
- **Sí:** subconjunto con solo los iconos usados, en lugar de la fuente completa, que pesa varios MB. Un script lo regenera y una prueba avisa si falta un icono.
- **No:** el paquete npm `material-symbols`. Trae la fuente variable completa, mucho más pesada que el subconjunto.
- **Sí:** color en hex en la documentación (confirmado por Fernando en Firestore, 2026-11-11).

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Alguien agrega un icono nuevo y se ve como texto porque no está en el subconjunto. | `icons.spec.js` falla en la CI y dice qué icono falta; el script lo agrega. |
| Google cambia el formato de la URL con `icon_names`. | Solo afecta al regenerar el subconjunto; la fuente ya guardada en el repo sigue funcionando. |
| El diálogo `beforeunload` molesta al navegar dentro de la app. | Solo salta al recargar, cerrar o salir del sitio; la navegación interna de Nuxt no lo dispara. |
| Algunos navegadores móviles no muestran el diálogo `beforeunload`. | Por eso también hay aviso visible en la lista. |
