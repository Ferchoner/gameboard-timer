# SPEC 04 — Firebase seguro y sin errores silenciosos

> **Estado:** Aprobado
> **Depende de:** SPEC 03 (pruebas) y SPEC 05 (Node 24 y Firebase 13)
> **Fecha:** 2026-11-11
> **Objetivo:** Que cada usuario solo pueda leer y escribir sus propios datos en Firestore, que no se guarden tokens ni escrituras innecesarias, y que los fallos de Firebase se vean en la app en lugar de perderse.

## Por qué existe esta spec

La revisión QA del 2026-11-11 dejó estos pendientes de Firebase:

- **P2-1.** Las reglas de Firestore no están en el repo. Las publicadas hoy, según la consola (Fernando, 2026-11-11), son:

  ```
  match /{document=**} {
    allow read, write: if request.auth != null;
  }
  ```

  Cualquier persona con una cuenta puede leer, cambiar o borrar los usuarios y timers de todos los demás. Los ids de `Timers` son predecibles (`uid-xxxxx`).
- **P2-6.** El registro guarda el `accessToken` de Firebase en `Users/{uid}`. Un token en la base de datos no hace falta y es sensible.
- **P2-3.** Con sesión, `syncTimeValues` escribe en Firestore cada 5 s mientras la pantalla del timer está abierta, aunque el reloj esté en pausa.
- **P2-4.** Ninguna escritura a Firestore maneja errores. Si una falla, la app no avisa y los datos locales y los guardados dejan de coincidir.
- **P2-5.** `removeTimer` quita la referencia de `Users.timers` por índice, suponiendo el mismo orden que la lista local. Si falta un documento de `Timers`, `getUserData` mete `undefined` en la lista y la página revienta.
- **P1-6.** Los errores de login y registro muestran el código técnico de Firebase (`message.split(':')[1]`), o nada. La contraseña mínima de 6 caracteres no se valida antes de enviar.
- **P1-7.** Si en el registro falla la escritura de `Users/{uid}`, queda un usuario en Auth sin documento, y su login falla después con un `TypeError`.
- **P2-7 (parte de datos).** El login carga los datos del usuario dos veces: una en `login` y otra en el listener de Auth.

Los favicons, el manifest y el timeout del loading (P2-2 y la otra parte de P2-7) van en un PR pequeño aparte, sin spec (Fernando, 2026-11-11).

## Alcance

**Entra:**

- `firestore.rules` versionado en el repo. Cada usuario con sesión puede leer y escribir solo:
  - su documento `Users/{uid}`;
  - los `Timers/{id}` cuyo id empieza con `{su uid}-`. Es el formato que usa la app desde el primer commit, así que no hay que tocar datos.
- `firebase.json` con la configuración del emulador de Firestore, solo para las pruebas.
- Pruebas de las reglas con el emulador de Firebase (`firebase-tools` y `@firebase/rules-unit-testing`) en un script `test:rules`. La CI las corre en cada PR, con Java instalado.
- Dejar de guardar `accessToken` al registrarse, y borrarlo de `Users/{uid}` (`deleteField()`) la próxima vez que el usuario inicie sesión.
- Guardado del reloj: `syncTimeValues` solo escribe si algún tiempo cambió desde la última escritura de ese timer. Al salir de la pantalla del timer se escribe una vez más con los tiempos finales, si cambiaron.
- Errores de escritura visibles: si falla una escritura a Firestore, aparece un aviso en inglés que se puede cerrar, "Couldn't save changes. Check your connection.". El aviso no se repite mientras siga abierto.
- Login y registro robustos:
  - Si `Users/{uid}` no existe al iniciar sesión, se crea a partir del usuario de Auth (email, nombre y `timers: []`). Así se reparan las cuentas que quedaron a medias (P1-7).
  - Los documentos de `Timers` que ya no existen se ignoran al cargar, en lugar de romper la lista.
  - `removeTimer` quita la referencia de `Users.timers` por su id (`arrayRemove`), no por índice.
  - Los datos del usuario se cargan una sola vez por login, desde el listener de Auth.
- Mensajes de error claros en inglés para login y registro, según el código de Firebase. Si el código no está en la lista, se muestra "Something went wrong. Try again.".
- Validar antes de enviar que la contraseña del registro tenga al menos 6 caracteres.
- Pruebas unitarias y E2E de lo anterior, y actualizar `FUNCIONALIDAD_ACTUAL.md`, `CHECKLIST_PRUEBAS.md`, `PUBLICACION_GITHUB_PAGES.md`, `CONTEXTO_MAESTRO.md`, `CLAUDE.md` y `README.md`.

**Fuera de alcance (para otras specs o PRs):**

- Publicar las reglas en Firebase. Es un cambio en producción y lo hace Fernando desde la consola después del merge (ver el paso 9).
- Favicons, manifest y timeout del loading (PR aparte).
- Apuntar la app al emulador o probar el login de punta a punta con el emulador. Requiere tocar `plugins/firebase.client.ts`.
- Cambiar `Users.timers` de referencias a ids, o guardar un campo `owner` en `Timers`.
- Cola de reintentos propia o modo sin conexión. El SDK de Firestore ya reintenta las escrituras pendientes.
- Recuperar contraseña, verificar email o borrar la cuenta.
- La página "My Account" (`/user`).

## Modelo de datos

Único cambio, aprobado por Fernando el 2026-11-11: `Users/{uid}` deja de tener `accessToken`.

```js
// Users/{uid}
{
  email: 'ana@example.com',
  username: 'ana',
  firstName: 'Ana',
  lastName: 'López',
  uid: '…',
  guest: false,
  timers: [/* DocumentReference a Timers/{FSid} */]
}
```

`Timers/{FSid}` no cambia: `FSid` sigue siendo `${uid}-${5 caracteres alfanuméricos}`.

Reglas (`firestore.rules`):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /Users/{uid} {
      allow read, write: if request.auth != null && request.auth.uid == uid;
    }
    match /Timers/{timerId} {
      allow read, write: if request.auth != null
        && timerId.matches(request.auth.uid + '-[A-Za-z0-9]+');
    }
  }
}
```

Lo que no está en esas dos reglas queda negado, incluidas las colecciones nuevas.

Estado nuevo, solo en memoria:

```js
// MainStore
saveError: false               // true mientras se muestra el aviso de error de escritura

// TimerStore
lastSyncedTimes: { [FSid]: [/* centésimas por jugador, de la última escritura */] }
```

Archivos nuevos:

```
firestore.rules
firebase.json                 # solo emulador de Firestore (puerto 8080)
utils/authErrors.js           # código de Firebase → mensaje en inglés
components/SaveErrorToast.vue # aviso de error de escritura
tests/rules/firestore.rules.spec.js
vitest.rules.config.mjs
tests/unit/authErrors.spec.js
```

Dependencias de desarrollo nuevas: `firebase-tools` y `@firebase/rules-unit-testing`, en la última versión estable compatible con Node 24 y Firebase 13, con versión fija.

## Plan de implementación

Rama `spec-04-firebase-seguro`. Cada paso deja la app funcionando, con `npm test` en verde.

1. **Reglas y su prueba.** Agregar `firestore.rules`, `firebase.json`, las dos dependencias, `vitest.rules.config.mjs`, `tests/rules/firestore.rules.spec.js` y el script `test:rules` (`firebase emulators:exec --only firestore "vitest run --config vitest.rules.config.mjs"`). Casos:
   - Ana lee y escribe su `Users/ana` y no puede leer ni escribir `Users/beto`.
   - Ana crea, lee, actualiza y borra `Timers/ana-a1B2c`, y no puede con `Timers/beto-a1B2c`.
   - Ana no puede crear `Timers/otra-cosa` ni `Timers/ana` (sin sufijo).
   - Sin sesión no se puede leer ni escribir nada.
   - Una colección cualquiera queda negada.

   Comando: `npm run test:rules` (necesita Java 21 o posterior).
2. **CI de reglas.** En `ci.yml`, `actions/setup-java` (Temurin 21) y `npm run test:rules` después de las unitarias.
3. **Sin `accessToken`.** `register` deja de guardarlo. Al iniciar sesión, si el documento lo tiene, se borra con `updateDocument('Users', uid, { accessToken: deleteField() })`. `useFirestore` expone `deleteField` y `arrayRemove`. Unitarias: el registro no lo escribe y el login lo borra solo si existe.
4. **Login y registro robustos.** En `UserStore`:
   - `getUserData` crea `Users/{uid}` si no existe y descarta los `Timers` que no existen.
   - `login` solo autentica; la carga queda en el listener.
   - `removeTimer` y `updateTimers` quitan la referencia con `arrayRemove`.

   Unitarias para cada caso, con Firestore simulado.
5. **Guardado solo con cambios.** `syncTimeValues` compara con `lastSyncedTimes[FSid]` y no escribe si nada cambió. `TimerApp.vue` llama a `syncTimeValues` una vez al desmontarse. Unitarias: dos llamadas con los mismos tiempos escriben una vez; con un tiempo distinto escribe de nuevo.
6. **Errores de escritura visibles.** Todas las escrituras de `TimerStore` y `UserStore` capturan el error y llaman a `mainStore.reportSaveError()`. `SaveErrorToast.vue` en `app.vue` muestra el aviso mientras `saveError` sea `true`, y se cierra con su X. Unitaria: una escritura que falla pone `saveError` en `true` sin lanzar el error.
7. **Mensajes de login y registro.** `utils/authErrors.js` traduce los códigos más comunes:
   - `auth/invalid-credential`, `auth/wrong-password` y `auth/user-not-found` → "Wrong email or password."
   - `auth/email-already-in-use` → "That email already has an account."
   - `auth/invalid-email` → "Enter a valid email."
   - `auth/weak-password` → "Password must be at least 6 characters."
   - `auth/too-many-requests` → "Too many attempts. Try again later."
   - `auth/network-request-failed` → "No connection. Try again."

   `LoginFormComponent` y `UserRegisterForm` lo usan. El registro valida los 6 caracteres antes de enviar. Unitarias de `authErrors` y una E2E: registrar con contraseña de 5 caracteres muestra el mensaje sin llamar a Firebase.
8. **Documentación.** Actualizar:
   - `FUNCIONALIDAD_ACTUAL.md`: modelo sin `accessToken`, reglas, guardado y errores.
   - `CHECKLIST_PRUEBAS.md`: casos con cuenta nuevos y `test:rules`.
   - `PUBLICACION_GITHUB_PAGES.md`: cómo publicar las reglas.
   - `CONTEXTO_MAESTRO.md`, `CLAUDE.md` y `README.md`: comando `test:rules`.
9. **Publicar las reglas (Fernando, después del merge).** Copiar `firestore.rules` en la consola, en Firestore Database → Rules, y pulsar Publish. Antes, con el simulador de reglas de la consola, comprobar que un usuario lee su propio `Users/{uid}`. Después, la checklist "Con cuenta" en producción.

## Criterios de aceptación

- [ ] `NITRO_PRESET=github-pages npm run build` termina sin errores.
- [ ] `npm test` y `npm run test:rules` pasan en local y en la CI.
- [ ] Las pruebas de reglas demuestran que un usuario no puede leer, cambiar ni borrar `Users` ni `Timers` de otro, y que sin sesión no hay acceso.
- [ ] Un usuario nuevo queda en `Users/{uid}` sin `accessToken`.
- [ ] Un usuario existente que inicia sesión queda sin `accessToken` en su documento.
- [ ] Con el timer abierto en pausa no hay escrituras a Firestore. Con el reloj corriendo sigue escribiendo como máximo cada 5 s, y al salir de la pantalla se guarda el tiempo final.
- [ ] Si una escritura falla (por ejemplo, al negarla las reglas), aparece "Couldn't save changes. Check your connection." y la app sigue funcionando.
- [ ] Login con contraseña incorrecta muestra "Wrong email or password.".
- [ ] El registro con una contraseña de menos de 6 caracteres muestra el mensaje y no llama a Firebase.
- [ ] Una cuenta sin `Users/{uid}` puede iniciar sesión, y el documento se crea.
- [ ] Un timer referenciado que ya no existe no rompe la lista.
- [ ] Borrar un timer quita su referencia correcta de `Users.timers`, aunque el orden local sea distinto.
- [ ] Iniciar sesión lee `Users/{uid}` una sola vez.
- [ ] Con las reglas nuevas publicadas, la checklist "Con cuenta" pasa en producción.

## Decisiones

- **Sí:** reglas por dueño usando el prefijo `uid-` del id de `Timers`. No hace falta migrar datos (Fernando, 2026-11-11).
- **No:** agregar un campo `owner` a `Timers`. Cambia el modelo y el prefijo ya identifica al dueño.
- **Sí:** probar las reglas con el emulador en la CI, aunque se alargue un minuto (Fernando, 2026-11-11).
- **Sí:** publicar las reglas a mano desde la consola. Fernando es el dueño del proyecto de Firebase; no se agregan credenciales de Firebase a GitHub.
- **Sí:** quitar `accessToken` del modelo y borrarlo al iniciar sesión (Fernando, 2026-11-11).
- **Sí:** guardar los tiempos solo si cambiaron, y una vez al salir de la pantalla (Fernando, 2026-11-11).
- **Sí:** errores visibles en inglés, mensajes claros de login y registro, y contraseña mínima de 6 (Fernando, 2026-11-11).
- **Sí:** dividir el alcance. Favicons, manifest y timeout del loading van en un PR aparte (Fernando, 2026-11-11).
- **No:** probar el login real con el emulador. Requiere tocar `plugins/firebase.client.ts`; las reglas se prueban sin la app.
- **Sí:** reparar al iniciar sesión las cuentas sin documento, en lugar de borrar el usuario de Auth en el registro. Arregla también las cuentas que ya quedaron así.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Hay timers en producción con un id que no empieza con `uid-` y quedarían inaccesibles. | El formato es el mismo desde el primer commit. Antes de publicar, Fernando revisa en la consola que los ids de `Timers` sigan el formato. |
| Publicar reglas mal escritas bloquea a todos los usuarios. | Las reglas pasan las pruebas del emulador y el simulador de la consola antes de publicarse. Si algo falla, se vuelve a pegar la regla anterior, que queda anotada en esta spec. |
| Con las reglas nuevas, alguna lectura o escritura que hoy pasa empieza a fallar. | Cada escritura de la app está en las pruebas de reglas. Además, con el aviso del paso 6 un fallo ya no es silencioso. |
| Sin conexión, el SDK de Firestore deja las escrituras pendientes y no las rechaza, así que el aviso no aparece. | Aceptado: el SDK las envía al volver la conexión. El aviso cubre los rechazos reales (permisos, cuota). |
| `firebase-tools` es pesado y su emulador necesita Java. | Solo es dependencia de desarrollo. La CI instala Java con `setup-java`; en local, `test:rules` es opcional y no forma parte de `npm test`. |
