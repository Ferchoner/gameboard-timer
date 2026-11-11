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
11. Ejecuta `npm run build` y la checklist manual que aplique antes de abrir el PR.
12. Al terminar informa archivos modificados, pruebas, resultados, riesgos y siguiente paso.
13. Actualiza `docs/` y `README.md` en el mismo PR si quedaron desfasados.

## Ciclo de una mejora

1. **Definir.** Mejora pequeña (un componente, un ajuste visual, un bug acotado): describirla
   en el PR. Mejora grande: `/spec <descripción>` crea `specs/NN-slug.md` en estado Borrador.
2. **Aprobar.** Fernando revisa la spec y cambia el estado a Aprobado.
3. **Implementar.** `/spec-impl NN-slug` crea la rama `spec-NN-slug` e implementa paso a paso.
   Para cambios pequeños, rama propia.
4. **Verificar.** `npm run build` y `docs/07_publicacion/CHECKLIST_PRUEBAS.md`.
5. **PR.** Hacia `master`, con qué cambia, cómo se probó y riesgos. La CI repite el build.
6. **Merge y deploy.** Fernando hace el merge; el workflow publica en GitHub Pages.
7. **Cerrar.** Spec a Implementado, `CONTEXTO_MAESTRO.md` actualizado (mejora hecha, decisiones
   nuevas, pendientes).
