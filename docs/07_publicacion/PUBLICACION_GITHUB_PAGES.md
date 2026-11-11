# Publicación en GitHub Pages

## Cómo funciona

- Workflow: `.github/workflows/main.yml` ("Deploy to GitHub Pages").
- Se dispara con cada **push a `master`** y a mano (`workflow_dispatch`).
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
