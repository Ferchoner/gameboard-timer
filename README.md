# Timer for Friends

Hecha con [Nuxt 4](https://nuxt.com/docs/getting-started/introduction). Requiere Node 24 (`.nvmrc`)
y npm.

This project was created with Vue and Nuxt, please check Nuxt and Vue documentation to use it

This is a simple timer for gameboard gamers, i hope you can enjoy it!

## Trabajo en el proyecto

- `CLAUDE.md`: guía para trabajar con IA en este repo.
- `docs/`: contexto, funcionalidad actual, recursos, reglas y publicación.
- `specs/`: specs de mejoras (`/spec` y `/spec-impl`).
- `tests/`: pruebas unitarias (Vitest) y E2E (Playwright). Ver `docs/07_publicacion/CHECKLIST_PRUEBAS.md`.

## Pruebas

```
npm ci
npm run test:unit                          # unitarias
npx playwright install chromium            # solo la primera vez
NITRO_PRESET=github-pages npm run build    # las E2E corren contra el build
npm run test:e2e                           # E2E en escritorio y móvil emulado
npm run test:rules                         # reglas de Firestore en el emulador (Java 21+)
npm run typecheck                          # tipos con vue-tsc
npm run size                               # JS de entrada ≤ 229 KB gzip (tras el build)
```

La CI corre el build, el typecheck, las unitarias, las reglas, el tamaño del JS (`npm run size`)
y las E2E en cada PR. Las reglas de Firestore (`firestore.rules`) se publican solas con
`.github/workflows/rules.yml` cuando cambian en `master`.
