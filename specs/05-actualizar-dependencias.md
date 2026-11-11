# SPEC 05 — Actualizar Node y dependencias

> **Estado:** Borrador
> **Depende de:** SPEC 01. Se implementa después de las specs 02, 03 y 04 (aún sin escribir), en ese orden.
> **Fecha:** 2026-11-11
> **Objetivo:** Pasar la app a Node 24 y a las versiones actuales de sus dependencias, con un solo gestor de paquetes y un lockfile que permita `npm ci`.

## Por qué existe esta spec

- El deploy y la CI usan Node 18, que ya no tiene soporte.
- Las dependencias son de mediados de 2023 (Nuxt 3.6, Firebase 10, Pinia 2, faker 8).
- `package-lock.json` no está sincronizado con `package.json` (falta `@faker-js/faker`), así que `npm ci` falla. Además hay un `yarn.lock` que nadie usa, porque los workflows usan npm.
- `@nuxt/devtools` está fijado en `latest`, y cada instalación puede traer una versión distinta.
- `@sidebase/nuxt-session` y `@nuxtjs/robots` están instalados, pero no se importan en ningún archivo ni aparecen en `modules` de `nuxt.config.ts`.

Prueba previa (2026-11-11, en una copia aparte del repo y sin commits): con Nuxt 4.6, Pinia 4, `@pinia/nuxt` 1.0, Firebase 12, faker 10, Bootstrap 5.3.8 y sass 1.108, `NITRO_PRESET=github-pages npm run build` pasa en Node 22. Solo hubo que cambiar a `import type` los tipos que se importan en `composables/useFirebaseAuth.ts` y `composables/useFirestore.ts`. La lista de timers cargó como invitado sin errores de JavaScript. El modo con cuenta no se pudo probar porque ese entorno bloquea Firebase.

## Alcance

**Entra:**

- Node 24 LTS en `.github/workflows/ci.yml` y en `.github/workflows/main.yml`. Fernando aprobó el cambio del workflow de deploy el 2026-11-11.
- Campo `engines.node` en `package.json` y archivo `.nvmrc`, ambos con Node 24.
- Actualizar a la última versión estable de cada paquete: `nuxt` 4.x, `pinia` 4.x, `@pinia/nuxt` 1.x, `firebase` 13.x, `bootstrap` 5.3.x, `sass`, `@faker-js/faker` y `@nuxt/devtools` (con versión fija, no `latest`).
- Quitar `@sidebase/nuxt-session` y `@nuxtjs/robots`, que no se usan.
- Quitar `@types/node` si el build y `nuxt prepare` pasan sin él. Si no pasan, actualizarlo a la serie 24.
- Usar solo npm: borrar `yarn.lock`, regenerar `package-lock.json` y pasar CI y deploy de `npm install` a `npm ci`.
- Los arreglos de código que exija la actualización y nada más. Se sabe de uno: `import type` en los dos composables.
- Actualizar las acciones de `main.yml` que estén obsoletas, si al cambiar Node fallan o avisan que dejarán de funcionar (`actions/checkout@v3`, `setup-node@v3`, `upload-pages-artifact@v1` y `deploy-pages@v1`).
- Actualizar `CLAUDE.md`, `docs/01_contexto/CONTEXTO_MAESTRO.md`, `docs/07_publicacion/PUBLICACION_GITHUB_PAGES.md` y `README.md` donde mencionen Node 18, `npm install` o el lockfile roto.

**Fuera de alcance (para otras specs):**

- Mover el código a la carpeta `app/` de Nuxt 4. Nuxt 4 acepta la estructura actual.
- Cambiar `app.baseURL`, la configuración de `plugins/firebase.client.ts` o el modelo de Firestore.
- Corregir los avisos de deprecación de Sass que vienen de Bootstrap (`@import`), salvo que rompan el build.
- Refactors, cambios de diseño o arreglos de bugs que no causa la actualización.
- Migrar a Bootstrap 6 si sale antes de implementar esta spec.

## Modelo de datos

Esta spec no introduce estructuras nuevas ni cambia el modelo de Firestore (`Users` y `Timers`). Lo único que cambia es `package.json`:

```json
{
  "engines": { "node": ">=24.12.0" },
  "dependencies": {
    "@faker-js/faker": "^10",
    "@pinia/nuxt": "^1",
    "bootstrap": "^5.3",
    "firebase": "^13",
    "pinia": "^4",
    "sass": "^1"
  },
  "devDependencies": {
    "@nuxt/devtools": "^4",
    "nuxt": "^4"
  }
}
```

Las versiones exactas son las últimas estables el día de la implementación. Al implementar, se revisa con `npm view <paquete> version` que no haya salido otra serie mayor. Si salió, no se adopta sin preguntar a Fernando.

## Plan de implementación

Rama `spec-05-actualizar-dependencias`, creada desde `master` cuando ya estén fusionadas las specs 02 a 04. Cada paso deja el build funcionando.

1. **Node 24.** Instalar o seleccionar Node 24 en local, añadir `.nvmrc` y `engines.node`, y cambiar `node-version` a `"24"` en `ci.yml` y `main.yml`. Prueba: `npm install` y `NITRO_PRESET=github-pages npm run build` pasan con las dependencias actuales. Si fallan con Nuxt 3.6, se hace este paso junto con el 3.
2. **Un solo gestor.** Borrar `yarn.lock` y `package-lock.json`, quitar `@sidebase/nuxt-session` y `@nuxtjs/robots`, fijar la versión de `@nuxt/devtools` y regenerar el lockfile con `npm install`. Prueba: con `node_modules` borrado, `npm ci` termina sin errores.
3. **Nuxt 4, Pinia 4 y faker 10.** Actualizar `nuxt`, `@nuxt/devtools`, `pinia`, `@pinia/nuxt` y `@faker-js/faker`. Revisar que `pinia.autoImports` de `nuxt.config.ts` siga siendo válido en `@pinia/nuxt` 1.x y que `faker.string.alphanumeric`, `faker.person.firstName`, `faker.person.fullName` y `faker.color.rgb` existan. Prueba: build sin errores; `npm run dev`, crear un timer como invitado, jugarlo y borrarlo.
4. **Firebase 13.** Actualizar `firebase` y cambiar a `import type` los tipos de `useFirebaseAuth.ts` y `useFirestore.ts`. Prueba: build sin errores; con cuenta, iniciar sesión, crear, editar y borrar un timer, recargar y comprobar que los datos siguen en Firestore.
5. **Bootstrap, sass y `@types/node`.** Actualizar `bootstrap` y `sass`; quitar `@types/node` si no hace falta. Prueba: build sin errores; el modal de timers abre y cierra y los estilos se ven igual que en producción.
6. **CI y deploy con `npm ci`.** Cambiar `npm install` por `npm ci` en `ci.yml` y `main.yml`, quitar el comentario sobre el lockfile roto y actualizar las acciones obsoletas de `main.yml`. Prueba: la CI del PR pasa en verde.
7. **Documentación.** Actualizar `CLAUDE.md`, `CONTEXTO_MAESTRO.md` (quitar el pendiente de Node y del lockfile y registrar las decisiones), `PUBLICACION_GITHUB_PAGES.md` y `README.md`.

## Criterios de aceptación

- [ ] `ci.yml` y `main.yml` usan Node 24 y `npm ci`.
- [ ] En el repo solo queda `package-lock.json`; `yarn.lock` no existe.
- [ ] Con `node_modules` borrado, `npm ci` termina sin errores.
- [ ] `package.json` no tiene `latest`, `@sidebase/nuxt-session` ni `@nuxtjs/robots`.
- [ ] `npm ls nuxt pinia firebase` muestra Nuxt 4.x, Pinia 4.x y Firebase 13.x.
- [ ] `NITRO_PRESET=github-pages npm run build` termina sin errores y genera `.output/public`.
- [ ] La CI del PR pasa en verde.
- [ ] `app.baseURL`, `plugins/firebase.client.ts` y el modelo de Firestore no cambian.
- [ ] La checklist manual de `docs/07_publicacion/CHECKLIST_PRUEBAS.md` pasa para "Invitado" y "Con cuenta", probada con `npm run dev` o `npm run preview`.
- [ ] Tras el merge, el deploy de GitHub Pages termina bien y la app publicada carga, inicia sesión y muestra los timers guardados.

## Decisiones

- **Sí:** Nuxt 4 y no la última 3.x. Es la versión actual y la prueba previa ya compila (Fernando, 2026-11-11).
- **Sí:** Node 24 LTS. Nuxt 4 pide Node 22.22 o más y Firebase 13 pide 24.12 o más (Fernando, 2026-11-11).
- **Sí:** Firebase 13. La configuración de `plugins/firebase.client.ts` no cambia (Fernando, 2026-11-11).
- **Sí:** solo npm, con `npm ci` en CI y deploy. Los workflows ya usan npm (Fernando, 2026-11-11).
- **Sí:** quitar `@sidebase/nuxt-session` y `@nuxtjs/robots`, que no se usan (Fernando, 2026-11-11).
- **No:** migrar la estructura a `app/`. Nuxt 4 acepta la actual, y moverla sería otra spec (Fernando, 2026-11-11).
- **Sí:** aplicar esta spec en orden, después de las 02, 03 y 04 (Fernando, 2026-11-11).

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Algo cambió entre Nuxt 3.6 y 4 (hidratación, `useState`, transiciones de página, auto-imports) y el build no lo detecta. | Checklist manual completa en invitado y con cuenta antes del PR; la spec 03 deja pruebas automáticas que ayudan aquí. |
| Firebase 13 cambia algo en Auth o Firestore que solo se ve con cuenta. El entorno cloud bloquea Firebase. | Probar el modo con cuenta en la máquina de Fernando o en un preview antes del merge. |
| La spec 03 añade dependencias (Vitest, Playwright) que también habrá que actualizar. | Este plan cubre todas las dependencias que haya en `package.json` cuando se implemente, no solo las de hoy. |
| Un deploy fallido deja la versión anterior publicada; uno que funciona pero rompe la app la deja rota. | Probar `npm run preview` con el build de `github-pages` antes del merge; si hay problemas, revertir el merge en `master`. |
| Bootstrap 5.3 con sass nuevo llena el build de avisos de deprecación. | Se aceptan; no rompen el build. Corregirlos va en otra spec. |
