# open-daycare

Guardería (daycare) construida con **Next.js 16 (App Router) + React 19 + Tailwind v4**, con backend en **Supabase** (Postgres, RLS, Auth) y autenticación de sesiones vía `@supabase/ssr`.

---

## 1. Requisitos

| Herramienta | Versión | Uso |
| --- | --- | --- |
| Node.js | 20+ | runtime |
| npm | incluido con Node | dependencias |
| [Supabase CLI](https://supabase.com/docs/guides/cli) | última | migraciones locales, `login`, `link` (opcional pero recomendado) |
| [opencode](https://opencode.ai) | última | agente con MCPs de Supabase/Context7/Playwright (opcional) |

---

## 2. Instalación

```bash
npm install
```

## 3. Variables de entorno

Copia la plantilla y rellena los valores desde el [dashboard de Supabase](https://supabase.com/dashboard) (Settings → API) y [Resend](https://resend.com/api-keys):

```bash
cp .env.template .env
```

```env
SUPABASE_DB_PASSWORD=XXXXXXX
# https://supabase.com/dashboard
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=xxxx

# https://resend.com/api-keys
RESEND_API_KEY=XXXXXXX

# URL base de la app (link de activación de invitaciones)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> `.env` está en `.gitignore`: nunca se commitea. Cada desarrollador tiene su propio archivo.

## 4. Levantar el proyecto

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). La página se recarga solo al editar `app/page.tsx`.

### Otros comandos

```bash
npm run build   # build de producción
npm run start   # sirve el build de producción
npm run lint    # ESLint (es `eslint` a secas; ya no existe `next lint`)
```

No hay runner de tests configurado (no existe script `test`).

---

## 5. Base de datos (Supabase)

- **Regla de oro: todo cambio de esquema pasa por migraciones.** El SQL vive en `supabase/migrations/NNN_descripcion.sql` y se aplica desde ahí; nunca se ejecuta DDL suelto.
- El esquema de referencia completo está en `../07-DB-Schema` (solo referencia, no implementada).
- Los clientes de la app (`utils/supabase/server.ts`, `client.ts`, `proxy.ts`) usan `@supabase/ssr` + `@supabase/supabase-js` y respetan las políticas RLS.
- `proxy.ts` en la raíz (Next.js 16 renombró `middleware.ts` → `proxy.ts`) refresca la sesión con `supabase.auth.getClaims()`.

### Aplicar migraciones

Usando el MCP de Supabase desde el agente (flujo estándar del proyecto):

1. Escribir el SQL en `supabase/migrations/NNN_descripcion.sql`.
2. Aplicarla con la tool `apply_migration` del MCP (una sola vez, al final).
3. Verificar con `execute_sql`.

---

## 6. Autenticación con el MCP de Supabase

El MCP de Supabase está configurado a nivel de usuario en `~/.config/opencode/opencode.json` (no en el `opencode.json` del proyecto):

```json
{
  "mcp": {
    "supabase": {
      "type": "remote",
      "url": "https://mcp.supabase.com/mcp?project_ref=dvwhstwigfgppudkairu&features=docs,account,database,debugging,development,functions,branching"
    }
  }
}
```

### ¿Cómo se autentica?

Para validar/ejecutar el flujo de autenticación del MCP con opencode:

```bash
opencode mcp auth supabase
```

Ese comando inicia la autorización OAuth del servidor MCP `supabase` y abre el navegador para que confirmes el acceso. Si el comando termina bien, el MCP queda autenticado.

- El servidor MCP **hosted** usa *dynamic client registration* (OAuth 2.1): **no hace falta crear un personal access token (PAT)**.
- La primera vez que el cliente MCP conecta, **abre el navegador** para que inicies sesión en Supabase y autorices al cliente. Elige la **organización que contiene el proyecto**.
- Después de autorizar, el cliente queda conectado; las tools (`execute_sql`, `apply_migration`, `search_docs`, `get_advisories`, …) operan con los permisos de tu cuenta dentro de esa org.
- Cada miembro del equipo hace **su propio flujo de autorización en su propia máquina**: no se comparte ninguna credencial.

### Autenticación manual / CI

Cuando no hay navegador (CI, entorno sin OAuth dinámico), se usa un PAT en el header:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=${SUPABASE_PROJECT_REF}",
      "headers": { "Authorization": "Bearer ${SUPABASE_ACCESS_TOKEN}" }
    }
  }
}
```

1. Genera el token en [access tokens](https://supabase.com/dashboard/account/tokens). Se recomiendan **tokens con scope** (empiezan por `sbp_fc`): elige org/proyecto y solo los permisos necesarios.
2. Guárdalo como secreto en CI (`SUPABASE_ACCESS_TOKEN`); nunca lo subas al repo.

> El MCP de Supabase es solo para **desarrollo y testing**: no conectarlo contra datos de producción.

---

## 7. Supabase CLI y acceso del equipo

### Instalar

```bash
npm i -g supabase
supabase --version
```

### Login (por usuario)

Cada persona del equipo se autentica con **su propia** cuenta Supabase:

```bash
supabase login
```

Esto abre el navegador (o pide el token a mano) y guarda el PAT en el almacenamiento de credenciales nativo del sistema. Si no hay credenciales nativas, se escribe en `~/.supabase/access-token`.

Con token directamente (recomendado para CI o para usar un token con scope):

```bash
# opción A: flag
supabase login --token sbp_xxx

# opción B: variable de entorno (tiene prioridad sobre el token guardado)
$env:SUPABASE_ACCESS_TOKEN = "sbp_xxx"   # PowerShell
export SUPABASE_ACCESS_TOKEN="sbp_xxx"   # bash
```

Verificar:

```bash
supabase projects list
```

### Vincular el proyecto

```bash
supabase link --project-ref dvwhstwigfgppudkairu
```

Te pedirá la contraseña de la base de datos (está en `.env`, clave `SUPABASE_DB_PASSWORD`).

### Reglas para el equipo

- **Nunca compartir tokens**: cada integrante genera su PAT en [dashboard/account/tokens](https://supabase.com/dashboard/account/tokens).
- Preferir **tokens con scope** (org + proyecto + permisos mínimos) en lugar de los clásicos de acceso total.
- Invitar a cada persona a la organización de Supabase con el rol que corresponda (Owner/Developer/Read-only); el token solo amplía lo que tu cuenta ya puede hacer.
- Para CI usar siempre `SUPABASE_ACCESS_TOKEN` como secreto del pipeline.
- `supabase logout` revoca el token guardado en la máquina.

---

## 8. Estructura del proyecto

```
app/            App Router (rutas, server actions)
components/     componentes React
lib/            lógica de negocio (feed, kids, invitaciones, email)
utils/supabase/ clientes Supabase (server / client / proxy) + tipos generados
supabase/       migraciones SQL
specs/          especificaciones (specs/database/ = specs de BD)
references/     mockups de pantallas (.dc.html y screenshots)
```

## 9. Skills y agentes

- `/spec` — crear una especificación.
- `/spec-impl` — implementar una spec aprobada.
- `/verify-spec <spec>` — verificar contra código y capturas Playwright.
- Specs de base de datos van en `specs/database/`; la numeración es compartida entre `specs/` y `specs/database/`.

## 10. Referencias

- [Documentación de Next.js](https://nextjs.org/docs)
- [Documentación de Supabase](https://supabase.com/docs)
- [Supabase MCP](https://supabase.com/docs/guides/ai-tools/mcp)
- [Supabase CLI](https://supabase.com/docs/reference/cli/introduction)
- [Personal Access Tokens](https://supabase.com/docs/guides/platform/personal-access-tokens)
