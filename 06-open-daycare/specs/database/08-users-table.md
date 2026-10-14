# SPEC 08 — Users table with enums, RLS, and seed staff user

> **Status:** Aprobado
> **Depends on:** Spec 07 (daycares table)
> **Date:** 2026-10-14
> **Objective:** Crear los enums `user_role` y `user_status`, la tabla `users` con RLS, trigger de `auth.users`, y un usuario staff de prueba.

## Scope

**In:**

- Crear enums `user_role` (`staff`, `parent`, `admin`) y `user_status` (`pending`, `active`).
- Crear tabla `users` con columnas: `id` (uuid PK, FK → `auth.users(id)` ON DELETE CASCADE), `daycare_id` (uuid FK → `daycares`), `role` (user_role), `status` (user_status, default `active`), `full_name` (text), `avatar_url` (text nullable), `notify_on_post` (boolean default true), `daily_summary_enabled` (boolean default true), `created_at` / `updated_at` (timestamptz).
- Habilitar Row Level Security (RLS) en la tabla `users`.
- Crear políticas RLS básicas: lectura para usuarios autenticados de la misma guardería, escritura para staff/admin.
- Crear trigger `AFTER INSERT ON auth.users` que inserte automáticamente una fila en `users` pasando `daycare_id`, `role` y `full_name` desde `raw_user_meta_data`.
- Insertar un usuario staff de prueba: `edwinTinitana@gmail.com` con password `Abc123456@`, vinculado a "Guardería Sala Soles".
- Aplicar como migración Supabase usando `apply_migration`.

**Out of scope (for future specs):**

- Tablas `invitations`, `rooms`, `children`, `posts`, etc.
- Flujo completo de signup/invitaciones para padres.
- UI para gestión de usuarios (CRUD visual).
- Migrar mocks existentes a datos reales.

## Data model

### Enums

```sql
CREATE TYPE user_role AS ENUM ('staff', 'parent', 'admin');
CREATE TYPE user_status AS ENUM ('pending', 'active');
```

### Tabla `users`

```sql
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daycare_id uuid REFERENCES daycares(id),
  role user_role NOT NULL,
  status user_status NOT NULL DEFAULT 'active',
  full_name text NOT NULL,
  avatar_url text,
  notify_on_post boolean NOT NULL DEFAULT true,
  daily_summary_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
```

### RLS Policies

> **Corregido (migraciones 003/004):** la versión original de estas políticas
> (subqueries directas contra `users`) fallaba en runtime con `42P17
> infinite recursion detected in policy for relation "users"` — verificado vía
> PostgREST. Fix oficial de Supabase: envolver los checks en funciones
> `SECURITY DEFINER` en un schema **no expuesto** (`private`), con
> `TO authenticated` y `(select …)` para initPlan.

```sql
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

-- Helper: guardería del usuario actual (lee users sin pasar por RLS)
CREATE OR REPLACE FUNCTION private.current_user_daycare_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.daycare_id FROM public.users u WHERE u.id = (SELECT auth.uid());
$$;

-- Helper: rol del usuario actual (lee users sin pasar por RLS)
CREATE OR REPLACE FUNCTION private.current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.role FROM public.users u WHERE u.id = (SELECT auth.uid());
$$;

-- Lectura: usuarios autenticados pueden ver usuarios de su misma guardería
CREATE POLICY "users_read_own_daycare" ON public.users
  FOR SELECT TO authenticated
  USING (daycare_id = (SELECT private.current_user_daycare_id()));

-- Escritura: solo staff y admin pueden insertar
CREATE POLICY "users_staff_insert" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.current_user_role()) IN ('staff', 'admin'));

-- Actualización: staff y admin pueden actualizar
CREATE POLICY "users_staff_update" ON public.users
  FOR UPDATE TO authenticated
  USING ((SELECT private.current_user_role()) IN ('staff', 'admin'))
  WITH CHECK ((SELECT private.current_user_role()) IN ('staff', 'admin'));

-- Eliminación: solo admin puede eliminar
CREATE POLICY "users_admin_delete" ON public.users
  FOR DELETE TO authenticated
  USING ((SELECT private.current_user_role()) = 'admin');
```

### Trigger para `auth.users`

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, daycare_id, role, full_name, status)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'daycare_id')::uuid,
    (NEW.raw_user_meta_data->>'role')::user_role,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'status')::user_status, 'active')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

### Seed data

```sql
-- Crear usuario staff en auth.users y su fila en users
-- Nota: auth.users se maneja vía Supabase Auth API, no insert directo.
-- Para seed, usamos la función de Supabase auth para crear el usuario.
-- En migración, insertamos directamente en auth.users con el hook de Supabase.

-- El trigger handle_new_user se encargará de crear la fila en users
-- cuando se cree el usuario en auth.users.
```

> **Nota:** La creación del usuario `edwinTinitana@gmail.com` con password se hará vía la API de Supabase Auth (no SQL directo), ya que `auth.users` es gestionado por Supabase. El trigger `handle_new_user` creará automáticamente la fila en `users` con los metadatos proporcionados.

## Implementation plan

1. Crear migración Supabase con:
   - Enums `user_role` y `user_status`.
   - Tabla `users` con FKs y defaults.
   - Habilitar RLS.
   - Políticas RLS de lectura/escritura.
   - Trigger `handle_new_user` para `auth.users`.
2. Aplicar la migración con `apply_migration`.
3. Crear usuario staff `edwinTinitana@gmail.com` con password `Abc123456@` vía Supabase Auth API (o `supabase auth signup`), pasando `raw_user_meta_data` con `daycare_id` (el de "Guardería Sala Soles"), `role: 'staff'`, `full_name: 'Edwin Tinitana'`.
4. Verificar con `list_tables` que la tabla existe y `execute_sql` para confirmar el usuario staff creado.

## Acceptance criteria

- [x] Los enums `user_role` y `user_status` existen en la base de datos con los valores correctos.
  - ✓ `pg_enum`: `user_role` = staff/parent/admin; `user_status` = pending/active.
- [x] La tabla `users` existe con todas las columnas especificadas.
  - ✓ `list_tables`: `public.users` con las 10 columnas (`information_schema.columns`).
- [x] RLS está habilitado en la tabla `users`.
  - ✓ `pg_class.relrowsecurity = true`.
- [x] Las políticas RLS permiten SELECT para usuarios de la misma guardería.
  - ✓ Fallaba en runtime con `42P17 infinite recursion` (políticas originales); corregido en migraciones 003/004. Test vía PostgREST con login del staff: `GET /rest/v1/users` → 1 fila de "Guardería Sala Soles"; anon → 0 filas.
- [x] Las políticas RLS permiten INSERT/UPDATE para staff y admin.
  - ✓ Test vía PostgREST como staff: `PATCH` de su fila → 200 OK; `POST` → política permitió el insert y solo chocó con la FK `23503` (fila inexistente en `auth.users`), es decir `WITH CHECK` aprobó al staff.
- [x] El trigger `handle_new_user` funciona: al crear un usuario en `auth.users`, se crea automáticamente la fila en `users`.
  - ✓ El usuario seed se creó solo con `POST /auth/v1/signup` (sin ningún insert manual en `users`) y la fila apareció automáticamente con `daycare_id`, `role` y `full_name` desde `raw_user_meta_data`.
- [x] Existe un usuario staff `edwinTinitana@gmail.com` vinculado a "Guardería Sala Soles".
  - ✓ Join `users ⋈ auth.users ⋈ daycares`: `ef5f78b3-…`, role=`staff`, status=`active`, daycare="Guardería Sala Soles". Email confirmado en dev para poder iniciar sesión.
- [x] La migración se aplicó sin errores vía `apply_migration`.
  - ✓ `002_create_users_table` + correcciones `003_fix_users_rls_recursion` y `004_move_rls_helpers_to_private` → `success: true` en las 3.

## Decisions

- **Yes:** Crear solo los enums `user_role` y `user_status` en esta migración. Los demás enums se crearán cuando se necesiten para sus tablas.
- **Yes:** Trigger `AFTER INSERT ON auth.users` para crear automáticamente la fila en `users`. Sigue la convención del schema.
- **Yes:** Usuario staff seed con credenciales `edwinTinitana@gmail.com` / `Abc123456@`. Para pruebas de desarrollo.
- **No:** Incluir flujo de invitaciones para padres. Se hará en spec separada.
- **No:** Crear usuario parent de prueba. Solo staff por ahora.
- **Yes (corrección en verificación):** Reescribir las políticas RLS con funciones helper `SECURITY DEFINER` en el schema no expuesto `private` (`current_user_daycare_id`, `current_user_role`), más `TO authenticated`, `(select …)` para initPlan y `WITH CHECK` explícito en UPDATE. Las políticas originales de esta spec provocaban `42P17 infinite recursion` al consultar la misma tabla (constatado con tests vía PostgREST). Migraciones `003_fix_users_rls_recursion` y `004_move_rls_helpers_to_private`. Referencia: docs Supabase "RLS policy causes infinite recursion" + checklist de la skill (SECURITY DEFINER fuera de schemas expuestos).
- **Yes (corrección en verificación):** Confirmar el email del usuario seed (`auth.users.email_confirmed_at`) para que pueda iniciar sesión y así probar los criterios de RLS vía API real.
- **Observación:** el advisor marca `public.handle_new_user` como ejecutable vía `/rpc/` (WARN). Se mantiene en `public` porque el SQL lo define así y al ser una trigger function (`RETURNS TRIGGER`) una invocación vía rpc falla inofensivamente; candidato a moverse a `private` en una spec futura.

## Risks

| Risk                            | Mitigation                                                                                     |
| ------------------------------- | ---------------------------------------------------------------------------------------------- |
| El trigger `handle_new_user` puede fallar si `raw_user_meta_data` no tiene los campos esperados | Validar que los campos existan antes de insertar; usar `COALESCE` y verificar `NULL`.                                                  |
| Políticas RLS demasiado restrictivas bloquean desarrollo                                        | Se pueden desactivar temporalmente con `ALTER TABLE users DISABLE ROW LEVEL SECURITY` para pruebas locales.                          |
| Insertar directamente en `auth.users` no es soportado por Supabase                              | Usar la API de Supabase Auth o `supabase auth signup` para crear el usuario staff.                                               |
| Password hardcodeado en spec puede exponerse                                                    | Solo para desarrollo local; no usar en producción.                                                          |
| Políticas RLS self-referentes provocan `42P17 infinite recursion`                                | Resuelto en migraciones 003/004 con funciones `SECURITY DEFINER` en schema `private` (ver Decisions).                                                |
| Seed con email sin confirmar no puede iniciar sesión                                            | Confirmar `email_confirmed_at` en dev (hecho en la verificación de esta spec).                                                   |

## What is **not** in this spec

- Flujo de invitaciones para padres.
- Tablas `rooms`, `children`, `posts`, etc.
- UI para gestión de usuarios.
- Migrar mocks a datos reales.
- Crear enums no relacionados con `users`.

Cada uno de esos, si llega, va en su propia spec.