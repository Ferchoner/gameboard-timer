# Checklist de pruebas

Antes de cada PR corren las pruebas automáticas (`npm test`, y la CI las repite). Después se revisa,
en navegador, lo que toque el cambio y no cubran las pruebas.
Probar en escritorio y en un móvil o emulación de móvil (la app se usa en la mesa de juego).

Leyenda: ✅ comprobado · ⚠️ con observaciones · ⬜ pendiente.

## Automático (lo repite la CI)

| Área | Cómo |
|---|---|
| Build de producción | `NITRO_PRESET=github-pages npm run build` sin errores |
| Reloj (`useCountdown`) | `npm run test:unit`: inicio, pausa, tiempo real sin intervalos, aviso único al llegar a 0, reinicios, sin intervalos tras `dispose` |
| Store (`TimerStore`) | `npm run test:unit`: límites de 1 y 12 jugadores, "−" quita al último, tiempo común como número, índice en rango, Firestore solo con sesión, guardado del reloj solo con cambios, borrar quita la referencia por id, aviso si falla una escritura |
| Sesión (`UserStore`) | `npm run test:unit`, con Firebase simulado: registro sin `accessToken`, se borra al iniciar sesión, cuenta sin documento se repara, timers borrados se ignoran, una sola carga por login |
| Mensajes de login y registro | `npm run test:unit` (`authErrors.spec.js`) y `npm run test:e2e` (`cuenta.spec.js`): contraseña de menos de 6 caracteres sin llamar a Firebase |
| Reglas de Firestore | `npm run test:rules` (emulador, necesita Java 21+): cada usuario solo lo suyo, sin sesión nada, otras colecciones negadas |
| Editor como invitado | `npm run test:e2e` (`editor.spec.js`): crear, tiempo común y reinicio, "+" y "−", límites, validaciones con "Update Timer" y la X, confirmación al borrar, borrar el último timer editado |
| Timer en marcha | `npm run test:e2e` (`reloj.spec.js`), con reloj y visibilidad simulados: modo normal, Continuous con jugadores en 0, todos en 0, alarma al volver de segundo plano, Wake Lock al entrar y salir |
| Rutas en producción | `npm run test:e2e` (`rutas.spec.js`): recargar `/timers` y `/user/signup-form`, "Timer not found" en `/timer-app/0` y `/timer-app/abc` |

Las E2E corren como invitado, en Chromium de escritorio y en un Pixel 7 emulado, contra el build de
producción servido bajo `/gameboard-timer/` (`tests/e2e/serve.mjs` imita GitHub Pages, con su
`404.html`). Bloquean Google Analytics y fallan si la app deja errores en la consola.

Sigue siendo manual: el flujo "Con cuenta" de punta a punta (la app no apunta al emulador), lo que solo se ve en un
teléfono real (segundo plano y bloqueo de verdad, Wake Lock real, que la alarma se oiga) y lo
visual (distribución de jugadores, header).

## Manual

### Invitado
- [ ] La app carga sin errores en consola y el loading desaparece.
- [ ] "+" crea un timer con 2 jugadores.
- [ ] Editar: cambiar título, sumar y quitar jugadores, nombre, color, tiempo y Continuous.
- [ ] Borrar un timer pide confirmación; al cancelar sigue en la lista y al aceptar se quita.
- [ ] Con el slider en un tiempo distinto de 25, todos los jugadores arrancan con ese tiempo y
  "reiniciar" vuelve a él.
- [ ] "+" agrega un jugador con el tiempo actual; "−" quita al último y conserva el tiempo.
- [ ] Con 1 jugador "−" está desactivado; con 12, "+" está desactivado.
- [ ] Título o nombre vacío: ni "Update Timer" ni la X cierran el modal, y se ve el mensaje.
- [ ] Editar el último timer de la lista, guardarlo y borrarlo no deja errores en consola.

### Timer en marcha
- [ ] Modo normal: iniciar, pausar y reiniciar cada jugador por separado.
- [ ] Modo normal: al llegar a 0 el botón del jugador vuelve a play.
- [ ] Modo Continuous: iniciar, "siguiente" pasa al jugador siguiente y vuelve al primero.
- [ ] Modo Continuous: "siguiente" se salta a los jugadores en 0; pausa detiene siempre al que corre.
- [ ] Modo Continuous: con todos en 0, ningún reloj corre y el control vuelve a play.
- [ ] Pausar y reiniciar todo en modo Continuous.
- [ ] Al llegar a 0 suena la alerta.
- [ ] Tras 60 s reales con el reloj corriendo, el display marca 60 s menos (±1 s).
- [ ] Móvil: cambiar de app o bloquear la pantalla 60 s y volver muestra 60 s menos (±1 s).
- [ ] Móvil: si el tiempo se acaba con la app en segundo plano, la alarma suena al volver.
- [ ] Móvil (Chrome Android, iOS 16.4+): la pantalla no se apaga con el timer abierto, corra o
  esté en pausa; al salir del timer vuelve a apagarse con normalidad.
- [ ] Recargar `/timer-app/0` como invitado muestra "Timer not found" y el botón lleva a la lista.
- [ ] Botones de inicio y atrás del header oscuro.
- [ ] Distribución correcta con 2, 3, 4 y más jugadores.

### Con cuenta
- [ ] Registro de usuario nuevo.
- [ ] Login y logout.
- [ ] Un timer creado con sesión sigue ahí al recargar.
- [ ] Editar y borrar con sesión se refleja al recargar.
- [ ] Al cambiar el tiempo, Firestore guarda `timeValue` y `currentTime` como número en todos
  los jugadores.
- [ ] Un usuario nuevo queda en `Users/{uid}` sin `accessToken`; uno viejo lo pierde al iniciar sesión.
- [ ] Login con contraseña incorrecta muestra "Wrong email or password.".
- [ ] Registro con un email que ya existe muestra "That email already has an account.".
- [ ] Con el timer abierto en pausa no hay escrituras (pestaña Network o uso de Firestore); al
  salir de la pantalla se guarda el tiempo final.
- [ ] Con las reglas nuevas publicadas: crear, editar, jugar y borrar timers funciona, y no
  aparece "Couldn't save changes".

### Rutas en producción
- [ ] Navegar entre `/`, `/timers`, `/timer-app/0` y `/user/signup-form` bajo `/gameboard-timer/`.
- [ ] Recargar en `/timers` y `/user/signup-form` no da 404.

## Probar en el móvil desde la compu

El Wake Lock solo funciona con HTTPS (o `localhost`). En dev:

```
NODE_TLS_REJECT_UNAUTHORIZED=0 npx nuxi dev --host <IP de la compu> --https
```

Abrir `https://<IP>:3000/gameboard-timer/` en el teléfono, en la misma red, y aceptar el aviso del
certificado autofirmado. `--host 0.0.0.0` no sirve: el servidor no puede pedirse su propio
manifest. La variable `NODE_TLS_REJECT_UNAUTHORIZED=0` es solo para esta sesión de desarrollo.
