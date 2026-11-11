# Publicación en GitHub Pages

## Cómo funciona

- Workflow: `.github/workflows/main.yml` ("Deploy to GitHub Pages").
- Se dispara con cada **push a `master`** y a mano (`workflow_dispatch`).
- Pasos: Node 18, `npm install`, `npm run build` con `NITRO_PRESET=github-pages`, sube
  `.output/public` y lo publica con `actions/deploy-pages`.
- La app vive en `https://ferchoner.github.io/gameboard-timer/`, por eso
  `nuxt.config.ts` tiene `app.baseURL: '/gameboard-timer/'`.

## Reglas

- Hacer merge a `master` **es publicar**. Solo Fernando hace el merge.
- No cambiar `baseURL`, el preset ni el workflow sin aprobación: rompen las rutas publicadas.

## Probar el build como en producción

```bash
npm install
NITRO_PRESET=github-pages npm run build   # genera .output/public
npm run preview                          # sirve el build localmente
```

## Si un deploy falla

1. Revisar el run en la pestaña Actions del repo.
2. Arreglar en una rama y PR; no hacer commits directos a `master`.
3. Si hace falta volver atrás, revertir el merge con un PR de `git revert`.
