---
description: Verifies the acceptance criteria of a spec — marks checkboxes, fixes code issues, and reports results.
agent: spec-verifier
---


Verify the acceptance criteria of the spec `$ARGUMENTS`.

Aplica el flujo completo del agente spec-verifier:

1. Lee la spec y su sección `## Acceptance criteria`.
2. Consulta con Context7 las recomendaciones actuales de Next.js antes de juzgar
   cualquier criterio relacionado.
3. Contrasta cada criterio con el código (`app/`, `components/`, `app/globals.css`).
4. Ejecuta `npm run lint` y `npm run build`.
5. Si hay criterios visuales: arranca `npm run dev` en background solo si
   `localhost:3000` no responde, verifica con Playwright (capturas desktop y
   móvil <768px) contra `references/screenshots/` y el mockup
   `references/pantallas/`, y detén al final únicamente el servidor que tú
   arrancaste.
6. Corrige lo que haga falta (código o la propia spec, anotándolo en `Decisions`).
7. Marca los checks con evidencia: `[x]` cumplidos, `[ ]` pendientes.

Termina con el resumen: checks ✓/✗/pendientes, correcciones aplicadas y estado
del dev server.
