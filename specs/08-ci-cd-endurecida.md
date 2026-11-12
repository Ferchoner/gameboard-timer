# SPEC 08 — CI/CD endurecida, más rápida y con despliegue de reglas

> **Estado:** Aprobado
> **Depende de:** SPEC 03 (pruebas en la CI), SPEC 04 (`firestore.rules` y `npm run test:rules`) y SPEC 07 (typecheck en la CI)
> **Fecha:** 2026-11-12
> **Objetivo:** Que los workflows tengan permisos mínimos, corran más rápido en paralelo, se mantengan al día solos y publiquen `firestore.rules` automáticamente tras el merge.

## Por qué existe esta spec

Sale de la auditoría técnica del 2026-11-12 (puntos 1, 9, 10 y 11). Fernando aprobó el orden y las cuatro recomendaciones el mismo día.

- `ci.yml` corre todo en un solo job y en serie: build, typecheck, unitarias, reglas y E2E. No usa caché de npm, de Playwright ni del emulador de Firestore.
- Ni `ci.yml` ni `main.yml` declaran `permissions`, así que el `GITHUB_TOKEN` tiene los permisos por defecto del repo.
- No hay `concurrency`: cada push a un PR corre la CI completa aunque haya otra en marcha.
- No hay Dependabot y las acciones están fijadas por etiqueta (`@v7`), no por SHA.
- Las reglas de Firestore se publican a mano pegándolas en la consola, así que el repo y producción pueden diferir sin que nadie lo note.
- Nada impide que el JavaScript vuelva a crecer: hoy el chunk de entrada pesa 387 KB gzip.

Fernando protege `master` aparte, desde Settings (ruleset que exige el check **Build y pruebas**). Esta spec no puede cambiar el nombre de ese check.

## Alcance

**Entra:**

- **`ci.yml` en jobs paralelos.**
  - `rapido`: `npm ci`, typecheck y unitarias.
  - `reglas`: `npm ci`, Java 21 y `npm run test:rules`.
  - `e2e`: `npm ci`, build con `NITRO_PRESET=github-pages`, chequeo de tamaño y E2E.
  - Un job final con nombre **Build y pruebas** que depende de los tres y falla si alguno falló o se canceló. Así el check que exige el ruleset no cambia de nombre.
- **Permisos y concurrencia.**
  - `permissions: contents: read` en `ci.yml` y en el job `build` de `main.yml`.
  - `concurrency` en `ci.yml` por rama del PR, con `cancel-in-progress: true`.
  - `concurrency: group: pages, cancel-in-progress: false` en `main.yml`, como recomienda GitHub para Pages.
- **Caché.**
  - `cache: npm` en todos los `actions/setup-node`.
  - Navegadores de Playwright (`~/.cache/ms-playwright`) con clave por versión de `@playwright/test` del `package-lock.json`. Con la caché presente solo se corre `npx playwright install-deps chromium`.
  - Emulador de Firestore (`~/.cache/firebase/emulators`) con clave por versión de `firebase-tools`.
- **Chequeo de tamaño.** `scripts/check-bundle-size.mjs` y el script `"size"` en `package.json`. Lee el chunk de entrada desde el importmap de `.output/public/index.html`, lo comprime con gzip y falla si pasa de **420 KB**. El límite vive en una constante al inicio del script.
- **Acciones fijadas por SHA** en los tres workflows, con la versión en un comentario (`uses: actions/checkout@<sha> # v7`).
- **Dependabot.** `.github/dependabot.yml` con dos ecosistemas, `npm` y `github-actions`, revisión semanal los lunes y un máximo de 5 PRs abiertos. Las actualizaciones menores y de parche van agrupadas en un solo PR por ecosistema; las mayores, cada una en su PR.
- **Despliegue de reglas.** Workflow nuevo `.github/workflows/rules.yml`:
  - Se dispara en push a `master` solo si cambia `firestore.rules`, y a mano (`workflow_dispatch`).
  - Primero corre `npm run test:rules`. Si falla, no publica.
  - Después se autentica con `google-github-actions/auth` usando el secret `FIREBASE_SERVICE_ACCOUNT` y corre `npx firebase deploy --only firestore:rules --project timer-42311 --non-interactive`.
  - `permissions: contents: read` y `concurrency: group: firestore-rules, cancel-in-progress: false`.
- **Documentación.**
  - `docs/07_publicacion/PUBLICACION_GITHUB_PAGES.md`: cómo se publican ahora las reglas, cómo crear la cuenta de servicio y el secret, y cómo volver atrás.
  - `CLAUDE.md`: el comando `npm run size`, que las reglas ya se publican con la CI, y los tres workflows.
  - `docs/01_contexto/CONTEXTO_MAESTRO.md`: decisiones y estado de la spec.

**Fuera de alcance (para otras specs):**

- Validar en las reglas la forma y el tamaño de los datos (SPEC 09).
- Quitar faker, Analytics y Bootstrap completo, y bajar el límite de tamaño (SPEC 10).
- Que el deploy de la app corra pruebas antes de publicar.
- Workload Identity Federation en vez de clave JSON.
- Lighthouse CI, previews de PR o un entorno de staging.
- Configurar el ruleset de `master`, CodeQL, secret scanning y Dependabot alerts: son ajustes de Settings que hace Fernando.
- Cambiar `app.baseURL`, `NITRO_PRESET` o `plugins/firebase.client.ts`.

## Modelo de datos

Esta spec no introduce estructuras de datos ni cambia el modelo de Firestore.

Lo único nuevo es un secret de GitHub Actions:

- Nombre: `FIREBASE_SERVICE_ACCOUNT`.
- Valor: la clave JSON completa de una cuenta de servicio del proyecto `timer-42311`.
- Roles de esa cuenta: `Firebase Rules Admin` (`roles/firebaserules.admin`) y `Service Usage Consumer` (`roles/serviceusage.serviceUsageConsumer`). `firebase deploy` usa el segundo para comprobar que la API de reglas está activa. Ningún otro rol.

### Cómo crear la cuenta de servicio (Fernando)

1. Google Cloud Console, proyecto `timer-42311` → IAM y administración → Cuentas de servicio → Crear.
2. Nombre `github-rules-deploy`. Roles: `Firebase Rules Admin` y `Service Usage Consumer`.
3. En la cuenta creada → Claves → Agregar clave → JSON. Se descarga un archivo.
4. GitHub → Settings → Secrets and variables → Actions → New repository secret. Nombre `FIREBASE_SERVICE_ACCOUNT`; valor, el contenido del JSON.
5. Borrar el archivo descargado del equipo.

## Plan de implementación

Rama `spec-08-ci-cd`, creada desde `master`. Un commit por paso; cada paso deja la CI en verde.

1. **Permisos, concurrencia y caché de npm** en `ci.yml` y `main.yml`, sin cambiar los pasos. Prueba: la CI del PR pasa y el job sigue llamándose **Build y pruebas**.
2. **Jobs paralelos** en `ci.yml` (`rapido`, `reglas`, `e2e` y el job final **Build y pruebas**), con caché de Playwright y del emulador. Prueba: la CI pasa; el segundo run usa la caché (se ve en el log) y tarda menos que el primero.
3. **Chequeo de tamaño.** `scripts/check-bundle-size.mjs`, script `size` y paso en el job `e2e`. Prueba: `npm run size` en local imprime unos 387 KB y pasa; con el límite bajado a 300 KB, falla.
4. **Acciones por SHA y Dependabot.** Fijar las acciones de los tres workflows y agregar `.github/dependabot.yml`. Prueba: la CI pasa; GitHub muestra Dependabot en Insights → Dependency graph → Dependabot.
5. **Workflow de reglas** `.github/workflows/rules.yml`. Prueba antes del merge: el workflow es válido (aparece en Actions) y no se dispara en el PR. La prueba real es después del merge, con `workflow_dispatch`.
6. **Documentación.** `PUBLICACION_GITHUB_PAGES.md`, `CLAUDE.md` y `CONTEXTO_MAESTRO.md`.

## Criterios de aceptación

- [ ] La CI del PR muestra los jobs `rapido`, `reglas` y `e2e` corriendo en paralelo, y un check **Build y pruebas** que solo pasa si los tres pasan.
- [ ] Si una unitaria falla, el check **Build y pruebas** sale en rojo.
- [ ] Un segundo push al mismo PR cancela la CI anterior que estaba en marcha.
- [ ] El segundo run de la CI restaura de caché npm, Playwright y el emulador.
- [ ] `ci.yml`, `main.yml` y `rules.yml` declaran `permissions` y ninguno pide escritura salvo `pages` e `id-token` en el job `deploy` de `main.yml`.
- [ ] Todas las acciones de los tres workflows están fijadas por SHA con la versión en un comentario.
- [ ] `npm run size` falla si el chunk de entrada pasa de 420 KB gzip, y pasa con el build actual.
- [ ] `.github/dependabot.yml` existe con `npm` y `github-actions`, semanal, agrupando menores y parches.
- [ ] Tras el merge, el deploy de la app termina bien y la app publicada carga.
- [ ] Con el secret creado, correr `rules.yml` a mano termina en verde y la consola de Firebase muestra una versión nueva de las reglas con el mismo contenido que `firestore.rules`.
- [ ] Un push a `master` que no cambia `firestore.rules` no dispara `rules.yml`.
- [ ] `app.baseURL`, `NITRO_PRESET`, `plugins/firebase.client.ts` y el modelo de Firestore no cambian.

## Decisiones

- **Sí:** publicar las reglas desde la CI (Fernando, 2026-11-12).
- **Sí:** clave JSON de una cuenta de servicio con permisos mínimos, guardada como secret `FIREBASE_SERVICE_ACCOUNT`. Es lo más simple de configurar (Fernando, 2026-11-12).
- **No:** Workload Identity Federation. Evita guardar una clave, pero tiene más pasos en la consola; se puede migrar después.
- **Sí:** publicar las reglas solo en push a `master` cuando cambia `firestore.rules`, y siempre después de pasar `npm run test:rules` (Fernando, 2026-11-12).
- **Sí:** workflow aparte (`rules.yml`) y no un job dentro de `main.yml`. Si las reglas fallan, la app se publica igual, y cada cosa se puede volver a correr por separado.
- **No:** correr pruebas en el deploy de la app. Con el ruleset de `master` no entra nada en rojo, y el deploy sigue rápido (Fernando, 2026-11-12).
- **Sí:** límite de 420 KB gzip para el chunk de entrada. La SPEC 10 lo baja cuando quite faker (Fernando, 2026-11-12).
- **Sí:** mantener el nombre del check **Build y pruebas** con un job final que agrega a los demás. Cambiarlo rompería el ruleset.
- **Sí:** Dependabot semanal con menores y parches agrupados, para no llenar el repo de PRs.
- **No:** `npm audit` en la CI. Hoy fallaría por `@grpc/grpc-js`, que no afecta al navegador; Dependabot alerts cubre lo mismo sin bloquear PRs.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Una regla mal escrita llega a producción sola y deja a los usuarios sin acceso. | `rules.yml` corre `npm run test:rules` antes de publicar. Para volver atrás: revertir el PR (vuelve a publicar la versión anterior) o elegir una versión previa en el historial de reglas de la consola. |
| La clave JSON se filtra. | Solo tiene permiso sobre las reglas. Se puede revocar en Google Cloud y crear otra. Nunca se imprime en el log. |
| El job final no detecta un job cancelado u omitido y deja pasar el PR. | El job final usa `if: always()` y falla si algún `needs.*.result` es distinto de `success`. Se prueba forzando un fallo en el paso 2. |
| El nombre del check cambia sin querer y el ruleset bloquea todos los PRs. | El nombre **Build y pruebas** se fija en el job final y se comprueba en el PR del paso 1. |
| La caché de Playwright no coincide con las dependencias del sistema del runner. | Con caché se corre `install-deps`; la clave incluye la versión de Playwright. |
| `firebase deploy` pide un rol más del que se dio. | El error dice qué permiso falta; se agrega solo ese rol y se anota en la documentación. |

## Lo que **no** entra en esta spec

- Validar los datos en las reglas (SPEC 09).
- Bajar el peso de la app y quitar Analytics (SPEC 10).
- Pruebas en el deploy de la app, Workload Identity Federation, Lighthouse CI y previews de PR.
- Los ajustes de Settings de GitHub, que hace Fernando.

Cada uno, si llega, va en su propia spec.
