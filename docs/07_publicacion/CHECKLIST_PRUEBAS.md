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
- [ ] Borrar un timer lo quita de la lista.

### Timer en marcha
- [ ] Modo normal: iniciar, pausar y reiniciar cada jugador por separado.
- [ ] Modo Continuous: iniciar, "siguiente" pasa al jugador siguiente y vuelve al primero.
- [ ] Pausar y reiniciar todo en modo Continuous.
- [ ] Al llegar a 0 suena la alerta.
- [ ] Botones de inicio y atrás del header oscuro.
- [ ] Distribución correcta con 2, 3, 4 y más jugadores.

### Con cuenta
- [ ] Registro de usuario nuevo.
- [ ] Login y logout.
- [ ] Un timer creado con sesión sigue ahí al recargar.
- [ ] Editar y borrar con sesión se refleja al recargar.

### Rutas en producción
- [ ] Navegar entre `/`, `/timers`, `/timer-app/0` y `/user/signup-form` bajo `/gameboard-timer/`.
- [ ] Recargar en `/timers` y `/user/signup-form` no da 404.
