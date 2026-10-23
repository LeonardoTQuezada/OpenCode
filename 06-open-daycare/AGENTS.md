<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## MCPs

- Playwright, screenshot y cualquier cosa relacionada con Playwright tiene que estar en la carpeta .playwright-mcp
- Context7 Utilizaremos este MCP para traer la documentación actualizada del framework.
- Supabase MCP configurado a nivel de usuario (`~/.config/opencode/opencode.json`) apuntando al proyecto `dvwhstwigfgppudkairu` (proyecto remoto en Supabase). Sirve para consultar docs, ejecutar SQL, gestionar migraciones, edge functions, branching, etc. Preferir sus tools (`search_docs`, `execute_sql`, `apply_migration`, `get_advisors`, `list_migrations`, ...) para cualquier tarea de base de datos.

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
- **Regla de carpetas de specs:** toda spec que tenga que ver con base de datos (tablas, enums, migraciones, RLS, seeds, triggers, esquema) se guarda en `specs/database/`; las demás van en `specs/`. Ej.: `specs/database/08-users-table.md`.
- La numeración es compartida entre `specs/` y `specs/database/`: al crear una spec nueva, tomar el mayor número de ambas carpetas y sumar 1.
- Para implementar/verificar una spec de BD hay que pasar la ruta completa: `/spec-impl database/08-users-table` y `/verify-spec specs/database/08-users-table.md`.

## Supabase

- Skills instaladas desde `supabase/agent-skills` (registradas en `skills-lock.json`):
  - `supabase` (.agents/skills/supabase/): guía general de Supabase — auth, RLS, Edge Functions, Realtime, Storage, CLI, MCP, debugging. Cargar antes de cualquier tarea que toque Supabase.
  - `supabase-postgres-best-practices` (.agents/skills/supabase-postgres-best-practices/): mejores prácticas de Postgres — schema, índices, RLS, migraciones, rendimiento. Cargar antes de escribir o modificar cualquier SQL/esquema.
- El esquema de referencia completo está en `../07-DB-Schema` (solo referencia, parte ya implementada en la BD).
- `.env` contiene `SUPBASE_DB_PASSWORD` (ojo: está escrito sin la "A": SUPBASE) para conectarse a la BD; no commitear secrets.
- **Regla de oro: TODA manipulación de la base de datos pasa por migraciones.** Cualquier cambio de esquema (crear/modificar tablas, columnas, índices, RLS, seeds, etc.) se escribe primero como archivo de migración en `supabase/migrations/NNN_descripcion.sql` y se aplica desde ahí. Nunca ejecutar DDL suelto contra la BD sin dejar su migración correspondiente.
- Flujo de cambios de esquema:
  1. Escribir el SQL de la migración en `supabase/migrations/NNN_descripcion.sql`.
  2. Aplicar la migración con `apply_migration` (MCP) una sola vez al final.
  3. Verificar con `execute_sql` (MCP) que los cambios quedaron aplicados.
- Para experimentar/iterar usar `execute_sql` sin DDL destructivo; NO usar `apply_migration` para iterar (cada llamada escribe historial). Cuando el experimento funcione, volcar el SQL final en el archivo de migración y aplicarlo con `apply_migration`.

### Clientes de la app (`@supabase/ssr`) — ya configurado

- **Para interactuar con la base de datos desde la aplicación usamos los paquetes oficiales de Supabase para Next.js: `@supabase/supabase-js` + `@supabase/ssr`** (instalados en `package.json`). No usar fetch/axios contra la API REST ni crear clientes a mano: siempre estos helpers.
- Helpers en `utils/supabase/`:
  - `server.ts` → `createClient(cookieStore)` para Server Components, Server Actions y Route Handlers.
  - `client.ts` → `createClient()` para Client Components (browser).
  - `proxy.ts` → `createClient(request)` devuelve `{ supabase, supabaseResponse }`; solo lo usa el proxy raíz.
- `proxy.ts` en la raíz refresca la sesión con `await supabase.auth.getClaims()` y devuelve `supabaseResponse` intacto. **Next.js 16 renombró la convención `middleware.ts` → `proxy.ts`** (la vieja está deprecada); ver `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`.
- Env vars en `.env.local` (gitignored): `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Se leen dentro de los helpers; nunca commitear secrets ni hardcodearlas.
- Uso típico en un Server Component:

```tsx
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

const cookieStore = await cookies();
const supabase = createClient(cookieStore);
const { data, error } = await supabase.from("users").select();
```

- Estos clientes respetan las políticas RLS activas de la BD. Para DDL/migraciones/inspección de esquema sigue usando el MCP de Supabase (`apply_migration`, `execute_sql`); los clientes de la app son solo para lectura/escritura de datos desde Next.js.

## Verificación de specs

- Agente `spec-verifier` (`.opencode/agents/spec-verifier.md`): revisa una spec, contrasta cada criterio de `## Acceptance criteria` con el código y con capturas Playwright, corrige lo que haga falta y marca los checkboxes. Usa Context7 para buenas prácticas de Next.js y deja las capturas en `.playwright-mcp/`.
- Comando `/verify-spec <spec>` (`.opencode/commands/verify-spec.md`): invoca ese agente. Ej.: `/verify-spec specs/01-feed-home.md` o `/verify-spec 01`.
- Flujo: `/spec` → `/spec-impl` → implementar → `/verify-spec` → commit solo si los checks quedan en verde.

## React best practices

- Agente `react-best-practices` (`.opencode/agents/react-best-practices.md`): aplica las mejores prácticas de React 19 + Next.js 16 (Server Components) a los archivos indicados — hooks, You Might Not Need an Effect, memoización disciplinada, boundary Server/Client, composición, TypeScript, listas/keys. Corrige las violaciones con diffs mínimos y valida cada recomendación contra la documentación oficial vía Context7 (`/reactjs/react.dev`, `/vercel/next.js`); nunca juzga solo con datos de entrenamiento. Verifica con `npm run lint` y `npx tsc --noEmit`.
- Comando `/react-check <files>` (`.opencode/commands/react-check.md`): invoca ese agente. Ej.: `/react-check components/feed-screen.tsx` o `/react-check components/`.

## Accessibility

- Agente `accessibility-check` (`.opencode/agents/accessibility-check.md`): revisa y corrige accesibilidad **WCAG 2.2 AA** en los targets indicados. Checklist estático mapeado a Success Criteria exactos (1.1.1, 1.3.1, 1.4.3, 1.4.11, 2.1.1, 2.4.3, 2.4.7, 2.5.8, 3.3.2, 3.3.3, 3.3.7, 3.3.8, 4.1.2, 4.1.3, patrones WAI-ARIA) + verificación runtime con Playwright (accessibility snapshot, orden de foco con Tab, **axe-core inyectado desde CDN** — nunca se instala en `package.json`) y validación de cada recomendación vía Context7 (fuentes W3C/WAI + `/reactjs/react.dev`); nunca juzga solo con datos de entrenamiento. Deja las capturas en `.playwright-mcp/`.
- Comando `/a11y <files|urls>` (`.opencode/commands/a11y.md`): invoca ese agente. Ej.: `/a11y components/feed-screen.tsx`, `/a11y components/` o `/a11y https://example.com/login`.
- **Modos por tipo de target:** archivos/carpetas locales y URLs de este proyecto → modo fix (corrige con diffs mínimos y verifica con `npm run lint` + `npx tsc --noEmit`); URLs externas → solo reporte con hallazgos por SC + recomendación accionable, nunca edita.
- **Evidencias de auditorías externas autocontenidas:** cada auditoría de URL externa guarda todo (capturas, `axe-results.json`, `report.md`) en `.playwright-mcp/a11y/<dominio>/<página>/<timestamp>/`, agrupadas por dominio (varias páginas del mismo sitio quedan como carpetas hermanas) y aisladas por run con su timestamp.
- Flujo: `/a11y` → corregir → commit solo si lint/tsc quedan en verde.

## DB migrator

- Agente `db-migrator` (`.opencode/agents/db-migrator.md`): asegura que existan las migraciones y las aplica. Reconcilia los archivos locales de `supabase/migrations/` contra el historial real de la BD (`supabase_migrations.schema_migrations` vía MCP), hace backfill de migraciones aplicadas sin archivo local, redacta archivos `NNN_*.sql` nuevos cuando se le describe un cambio de esquema (spec de `specs/database/`, reference `../07-DB-Schema` o descripción libre), aplica los pendientes con `apply_migration` y verifica con `execute_sql` + `get_advisors`.
- Invocación: pedirle directamente "usa el agente db-migrator ..." o lanzarlo como subagente. No tiene comando `/migrate`.
- Reglas que aplica: todo cambio de esquema vive en un archivo de migración y pasa por `apply_migration` (nunca DDL suelto por `execute_sql`); match difuso strippeando el prefijo `NNN_` para no reaplicar por falso positivo; nunca editar/borrar migraciones ya aplicadas (arreglar hacia adelante); para en el primer fallo de `apply_migration`.
- Carga las skills `supabase` y `supabase-postgres-best-practices` antes de escribir SQL.

## Reglas de código

- Usar código limpio, nombres, funciones, variables, etc. en inglés.
- Comentarios en español 