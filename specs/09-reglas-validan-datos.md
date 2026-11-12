# SPEC 09 — Reglas de Firestore que validan los datos

> **Estado:** Aprobado
> **Depende de:** SPEC 04 (`firestore.rules` por dueño y `npm run test:rules`) y SPEC 08 (`rules.yml` publica las reglas tras el merge)
> **Fecha:** 2026-11-12
> **Objetivo:** Que `firestore.rules` solo acepte documentos `Users` y `Timers` con los campos, tipos y tamaños que escribe la app, y que los ids nuevos de timer sean difíciles de repetir.

## Por qué existe esta spec

Sale de la auditoría técnica del 2026-11-12 (puntos 2 y 8). Fernando aprobó las cinco recomendaciones el mismo día.

- Las reglas actuales solo comprueban el dueño: `Users/{uid}` es de `uid` y `Timers/{uid}-…` es de `uid`.
- Dentro de lo propio se puede escribir cualquier cosa: campos inventados, textos enormes, cientos de jugadores, documentos de hasta 1 MB. Cualquiera puede crear una cuenta con cualquier email y gastar la cuota del proyecto, o dejar datos que la app no sabe leer.
- El id de un timer nuevo es `${uid}-` más 5 caracteres de faker, y se guarda con `setDoc`, que sobrescribe. Si se repite, borra sin aviso otro timer de la misma cuenta.
- El editor limita el nombre del jugador a 20 caracteres (SPEC 06), pero el título no tiene límite.
- No hay cuentas reales (Fernando, 2026-11-12), así que no hay datos viejos que proteger.

## Alcance

**Entra:**

- **`Users/{uid}` en `firestore.rules`.**
  - Lectura y borrado: igual que hoy, solo el dueño.
  - Creación y actualización: solo el dueño, y el documento resultante debe cumplir `validUser`:
    - Campos permitidos (`hasOnly`): `email`, `username`, `firstName`, `lastName`, `uid`, `guest`, `timers`.
    - Campos obligatorios (`hasAll`): `email`, `uid`, `guest`, `timers`.
    - `uid` igual al id del documento.
    - `guest == false`.
    - `email`, `username`, `firstName` y `lastName`: texto de 0 a 100 caracteres.
    - `timers`: lista de 0 a 100 elementos.
- **`Timers/{timerId}` en `firestore.rules`.**
  - Lectura y borrado: igual que hoy (dueño por prefijo `uid-`).
  - Creación y actualización: dueño por prefijo, y el documento resultante debe cumplir `validTimer`:
    - Campos permitidos y obligatorios: `FSid`, `progresive`, `title`, `players`, `createdAt`, `updateAt`.
    - `FSid` igual al id del documento.
    - `progresive`: booleano.
    - `title`: texto de 1 a 40 caracteres.
    - `createdAt` y `updateAt`: timestamp.
    - `players`: lista de 1 a 12 jugadores, cada uno válido según `validPlayer`.
  - `validPlayer`:
    - Campos permitidos y obligatorios: `name`, `color`, `timeValue`, `currentTime`.
    - `name`: texto de 1 a 20 caracteres.
    - `color`: texto hex `#rrggbb` (`^#[0-9a-fA-F]{6}$`).
    - `timeValue`: número de 10 a 120 (minutos, el rango del editor).
    - `currentTime`: número de 0 a 120.
  - Las reglas no tienen bucles: `players` se valida posición por posición hasta la 12 (`size() <= i || validPlayer(players[i])`).
- **Id de timer.** En `TimerStore.syncTimers`, el id nuevo pasa a `${uid}-` más 20 caracteres alfanuméricos de `crypto.getRandomValues`, en vez de 5 de faker. La regla del prefijo no cambia: ya acepta cualquier cantidad de caracteres alfanuméricos.
- **Editor.** `MAX_TITLE_LENGTH = 40` en `stores/TimerStore.ts` y `maxlength` en el campo del título de `TimerModal.vue`, igual que los nombres. Así nadie choca con la regla sin saber por qué.
- **Pruebas.**
  - `tests/rules/firestore.rules.spec.js`: casos válidos con los documentos exactos que escribe la app (registro, documento mínimo de `getUserData`, timer nuevo de la clase `Timer`, actualización parcial de `players` de `syncTimeValues`, quitar `accessToken` con `deleteField`, agregar y quitar referencias de `timers`). Casos negados: campo extra, campo faltante, `uid` o `FSid` distinto del id, `guest: true`, título vacío o de 41, 0 o 13 jugadores, nombre vacío o de 21, color no hex, `timeValue` fuera de 10–120, `currentTime` negativo, tipos equivocados y `timers` con 101 elementos.
  - `tests/unit/TimerStore.spec.js`: el id nuevo cumple `^{uid}-[A-Za-z0-9]{20}$` y dos timers seguidos no repiten id.
  - `tests/e2e/editor.spec.js`: el título no acepta más de 40 caracteres.
- **Documentación.** `docs/02_diseno/FUNCIONALIDAD_ACTUAL.md` (formato del `FSid` y límites), comentario de cabecera de `firestore.rules`, `docs/07_publicacion/CHECKLIST_PRUEBAS.md` y `docs/01_contexto/CONTEXTO_MAESTRO.md`.

**Fuera de alcance (para otras specs):**

- Limitar cuántos timers crea una cuenta. Las reglas no pueden contar documentos; el tope de 100 referencias en `Users.timers` no impide crear timers sin referencia. Lo cierra App Check, en otra spec.
- App Check, verificación de email, recuperar contraseña y política de contraseña.
- Atar `email` al email de la sesión (`request.auth.token.email`). Fallaría si algún día se cambia el email.
- Validar que cada referencia de `Users.timers` apunte a un timer propio. Las reglas no pueden revisar el contenido de una lista; leerlas ya está negado para timers ajenos.
- Quitar faker para los nombres y colores de los jugadores (SPEC 10).
- Migrar o limpiar datos viejos: no hay cuentas reales.
- Cambiar el modelo de datos: los campos y tipos son los de hoy.

## Modelo de datos

Esta spec no cambia el modelo. Lo escribe como reglas.

El único cambio de formato es el id de los timers nuevos:

```js
// Antes:  `${uid}-${faker.string.alphanumeric(5)}`  →  'uid-a1B2c'
// Ahora:  `${uid}-${20 caracteres de [A-Za-z0-9] con crypto.getRandomValues}`
FSid: 'uid-Q8fK2mZp0LwX7cVb4NsT'
```

Un documento `Timers` válido, tal como lo escribe la app:

```js
{
  FSid: 'uid-Q8fK2mZp0LwX7cVb4NsT',   // igual al id del documento
  progresive: false,                   // booleano
  title: 'New Timer',                  // 1 a 40 caracteres
  createdAt: Timestamp,
  updateAt: Timestamp,
  players: [                           // 1 a 12
    { name: 'Ana', color: '#a1b2c3', timeValue: 25, currentTime: 25 }
    // name 1–20, color #rrggbb, timeValue 10–120, currentTime 0–120
  ]
}
```

Un documento `Users` válido:

```js
{
  email: 'ana@example.com',   // texto ≤ 100 (obligatorio)
  username: 'ana',            // texto ≤ 100
  firstName: 'Ana',           // texto ≤ 100
  lastName: 'López',          // texto ≤ 100
  uid: 'ana',                 // igual al id del documento (obligatorio)
  guest: false,               // siempre false (obligatorio)
  timers: []                  // 0 a 100 referencias (obligatorio)
}
```

## Plan de implementación

Rama `spec-09-reglas-validan-datos`, creada desde `master`. Un commit por paso; cada paso deja la CI en verde.

1. **Pruebas de lo que escribe la app.** Agregar a `tests/rules/` los casos válidos con los documentos exactos de la app. Con las reglas actuales ya pasan. Prueba: `npm run test:rules` en verde.
2. **`validTimer` y `validPlayer`** en `firestore.rules`, con sus casos negados. Prueba: `npm run test:rules` en verde, incluidos los del paso 1.
3. **`validUser`** en `firestore.rules`, con sus casos negados. Prueba: `npm run test:rules` en verde.
4. **Id de 20 caracteres** en `TimerStore.syncTimers`, con su prueba unitaria. Prueba: `npm run test:unit` en verde.
5. **Límite del título** en el editor, con su prueba E2E. Prueba: `npm run test:e2e` en verde.
6. **Documentación.**

## Criterios de aceptación

- [ ] `npm run test:rules` pasa en local y en la CI, con casos válidos para cada documento que escribe la app y al menos un caso negado por cada condición de `validUser`, `validTimer` y `validPlayer`.
- [ ] Un timer con un campo extra, sin un campo, con `FSid` distinto del id, con título de 41 caracteres o con 13 jugadores se rechaza.
- [ ] Un jugador con nombre de 21 caracteres, color `red` o `timeValue: 5` se rechaza.
- [ ] Un `Users/{uid}` con `uid` distinto, `guest: true`, un campo extra o 101 timers se rechaza.
- [ ] Quitar `accessToken` con `deleteField` y la actualización parcial de `players` siguen aceptándose.
- [ ] Los timers nuevos tienen id `${uid}-` más 20 caracteres alfanuméricos; los de 5 caracteres siguen leyéndose y editándose.
- [ ] El campo del título no acepta más de 40 caracteres.
- [ ] `npm run build`, `npm run typecheck`, `npm run size` y `npm test` en verde.
- [ ] Tras el merge, `rules.yml` publica las reglas en verde.
- [ ] Con una cuenta de prueba en producción: registrarse, crear, editar, jugar y borrar un timer funciona sin el aviso "Couldn't save changes".

## Decisiones

- **Sí:** título de 1 a 40 caracteres en las reglas y en el editor; nombre de 1 a 20 como ya tiene el editor (Fernando, 2026-11-12).
- **Sí:** reglas estrictas sin pensar en datos viejos, porque no hay cuentas reales (Fernando, 2026-11-12).
- **Sí:** `Users` con campos cerrados, `uid` igual al id, `guest: false`, textos de hasta 100 y hasta 100 timers (Fernando, 2026-11-12).
- **No:** atar `email` al de la sesión. Rompe si el email cambia (Fernando, 2026-11-12).
- **Sí:** aceptar que las reglas no limitan cuántos timers se crean; App Check queda para otra spec (Fernando, 2026-11-12).
- **Sí:** id de timer con 20 caracteres de `crypto.getRandomValues` y el mismo prefijo `uid-` (Fernando, 2026-11-12). 62^20 combinaciones hacen improbable una colisión, y la regla del prefijo no cambia.
- **No:** usar el id automático de `doc()`. Daría el mismo largo, pero obliga a cambiar cómo se arma el `FSid` y el prefijo que usan las reglas.
- **Sí:** validar `players` posición por posición hasta 12, porque las reglas no tienen bucles.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Una escritura legítima de la app que no vimos queda negada y sale "Couldn't save changes". | El paso 1 prueba primero, con las reglas actuales, cada documento que escribe la app; se repasa la checklist "Con cuenta" en producción. Si algo falla, revertir el PR vuelve a publicar las reglas anteriores (`rules.yml`). |
| Las reglas y el cambio de la app se publican casi a la vez y por un momento no coinciden. | Las reglas nuevas aceptan los ids de 5 y de 20 caracteres, y el límite del título solo afecta a títulos de más de 40. No hay cuentas reales. |
| Las reglas pasan el límite de expresiones por la validación de 12 jugadores. | Firestore permite 1000 expresiones por petición; 12 jugadores con 4 campos quedan muy por debajo. La prueba con 12 jugadores lo confirma. |
| Un `timeValue` guardado como texto en algún documento. | No hay datos reales; la app siempre escribe números (`Number(...)`). |

## Lo que **no** entra en esta spec

- Limitar cuántos timers crea una cuenta, y App Check.
- Verificación de email, recuperar contraseña y política de contraseña.
- Quitar faker de nombres y colores (SPEC 10).
- Cambios al modelo de datos o migración de datos viejos.

Cada uno, si llega, va en su propia spec.
