<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## MCPs

- Playwright, screenshot y cualquier cosa relacionada con Playwright tiene que estar en la carpeta .playwright-mcp
- Context7 Utilizaremos este MCP para traer la documentación actualizada del framework.

## Proyecto

- "open-daycare" (guardería) sobre Next.js 16 App Router + React 19 + Tailwind v4. Aún es el boilerplate de `create-next-app`: `app/page.tsx` no tiene la app real.
- Tailwind v4 sin `tailwind.config`: la personalización se hace en CSS (`app/globals.css` con `@import "tailwindcss"` y `@theme`).
- `references/pantallas/*.dc.html` y `references/screenshots/*.png` son los mockups de las pantallas de la guardería: usar como referencia de diseño para construir la UI.

## Comandos

- `npm run dev` — servidor de desarrollo en http://localhost:3000
- `npm run build` / `npm run start` — build y producción
- `npm run lint` — ESLint (es `eslint` a secas, ya no existe `next lint`)
- No hay runner de tests configurado (no existe script `test`); no inventar `npm test`.

## Workflow y gotchas

- Para features grandes, usar las skills instaladas `spec` y `spec-impl` (.agents/skills/, registradas en `skills-lock.json`): especificar antes de implementar.
- El repo git es la carpeta raíz `OpenCode/` (agrupa varios subproyectos demo: 01-Demo, 02-Weather, 03-opencode-asteroids, 05-open-pacman, ...). Al hacer commit/`git add`, solo incluir archivos de este proyecto: hay muchos cambios sin commitear en los otros subproyectos.
- `CLAUDE.md` solo hace `@AGENTS.md`; no duplicar aquí contenido que ya vive en este archivo.

## Spec Driven Development - Skills

- /spec Usaremos esta habilidad para crear las especificaciones.
- /spec-impl Usaremos esta skill para hacer las implementaciones.

## Verificación de specs

- Agente `spec-verifier` (`.opencode/agents/spec-verifier.md`): revisa una spec, contrasta cada criterio de `## Acceptance criteria` con el código y con capturas Playwright, corrige lo que haga falta y marca los checkboxes. Usa Context7 para buenas prácticas de Next.js y deja las capturas en `.playwright-mcp/`.
- Comando `/verify-spec <spec>` (`.opencode/commands/verify-spec.md`): invoca ese agente. Ej.: `/verify-spec specs/01-feed-home.md` o `/verify-spec 01`.
- Flujo: `/spec` → `/spec-impl` → implementar → `/verify-spec` → commit solo si los checks quedan en verde.

## Reglas de código

- Usar código limpio, nombres, funciones, variables, etc. en inglés.
- Comentarios en español 