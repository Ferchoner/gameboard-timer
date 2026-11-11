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
   referencia, y los pone en `TimerStore.timers`.
3. Si no hay usuario, deja el usuario vacío (invitado) y vacía los timers.
4. Mientras `usrChecked` es `false` se muestra `IsLoadingComponent`.

### Login, registro y logout

- Login: modal en el header (`LoginFormComponent`), email y contraseña.
- Registro (`UserRegisterForm`): crea el usuario en Auth, escribe `Users/{uid}` y pone
  `displayName` con nombre y apellido.
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

- El tiempo se lleva en centésimas de segundo (`timeInSeconds[i] = minutos × 6000`); un
  `setInterval` de 10 ms resta 1.
- Hasta 12 jugadores (los arreglos internos tienen 12 posiciones).
- Al llegar a 0 se para ese contador y suena `#time_over`.
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
  accessToken: '…',         // se guarda el token del registro
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
- `removeTimer` → `deleteDocument('Timers', FSid)` y quita la referencia por índice.
- `syncTimer` → iguala siempre `timeValue` y `currentTime` de todos los jugadores al del primero
  (`applySharedTime`, como número) y, con sesión, hace `updateDocument` del timer completo.
- `syncTimeValues` → `updateDocument` solo de `players` con el `currentTime` actual.

Las clases `Timer` y `Player` (en `TimerStore.js`) definen los valores por defecto.
