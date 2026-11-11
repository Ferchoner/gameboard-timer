# Funcionalidad actual

> Descripción de cómo funciona la app hoy (2026-11-11), sacada del código. Si el código cambia,
> se actualiza este documento en el mismo PR.

## Rutas

| Ruta | Página | Componente | Qué hace |
|---|---|---|---|
| `/` | `pages/index.vue` | `components/Page/Timers.vue` | Lista de timers |
| `/timers` | `pages/timers.vue` | `components/Page/Timers.vue` | Igual que `/` |
| `/timer-app/[id]` | `pages/timer-app/[id].vue` | `components/Page/TimerApp.vue` | Timer en marcha; `id` es el índice en `TimerStore.timers` |
| `/user` | `pages/user/index.vue` | `components/Page/User.vue` | Vacía ("User Page") |
| `/user/signup-form` | `pages/user/signup-form.vue` | `components/Page/UserRegisterForm.vue` | Registro |

Todas cuelgan de `baseURL: '/gameboard-timer/'`. En `/timer-app/[id]` se muestra
`LightHeader` (inicio y atrás) y fondo oscuro; en las demás, `HeaderComponent` y `FooterComponent`.

## Flujos

### Arranque y sesión (`app.vue`, `stores/UserStore.js`)

1. `app.vue` espera a que Firebase Auth y Firestore estén listos (`MainStore`) y llama a
   `userStore.listenAuth()`.
2. Si hay usuario, `getUserData` lee `Users/{uid}` y después cada documento de `Timers` que
   referencia, y los pone en `TimerStore.timers`. Es la única carga: el login espera a la del
   listener. Si `Users/{uid}` no existe (registro a medias), lo crea con email, nombre y
   `timers: []`; si tiene `accessToken` (cuentas viejas), lo borra. Los timers que ya no existen se
   ignoran. Si la lectura falla, la sesión queda sin comprobar y el loading avisa a los 15 s.
3. Si no hay usuario, deja el usuario vacío (invitado) y vacía los timers.
4. Mientras `usrChecked` es `false` se muestra `IsLoadingComponent`.

### Login, registro y logout

- Login: modal en el header (`LoginFormComponent`), email y contraseña.
- Registro (`UserRegisterForm`): valida que la contraseña tenga al menos 6 caracteres, crea el
  usuario en Auth, escribe `Users/{uid}` (sin token) y pone `displayName` con nombre y apellido.
- Los errores de login y registro se traducen a mensajes en inglés (`utils/authErrors.js`), por
  ejemplo "Wrong email or password."; un código desconocido muestra "Something went wrong. Try
  again.".
- Logout: botón del header; el listener de Auth limpia usuario y timers.

### Timers (`components/Page/Timers.vue`, `TimerComponent.vue`, `TimerModal.vue`)

- "+" crea un timer "New Timer" con 2 jugadores aleatorios (nombre y color con faker).
- Cada fila tiene: jugar (va a `/timer-app/{índice}`), editar (abre `TimerModal`) y borrar.
  Borrar pide confirmación (`window.confirm`); al borrar, `TimerStore.index` se ajusta para no
  quedar fuera de la lista.
- `TimerModal` edita título, número de jugadores (+/−), modo Continuous, tiempo (10–120 min,
  slider sobre `players[0].timeValue`, guardado como número) y nombre y color de cada jugador.
- Jugadores: de 1 a 12 (`MIN_PLAYERS` y `MAX_PLAYERS` en `TimerStore.js`). "+" agrega un jugador
  con el tiempo actual del timer; "−" quita al último. Cada botón se desactiva en su límite.
- Guardar ("Update Timer", la X o Enter) valida que el título y los nombres no estén vacíos. Con
  errores no guarda, el modal sigue abierto y muestra `Title is required` o
  `Player N needs a name`. Sin errores llama a `syncTimer` y cierra el modal.
- Todos los jugadores comparten el tiempo del primero, como invitado y con cuenta
  (`applySharedTime`).

### Timer en marcha (`components/Page/TimerApp.vue`)

- El reloj de cada jugador vive en `composables/useCountdown.ts`: guarda el tiempo restante y el
  `Date.now()` del último inicio, y calcula lo que queda. Un intervalo de 250 ms solo refresca la
  pantalla. Por eso el tiempo sigue corriendo y es exacto aunque la app pase a segundo plano o
  se bloquee el teléfono.
- Los tiempos iniciales salen de `currentTime` de cada jugador en cuanto el timer está en el store.
- Modo normal: cada jugador tiene iniciar/pausar y reiniciar. Al llegar a 0 se detiene, su botón
  vuelve a play y suena `#time_over`.
- Modo Continuous: play arranca al jugador actual o, si no tiene tiempo, al siguiente con tiempo;
  "siguiente" pausa al que corre y arranca al siguiente con tiempo (se salta a los que están en 0);
  pausa detiene al que corre; si nadie tiene tiempo, todo queda detenido. El turno no pasa solo
  al llegar a 0.
- Alarma: si un jugador llega a 0 con la app en segundo plano, suena una vez al volver. Si el
  navegador bloquea el audio, no hay error; la pantalla muestra `0 : 00`.
- Pantalla encendida: `composables/useWakeLock.ts` pide la Wake Lock API al abrir la pantalla del
  timer (corra o esté en pausa), la vuelve a pedir al regresar a la app y la libera al salir.
  Funciona en Chrome Android e iOS 16.4 o posterior; en navegadores sin soporte no hace nada.
- Si `/timer-app/N` no tiene timer una vez comprobada la sesión (invitado que recargó, enlace
  viejo, índice inválido), se muestra "Timer not found" con un botón a la lista.
- Con sesión, cada 5 s `syncTimeValues` guarda el `currentTime` de cada jugador en Firestore.

## Modelo de datos (Firestore)

Proyecto Firebase `timer-42311`. **No cambiar sin una spec aprobada.**

### `Users/{uid}`

```js
{
  email: 'ana@example.com',
  username: 'ana',          // parte del email antes de "@"
  firstName: 'Ana',
  lastName: 'López',
  uid: '…',
  guest: false,
  timers: [/* DocumentReference a Timers/{FSid} */]
}
```

### `Timers/{FSid}`

`FSid` = `${uid}-${5 caracteres alfanuméricos}`.

```js
{
  FSid: 'uid-a1B2c',
  progresive: false,        // modo Continuous
  title: 'New Timer',
  createdAt: Date,
  updateAt: Date,
  players: [
    { name: 'Jack', color: 'rgb(…)', timeValue: 25, currentTime: 25 } // minutos
  ]
}
```

Escrituras (`stores/TimerStore.js`):

- `addTimer` → `setDocument('Timers', FSid)` y agrega la referencia a `Users/{uid}.timers`.
- `removeTimer` → `deleteDocument('Timers', FSid)` y quita la referencia de `Users/{uid}.timers`
  por id (`arrayRemove`).
- `syncTimer` → iguala siempre `timeValue` y `currentTime` de todos los jugadores al del primero
  (`applySharedTime`, como número) y, con sesión, hace `updateDocument` del timer completo.
- `syncTimeValues` → `updateDocument` solo de `players` con el `currentTime` actual, y solo si
  algún tiempo cambió respecto al guardado. `TimerApp` lo llama cada 5 s y al salir de la
  pantalla, así que en pausa no escribe.
- Si una escritura falla, no se lanza el error: `guardWrite` (`stores/MainStore.js`) muestra el
  aviso "Couldn't save changes. Check your connection." (`SaveErrorToast`), que se cierra con su X.

### Reglas de seguridad (`firestore.rules`)

Cada usuario con sesión solo lee y escribe su `Users/{uid}` y los `Timers/{id}` cuyo id empieza con
`{uid}-`. Lo demás queda negado. Se prueban con `npm run test:rules` y se publican a mano (ver
`docs/07_publicacion/PUBLICACION_GITHUB_PAGES.md`).

Las clases `Timer` y `Player` (en `TimerStore.js`) definen los valores por defecto.
