# Nuxt 3 Minimal Starter

Look at the [Nuxt 3 documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

This project was created with Vue and Nuxt, please check Nuxt and Vue documentation to use it

This is a simple timer for gameboard gamers, i hope you can enjoy it!

## Trabajo en el proyecto

- `CLAUDE.md`: guía para trabajar con IA en este repo.
- `docs/`: contexto, funcionalidad actual, recursos, reglas y publicación.
- `specs/`: specs de mejoras (`/spec` y `/spec-impl`).
- `tests/`: pruebas unitarias (Vitest) y E2E (Playwright). Ver `docs/07_publicacion/CHECKLIST_PRUEBAS.md`.

## Pruebas

```
npm install
npm run test:unit                          # unitarias
npx playwright install chromium            # solo la primera vez
NITRO_PRESET=github-pages npm run build    # las E2E corren contra el build
npm run test:e2e                           # E2E en escritorio y móvil emulado
```

La CI corre el build, las unitarias y las E2E en cada PR.
