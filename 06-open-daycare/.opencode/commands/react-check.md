---
description: Applies React + Next.js RSC best practices to the indicated files using Context7 docs.
agent: react-best-practices
---

Revisa y aplica las mejores prácticas de React 19 + Next.js 16 (Server Components) en los archivos indicados: `$ARGUMENTS`.

Aplica el flujo completo del agente react-best-practices:

1. Lee los archivos indicados (o pídelos si no se pasaron ninguno) y confirma las versiones de `react` / `next` en `package.json`.
2. Consulta con Context7 la documentación oficial actual antes de juzgar cualquier categoría:
   - React → `/reactjs/react.dev` o `/react/react` (versión instalada)
   - Next.js → `/vercel/next.js` (versión 16.x)
   Temas típicos: "you might not need an effect", "memo useCallback useMemo", "server and client components", "use() useActionState".
3. Aplica el checklist por archivo: hooks, You Might Not Need an Effect, memoización disciplinada, React 19, boundary Server/Client, colocation de estado, composición, TypeScript, listas/keys.
4. Corrige las violaciones con diffs mínimos (código en inglés, comentarios en español, convenciones AGENTS.md).
5. Ejecuta `npm run lint` y `npx tsc --noEmit`; corrige lo que hayas introducido.
6. Termina con el reporte por archivo: hallazgos por severidad, fixes aplicados y fuentes de Context7 citadas.
