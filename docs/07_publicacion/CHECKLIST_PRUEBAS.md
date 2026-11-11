# Checklist de pruebas

No hay pruebas automáticas. Antes de cada PR se revisa, en navegador, lo que toque el cambio.
Probar en escritorio y en un móvil o emulación de móvil (la app se usa en la mesa de juego).

Leyenda: ✅ comprobado · ⚠️ con observaciones · ⬜ pendiente.

## Automático (lo repite la CI)

| Área | Cómo |
|---|---|
| Build de producción | `NITRO_PRESET=github-pages npm run build` sin errores |

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

### Rutas en producción
- [ ] Navegar entre `/`, `/timers`, `/timer-app/0` y `/user/signup-form` bajo `/gameboard-timer/`.
- [ ] Recargar en `/timers` y `/user/signup-form` no da 404.
