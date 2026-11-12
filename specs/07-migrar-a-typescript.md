# SPEC 07 — Migrar la app a TypeScript

> **Estado:** Aprobado
> **Depende de:** SPEC 05 (Nuxt 4) y SPEC 06 (último cambio a los componentes)
> **Fecha:** 2026-11-11
> **Objetivo:** Pasar los stores, `utils` y componentes de JavaScript a TypeScript, con un typecheck en la CI y sin cambiar lo que hace la app.

## Por qué existe esta spec

Fernando preguntó el 2026-11-11 qué tan viable es pasar el proyecto a TypeScript, y pidió esta spec tras ver el análisis.

- Nuxt 4 ya compila TypeScript y genera su `tsconfig` (`tsconfig.json` extiende `.nuxt/tsconfig.json`). No hace falta otro compilador ni cambiar el build.
- Ya son `.ts`: los composables (`useCountdown`, `useFirestore`, `useFirebaseAuth`, `useWakeLock`), los plugins y `nuxt.config.ts`.
- Siguen en JavaScript: `stores/TimerStore.js`, `stores/UserStore.js`, `stores/MainStore.js`, `utils/authErrors.js` y los 20 `.vue` (ninguno con `lang="ts"`).
- Hoy nada revisa los tipos: no hay script de typecheck y la CI no lo corre.
- Hay 17 `@ts-ignore`, casi todos porque `$firestore` y `$auth` (de `plugins/firebase.client.ts`) no tienen tipo.

Prueba previa (2026-11-11, en una copia aparte del repo y sin commits), con `vue-tsc` y `typescript` instalados y `npx nuxi typecheck`:

- Con el código tal como está, salen **3 errores**: `hid` en el meta de `nuxt.config.ts`, la opción `pinia.autoImports` (ya no existe en `@pinia/nuxt` 1.x) y el import de `bootstrap/dist/js/bootstrap.bundle`, que no trae tipos.
- Renombrando a `.ts` los stores y `utils`, y poniendo `lang="ts"` en todos los `.vue` sin tocar nada más, salen **117 errores**. 46 son de `TimerStore`, 20 de `TimerApp.vue`, 18 de `TimerModal.vue` y 11 de `UserStore`. La mayoría son parámetros sin tipo (55) y `timers: []`, que TypeScript toma como lista vacía de tipo `never`. Ninguno apunta a un bug: son tipos que faltan.

## Alcance

**Entra:**

- **Herramientas.**
  - `typescript` y `vue-tsc` como dependencias de desarrollo, con versión fija como el resto.
  - Script `"typecheck": "nuxi typecheck"` en `package.json`.
  - Paso "Typecheck" en `.github/workflows/ci.yml`, después del build.
- **Errores que ya existen.**
  - Quitar `hid` del meta `description` en `nuxt.config.ts`.
  - Quitar `pinia.autoImports` de `nuxt.config.ts`. Los stores importan `defineStore` desde `pinia` ellos mismos, así que no se usa.
  - Quitar el `// @ts-ignore` de la primera línea de `nuxt.config.ts` si ya no hace falta.
  - Declarar el módulo de Bootstrap en un archivo de tipos, sin agregar `@types/bootstrap`.
- **Tipos de `$firestore` y `$auth`.** Un archivo `types/nuxt-app.d.ts` que le dice a Nuxt que `useNuxtApp()` trae `$firestore: Firestore` y `$auth: Auth`. No se toca `plugins/firebase.client.ts`. Con eso se quitan los `@ts-ignore` de `useFirestore.ts` y `useFirebaseAuth.ts`.
- **Tipos del modelo.** `types/models.ts` con `TimerData`, `PlayerData` y `UserData`, que describen los documentos de `Timers` y `Users` tal como están hoy en `docs/02_diseno/FUNCIONALIDAD_ACTUAL.md` (ver "Modelo de datos").
- **Stores y `utils` a `.ts`.**
  - `TimerStore`, `UserStore`, `MainStore` y `authErrors` pasan a `.ts`, con tipos en el estado, los parámetros y lo que devuelve cada acción.
  - Siguen siendo stores de opciones de Pinia (`state`, `getters`, `actions`).
  - Las clases `Timer` y `Player` siguen en `TimerStore.ts` y hacen lo mismo que hoy.
- **Componentes.**
  - Los 20 `.vue` llevan `lang="ts"` en sus bloques `<script>`. Si un componente tiene dos bloques (uno con `setup` y otro con `export default`), los dos llevan `lang="ts"`, porque Vue lo exige.
  - Se tipan las props, los `ref` y los parámetros de funciones.
  - El bloque de opciones (`data`, `methods`, `watch`) se queda como está; no se reescribe a `<script setup>`.
- **Cero errores.** `npm run typecheck` termina sin errores y no se agrega ningún `@ts-ignore`. Si algo no se puede tipar, se usa `@ts-expect-error` con un comentario que diga por qué.
- **Documentación.** `CLAUDE.md` (quitar "No hay typecheck", agregar `npm run typecheck` a comandos y a "Antes de abrir un PR"), `docs/02_diseno/FUNCIONALIDAD_ACTUAL.md` (nombres de archivo `.js` a `.ts`), `docs/01_contexto/CONTEXTO_MAESTRO.md` (decisiones) y `docs/07_publicacion/CHECKLIST_PRUEBAS.md` si menciona archivos renombrados.

**Fuera de alcance (para otras specs):**

- Cambiar el modelo de Firestore, `app.baseURL`, el deploy (`main.yml`) o `plugins/firebase.client.ts`.
- Validar en tiempo de ejecución lo que llega de Firestore. Los tipos se aplican con una conversión (`as TimerData`), no con validación: validar cambiaría el comportamiento.
- Arreglar bugs o rarezas que se vean al tipar. Se anotan en "Pendientes" de `CONTEXTO_MAESTRO.md`. Por ejemplo, el constructor de `Timer` y `Player` ignora los campos con valor falso (`if (data[key])`), y los `Number(player.timeValue)` se quedan aunque el tipo ya diga `number`.
- Reescribir los bloques de opciones a `<script setup>`, pasar los stores a setup stores o cambiar la forma de los componentes.
- Pasar las pruebas (`tests/`), `vitest.config.mjs`, `playwright.config.mjs` o `scripts/` a TypeScript. Las pruebas en `.js` importan los stores `.ts` sin cambios.
- Activar reglas más estrictas que las que trae el `tsconfig` de Nuxt.
- Agregar un linter.

## Modelo de datos

Esta spec no cambia el modelo de Firestore. Solo lo escribe como tipos, en `types/models.ts`:

```ts
import type { DocumentReference, Timestamp } from 'firebase/firestore'

export interface PlayerData {
  name: string
  color: string        // hex, por ejemplo '#a1b2c3'
  timeValue: number    // minutos
  currentTime: number  // minutos
}

export interface TimerData {
  FSid: string         // `${uid}-${5 caracteres}`; '' para invitado
  progresive: boolean  // modo Continuous
  title: string
  players: PlayerData[]
  createdAt: Date | Timestamp  // Date al crearlo; Timestamp al leerlo de Firestore
  updateAt: Date | Timestamp
}

export interface UserData {
  email: string
  username: string
  firstName: string
  lastName: string
  uid: string
  guest: boolean
  timers: DocumentReference[]
}
```

`Timer` y `Player` implementan `TimerData` y `PlayerData`. El estado de `TimerStore` queda `timers: Timer[]` (también acepta los `TimerData` que llegan de Firestore) e `index: number`.

`types/nuxt-app.d.ts`:

```ts
import type { Auth } from 'firebase/auth'
import type { Firestore } from 'firebase/firestore'

declare module '#app' {
  interface NuxtApp {
    $auth: Auth
    $firestore: Firestore
  }
}

declare module 'bootstrap/dist/js/bootstrap.bundle'

export {}
```

Si al implementar algún campo no coincide con lo que hay en Firestore (por ejemplo, `timeValue` guardado como texto), se ajusta el tipo a lo real y se avisa a Fernando. No se cambia el dato.

## Plan de implementación

Rama `spec-07-migrar-a-typescript`, creada desde `master`. Un commit por paso; cada paso deja el build, las pruebas y el typecheck en verde. Si el PR queda grande, los pasos 1 a 3 pueden ir en un PR y el 4 en otro.

1. **Base.** Instalar `typescript` y `vue-tsc`, agregar el script `typecheck` y el paso en `ci.yml`, arreglar los 3 errores de `nuxt.config.ts` y Bootstrap, y crear `types/nuxt-app.d.ts`. Quitar los `@ts-ignore` de los composables. Prueba: `npm run typecheck` sin errores; `NITRO_PRESET=github-pages npm run build` y `npm test` en verde.
2. **Tipos del modelo y `MainStore`, `authErrors`.** Crear `types/models.ts` y pasar los dos archivos más simples a `.ts`. Prueba: typecheck sin errores; `npm run test:unit` en verde.
3. **`TimerStore` y `UserStore`.** Pasarlos a `.ts` con sus tipos. Prueba: typecheck sin errores; `npm test` en verde; `git diff` de los stores muestra solo tipos y el renombre, sin cambios de lógica.
4. **Componentes.** `lang="ts"` en los 20 `.vue`, empezando por los que dan más errores: `TimerApp.vue` y `TimerModal.vue`, luego `UserRegisterForm.vue`, `Timers.vue`, `LoginFormComponent.vue`, `app.vue` y el resto. Prueba: typecheck sin errores; `npm test` en verde.
5. **Documentación.** Actualizar `CLAUDE.md`, `FUNCIONALIDAD_ACTUAL.md`, `CONTEXTO_MAESTRO.md` y `CHECKLIST_PRUEBAS.md`.

## Criterios de aceptación

- [ ] En `stores/`, `utils/`, `composables/` y `plugins/` no queda ningún `.js`.
- [ ] Los 20 `.vue` usan `lang="ts"` en todos sus bloques `<script>`.
- [ ] `npm run typecheck` termina sin errores, en local y en la CI.
- [ ] La CI del PR corre el typecheck y pasa en verde, junto con el build, las unitarias, las reglas y las E2E.
- [ ] `grep -rn "@ts-ignore"` en `stores/`, `utils/`, `composables/`, `plugins/`, `components/`, `pages/`, `app.vue` y `nuxt.config.ts` no encuentra nada.
- [ ] Las pruebas de `tests/unit/`, `tests/e2e/` y `tests/rules/` no cambian y pasan en verde.
- [ ] `app.baseURL`, `main.yml`, `plugins/firebase.client.ts` y el modelo de Firestore no cambian.
- [ ] La checklist manual de `docs/07_publicacion/CHECKLIST_PRUEBAS.md` pasa para "Invitado" y "Con cuenta", probada con `npm run dev` o `npm run preview`.
- [ ] Tras el merge, el deploy termina bien y la app publicada inicia sesión y muestra los timers guardados.

## Decisiones

- **Sí:** migrar a TypeScript en una spec propia (Fernando, 2026-11-11).
- **Sí:** tipar `$firestore` y `$auth` con un `.d.ts` y no tocar `plugins/firebase.client.ts`. La otra opción, que el plugin devuelva `provide`, es más limpia pero cambia un archivo que necesita aprobación (Fernando, 2026-11-11).
- **Sí:** las pruebas y los archivos de configuración se quedan en JavaScript. Ya funcionan y no aportan tipos nuevos (Fernando, 2026-11-11).
- **Sí:** no reescribir los bloques de opciones a `<script setup>`. Solo se agregan tipos, para que el diff sea de tipos y no de lógica (Fernando, 2026-11-11).
- **Sí:** usar el nivel de estricto del `tsconfig` de Nuxt, sin reglas extra (Fernando, 2026-11-11).
- **No:** validar en tiempo de ejecución lo que llega de Firestore. Cambiaría el comportamiento con datos reales.
- **No:** arreglar rarezas que salgan al tipar. Se anotan como pendientes.

## Riesgos

| Riesgo | Mitigación |
| --- | --- |
| Al tipar se cambia lógica sin querer (por ejemplo, "arreglar" el `if (data[key])` de `Timer`), y eso altera cómo se leen los datos guardados. | La regla es tipar sin cambiar la lógica; se revisa el diff de cada paso y las unitarias y E2E actuales no se tocan. |
| Los tipos no coinciden con datos viejos de Firestore y dan una falsa confianza. | Los tipos describen el modelo documentado; los `Number(...)` defensivos se quedan. Si se ve un dato distinto, se ajusta el tipo, no el dato. |
| El modo con cuenta no se puede probar en el entorno cloud (bloquea Firebase). | Probar con cuenta en la máquina de Fernando con `npm run dev` antes del merge. |
| El typecheck en la CI hace más lento cada PR. | Es un paso más, corto frente a las E2E; se acepta. |
| `vue-tsc` y `typescript` suben de versión mayor y rompen el typecheck. | Versiones fijas en `package.json`, como el resto desde la spec 05. |
