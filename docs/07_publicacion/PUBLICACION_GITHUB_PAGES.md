# Publicación en GitHub Pages

## Cómo funciona

- Workflow: `.github/workflows/main.yml` ("Deploy to GitHub Pages").
- Se dispara con cada **push a `master`** y a mano (`workflow_dispatch`).
- Un deploy a la vez (`concurrency: pages`) y el job de build solo con permiso de lectura (SPEC 08).
- Pasos: Node 24, `npm ci`, `npm run build` con `NITRO_PRESET=github-pages`, sube
  `.output/public` con `actions/upload-pages-artifact` y lo publica con `actions/deploy-pages`.
- Las acciones de GitHub deben estar en versiones vigentes: entre la spec 01 y la 05 el deploy
  falló siempre porque `upload-pages-artifact@v1` usaba `upload-artifact@v3`, que GitHub retiró.
- La app vive en `https://ferchoner.github.io/gameboard-timer/`, por eso
  `nuxt.config.ts` tiene `app.baseURL: '/gameboard-timer/'`.

## Reglas

- Hacer merge a `master` **es publicar**. Solo Fernando hace el merge.
- No cambiar `baseURL`, el preset ni el workflow sin aprobación: rompen las rutas publicadas.

## Probar el build como en producción

```bash
npm ci
NITRO_PRESET=github-pages npm run build   # genera .output/public
npm run preview                          # sirve el build localmente
```

## Si un deploy falla

1. Revisar el run en la pestaña Actions del repo.
2. Arreglar en una rama y PR; no hacer commits directos a `master`.
3. Si hace falta volver atrás, revertir el merge con un PR de `git revert`.

## Reglas de Firestore

Las reglas viven en `firestore.rules` (SPEC 04). Cada usuario con sesión solo puede leer y escribir
su `Users/{uid}` y los `Timers` cuyo id empieza con `{uid}-`; todo lo demás queda negado.

Desde la SPEC 08 se publican solas con `.github/workflows/rules.yml` ("Deploy Firestore rules"):

- Se dispara con un push a `master` que cambia `firestore.rules`, y a mano (`workflow_dispatch`).
- Primero corre `npm run test:rules` con el emulador. Si falla, no publica nada.
- Después se autentica con la cuenta de servicio del secret `FIREBASE_SERVICE_ACCOUNT` y corre
  `firebase deploy --only firestore:rules --project timer-42311`.
- El deploy de la app (`main.yml`) es independiente: si las reglas fallan, la app se publica igual.

Después de un cambio de reglas: revisar que el run de "Deploy Firestore rules" terminó en verde y
repasar "Con cuenta" de `CHECKLIST_PRUEBAS.md` en producción.

### Cuenta de servicio y secret (una sola vez)

1. Google Cloud Console, proyecto `timer-42311` → IAM y administración → Cuentas de servicio →
   Crear. Nombre `github-rules-deploy`.
2. Roles: `Firebase Rules Admin` y `Service Usage Consumer`. Ningún otro.
3. En la cuenta → Claves → Agregar clave → JSON. Se descarga un archivo.
4. GitHub → Settings → Secrets and variables → Actions → New repository secret. Nombre
   `FIREBASE_SERVICE_ACCOUNT`; valor, el contenido completo del JSON.
5. Borrar el archivo descargado del equipo.
6. Probar: Actions → "Deploy Firestore rules" → Run workflow. En la
   [consola de Firebase](https://console.firebase.google.com/project/timer-42311/firestore/rules)
   aparece una versión nueva con el mismo contenido que `firestore.rules`.

Si `firebase deploy` falla por permisos, el log dice qué permiso falta: se agrega solo ese rol y se
anota aquí. Si la clave se filtra, se revoca en la misma pantalla de Claves y se crea otra.

### Volver atrás

- Revertir el PR con `git revert`: el merge del revert vuelve a publicar las reglas anteriores.
- O, en la consola de Firebase → Firestore Database → Rules, elegir una versión anterior del
  historial y publicarla. Después, dejar el repo igual que lo publicado.

### Publicar a mano (si la CI no puede)

1. Correr `npm run test:rules`.
2. En la consola de Firebase → Firestore Database → Rules, pegar el contenido de `firestore.rules`.
3. Con el simulador de reglas, comprobar que un usuario lee su propio `Users/{uid}`.
4. Pulsar Publish.

Las reglas publicadas antes de la SPEC 04 eran `allow read, write: if request.auth != null;` para
todo (cualquier usuario con sesión podía leer y borrar datos ajenos).
