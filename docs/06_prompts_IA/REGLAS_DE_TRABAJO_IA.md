# Reglas de trabajo para cualquier IA

1. Lee primero `CLAUDE.md`, `docs/01_contexto/CONTEXTO_MAESTRO.md` y
   `docs/02_diseno/FUNCIONALIDAD_ACTUAL.md`.
2. Usa los documentos como fuente de verdad. Si hay contradicciones con el código, informa;
   no decidas arbitrariamente.
3. Responde en español y de forma directa.
4. Nunca hagas push a `master`: despliega a producción. Trabaja en una rama y abre un PR.
5. No cambies `baseURL`, el workflow de deploy ni la configuración de Firebase sin aprobación.
6. No cambies el modelo de datos de Firestore sin una spec aprobada.
7. No reemplaces audio, logo, iconos ni favicons.
8. No amplíes el alcance de una mejora sin autorización. Lo que surja va a otra spec.
9. No inventes licencias, orígenes, datos ni decisiones.
10. Cambios pequeños y enfocados; no mezcles refactors con mejoras.
11. Antes de abrir el PR: `npm run build` y `npm run typecheck` sin errores, `npm test` en verde y
    la checklist manual que aplique. Un cambio de comportamiento lleva su prueba.
12. Al terminar informa archivos modificados, pruebas, resultados, riesgos y siguiente paso.
13. Actualiza `docs/` y `README.md` en el mismo PR si quedaron desfasados.

## Ciclo de una mejora

1. **Definir.** Mejora pequeña (un componente, un ajuste visual, un bug acotado): describirla
   en el PR. Mejora grande: `/spec <descripción>` crea `specs/NN-slug.md` en estado Borrador.
2. **Aprobar.** Fernando revisa la spec. Su aprobación en el chat cuenta (los PRs salen a su nombre
   y GitHub no le deja aprobarlos): la IA pasa el estado a Aprobado en la rama.
3. **Implementar.** `/spec-impl NN-slug` crea la rama `spec-NN-slug` e implementa paso a paso.
   Para cambios pequeños, rama propia.
4. **Verificar.** Build, typecheck, `npm test` y `docs/07_publicacion/CHECKLIST_PRUEBAS.md`.
5. **PR.** Hacia `master`, con qué cambia, cómo se probó y riesgos. La CI repite build,
   typecheck, unitarias, reglas, tamaño del JS y E2E; el check **Build y pruebas** debe pasar.
6. **Merge y deploy.** Fernando hace el merge; el workflow publica en GitHub Pages.
7. **Cerrar.** Tras la prueba de Fernando en producción, spec a Implementado (en un PR aparte) y
   `CONTEXTO_MAESTRO.md` actualizado (mejora hecha, decisiones nuevas, pendientes).
