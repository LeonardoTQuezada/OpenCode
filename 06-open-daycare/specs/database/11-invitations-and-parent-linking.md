# SPEC 11 — Invitaciones y vinculación de padres: tablas, email con Resend y flujo de activación

> **Estado:** Aprobado
> **Depende de:** SPEC 05 (link parent modal visual), SPEC 08 (users table + enums), SPEC 09 (real auth), SPEC 10 (rooms and children)
> **Fecha:** 2026-10-18
> **Objetivo:** Crear tablas `invitations` y `parent_children`, convertir el modal de vincular padre en funcional (generar código + enviar email con Resend), y hacer la página `/activate` un flujo real de registro con código de invitación.

## Scope

**In:**

- Crear tabla `invitations` con columnas: `id` (uuid PK), `child_id` (uuid FK → `children`), `invited_by` (uuid FK → `users`), `full_name` (text), `email` (text), `relationship` (relationship_type), `code` (text UNIQUE), `status` (invitation_status default `pending`), `expires_at` (timestamptz), `accepted_at` (timestamptz nullable), `created_at` (timestamptz).
- Crear tabla `parent_children` con columnas: `id` (uuid PK), `parent_id` (uuid FK → `users`), `child_id` (uuid FK → `children`), `relationship` (relationship_type), `created_at` (timestamptz). UNIQUE (`parent_id`, `child_id`).
- Habilitar RLS en ambas tablas con políticas de lectura/escritura.
- Server action `createInvitation` que: genera código aleatorio de 5 caracteres alfanuméricos, inserta en `invitations`, y envía email vía Resend con link de activación.
- Función utilitaria `generateInvitationCode()` que produce códigos únicos de 5 caracteres.
- Función `sendInvitationEmail` que envía el email usando `resend` (Node package), con template HTML en español incluyendo: nombre del niño, nombre del staff que invita, código de invitación, y link de activación (`${NEXT_PUBLIC_APP_URL}/activate?code=...`).
- Variable de entorno `NEXT_PUBLIC_APP_URL` para construir el link de activación (localhost en dev, dominio real en prod).
- Convertir `LinkParentModal` de mock a funcional: al enviar, llama a `createInvitation`, muestra loading state, y maneja errores.
- Convertir `ParentsSection` para listar padres vinculados reales desde `parent_children` (con status `pending`/`active`).
- Convertir `/activate` de placeholder visual a funcional: lee `code` del query string, valida contra `invitations`, pre-llena email y nombre, permite crear contraseña, crea usuario en Supabase Auth, y vincula en `parent_children`.
- Actualizar `proxy.ts` para permitir acceso público a `/activate` con query params.

**Out of scope (para futuras specs):**

- UI para gestionar/revocar invitaciones existentes.
- Reenvío de invitaciones expiradas.
- Notificaciones push o SMS.
- UI para editar perfil del padre post-activación.
- Flujo de "olvidé mi contraseña" para padres ya activados.
- Roles avanzados (múltiples tutores con permisos diferenciados).

## Data model

### Enum nuevo

```sql
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');
```

### Tabla `invitations`

```sql
CREATE TABLE invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text NOT NULL,
  relationship relationship_type NOT NULL,
  code text UNIQUE NOT NULL,
  status invitation_status NOT NULL DEFAULT 'pending',
  expires_at timestamptz NOT NULL,
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
```

### Tabla `parent_children`

```sql
CREATE TABLE parent_children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  relationship relationship_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, child_id)
);

ALTER TABLE parent_children ENABLE ROW LEVEL SECURITY;
```

### RLS Policies — `invitations`

```sql
-- Lectura: usuarios autenticados de la misma guardería
CREATE POLICY "invitations_read_own_daycare" ON invitations
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT u.id FROM users u WHERE u.daycare_id = (
        SELECT r.daycare_id FROM rooms r
        JOIN children c ON c.room_id = r.id
        WHERE c.id = invitations.child_id
      )
    )
  );

-- Escritura: solo staff y admin
CREATE POLICY "invitations_staff_write" ON invitations
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT u.id FROM users u WHERE u.id = auth.uid() AND u.role IN ('staff', 'admin')
    )
  );
```

### RLS Policies — `parent_children`

```sql
-- Lectura: usuarios autenticados de la misma guardería
CREATE POLICY "parent_children_read_own_daycare" ON parent_children
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT u.id FROM users u WHERE u.daycare_id = (
        SELECT r.daycare_id FROM rooms r
        JOIN children c ON c.room_id = r.id
        WHERE c.id = parent_children.child_id
      )
    )
  );

-- Escritura: solo staff y admin (para crear vínculos post-activación)
CREATE POLICY "parent_children_staff_write" ON parent_children
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT u.id FROM users u WHERE u.id = auth.uid() AND u.role IN ('staff', 'admin')
    )
  );

-- Los padres pueden ver sus propios vínculos
CREATE POLICY "parent_children_read_own" ON parent_children
  FOR SELECT
  USING (auth.uid() = parent_id);
```

### Tipos TypeScript

```ts
export interface Invitation {
  id: string;
  child_id: string;
  invited_by: string;
  full_name: string;
  email: string;
  relationship: 'father' | 'mother' | 'guardian';
  code: string;
  status: 'pending' | 'accepted' | 'expired' | 'cancelled';
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export interface ParentChild {
  id: string;
  parent_id: string;
  child_id: string;
  relationship: 'father' | 'mother' | 'guardian';
  created_at: string;
}
```

### Variables de entorno nuevas

| Variable              | Descripción                            | Ejemplo                                                    |
| --------------------- | -------------------------------------- | ---------------------------------------------------------- |
| `RESEND_API_KEY`      | API key de Resend para envío de emails | `re_xxx`                                                   |
| `NEXT_PUBLIC_APP_URL` | URL base de la aplicación              | `http://localhost:3000` (dev) / `https://miapp.com` (prod) |

## Implementation plan

1. **Enums y tablas.** Crear archivo de migración en `supabase/migrations/20260709000000_11_create_invitations_and_parent_children.sql` con:
   - Enum `invitation_status`.
   - Tablas `invitations` y `parent_children` con FKs, defaults y RLS.
   - Políticas RLS para ambas tablas.
   - Aplicar con `apply_migration`.

2. **Instalar Resend.** `npm install resend`. Agregar `RESEND_API_KEY` y `NEXT_PUBLIC_APP_URL` al `.env.local` (el template ya tiene `RESEND_API_KEY`).

3. **Utilidad `generateInvitationCode`.** Crear `app/_lib/invitation-code.ts`:
   - Función que genera 5 caracteres alfanuméricos uppercase (excluye caracteres confusos como 0/O, 1/I).
   - Función async `generateUniqueCode(supabase)` que verifica unicidad contra la tabla `invitations` y reintenta si hay colisión.

4. **Función `sendInvitationEmail`.** Crear `app/_lib/email.ts`:
   - Usa `resend` para enviar email HTML.
   - Template en español con: saludo personalizado, nombre del niño, nombre del staff que invita, código de invitación destacado, botón/link de activación.
   - From: `OpenDayCare <onboarding@resend.dev>` (dominio por defecto de Resend).
   - To: email del padre invitado.
   - Subject: "Te invitaron a seguir a {nombre del niño} en OpenDayCare".

5. **Server action `createInvitation`.** Crear `app/_actions/invitations.ts`:
   - Valida que el usuario sea staff/admin.
   - Genera código único.
   - Inserta en `invitations` con `expires_at = now() + 7 days`.
   - Llama a `sendInvitationEmail`.
   - Retorna `{ code, expiresAt }` o error.
   - `revalidatePath('/kids/[id]')`.

6. **Server actions para `parent_children`.** En `app/_actions/invitations.ts`:
   - `getParentsByChild(childId: string): Promise<ParentChild[]>` — obtiene padres vinculados a un niño.
   - `activateInvitation(code, email, password, fullName): Promise<void>` — valida código, crea usuario en Supabase Auth, crea fila en `users` (el trigger de SPEC 08 lo hace), crea fila en `parent_children`.

7. **Convertir `LinkParentModal` a funcional.** Actualizar `components/kids/LinkParentModal.tsx`:
   - Agregar `'use client'` (ya lo tiene).
   - Agregar estado `isSubmitting` y `error`.
   - Al enviar: llamar `createInvitation` con nombre, email, parentesco, childId.
   - Mostrar loading state en botón ("Enviando...").
   - Mostrar error si falla.
   - Al éxito: cerrar modal y revalidar.
   - El código de invitación ya no es hardcodeado — se genera en el servidor y se muestra en el modal tras crear la invitación (o se oculta porque ya se envió por email).
   - **Decisión de diseño:** tras enviar exitosamente, mostrar un estado de "Invitación enviada" con el código generado (para que el staff pueda compartirlo manualmente si el email falla).

8. **Convertir `ParentsSection` a datos reales.** Actualizar `components/kids/ParentsSection.tsx`:
   - Server component que obtiene padres vinculados desde `getParentsByChild`.
   - Mostrar lista de padres con avatar, nombre, rol, y status (pendiente/activo).
   - Para padres pendientes: mostrar badge "PENDIENTE".
   - El botón "Vincular otro padre" sigue abriendo el modal.

9. **Convertir `/activate` a funcional.** Actualizar `app/(auth)/activate/page.tsx`:
   - `'use client'` para manejar formulario.
   - Leer `code` del query string (`useSearchParams`).
   - Al cargar: validar código contra server action `validateInvitationCode(code)`.
   - Si válido: pre-llenar email y nombre del padre desde la invitación, mostrar nombre del niño y sala.
   - Si inválido/expirado: mostrar error con link a `/login`.
   - Formulario: email (readonly), password (crear), checkbox de autorización de fotos.
   - Submit: llamar `activateInvitation(code, email, password, fullName)`.
   - Al éxito: redirigir a `/` (hard refresh).
   - Mantener diseño visual del template.

10. **Actualizar `proxy.ts`.** Agregar `/activate` a rutas públicas (ya está). Asegurar que query params no interfieran.

11. **Verificar.** `npm run dev`, probar flujo completo: staff crea invitación → email se envía → padre abre link → activa cuenta → padre aparece en lista. `npm run lint` y `npx tsc --noEmit`.

## Acceptance criteria

- [ ] El enum `invitation_status` existe en la base de datos con valores `pending`, `accepted`, `expired`, `cancelled`.
- [ ] La tabla `invitations` existe con RLS habilitado.
- [ ] La tabla `parent_children` existe con RLS habilitado y constraint UNIQUE en (`parent_id`, `child_id`).
- [ ] Las políticas RLS permiten SELECT para usuarios de la misma guardería.
- [ ] Las políticas RLS permiten INSERT en `invitations` solo para staff/admin.
- [ ] `generateInvitationCode()` produce códigos de 5 caracteres alfanuméricos uppercase.
- [ ] `createInvitation` genera código único, inserta en BD, y envía email con Resend.
- [ ] El email enviado contiene: nombre del niño, nombre del staff, código de invitación, y link de activación.
- [ ] El link de activación usa `NEXT_PUBLIC_APP_URL` como base.
- [ ] `LinkParentModal` muestra loading state al enviar.
- [ ] `LinkParentModal` muestra error si la invitación falla.
- [ ] Tras enviar exitosamente, el modal muestra el código generado y cierra.
- [ ] `ParentsSection` lista padres vinculados reales desde la base de datos.
- [ ] Padres pendientes muestran badge "PENDIENTE".
- [ ] `/activate` lee el código del query string y valida contra la BD.
- [ ] `/activate` pre-llena email y nombre del padre desde la invitación.
- [ ] `/activate` muestra nombre del niño y sala.
- [ ] Código inválido o expirado muestra error en `/activate`.
- [ ] Al activar exitosamente, se crea usuario en Supabase Auth con rol `parent`.
- [ ] Al activar exitosamente, se crea vínculo en `parent_children`.
- [ ] La invitación cambia a status `accepted` tras activación.
- [ ] Post-activación, redirige a `/` con sesión activa.
- [ ] `npm run lint` pasa sin errores.
- [ ] `npx tsc --noEmit` pasa sin errores.
- [ ] No hay errores en la consola del navegador.

## Decisions

- **Yes:** Código de invitación de 5 caracteres alfanuméricos uppercase, generado automáticamente en el servidor. Evita colisiones y es fácil de compartir manualmente.
- **Yes:** Email enviado desde Next.js (server action) usando el paquete `resend`. No se usa Edge Function porque el server component ya tiene acceso a variables de entorno y es más simple.
- **Yes:** `NEXT_PUBLIC_APP_URL` como variable de entorno para construir el link de activación. Permite localhost en dev y dominio real en prod sin cambios de código.
- **Yes:** Expiración de 7 días para invitaciones. Coincide con el diseño visual ("Vence en 7 días").
- **Yes:** Mostrar el código generado en el modal tras enviar exitosamente. Útil como backup si el email falla o llega a spam.
- **Yes:** El padre se crea con rol `parent` y status `active` directamente en la activación. No pasa por `pending` en la tabla `users`.
- **Yes:** Reutilizar el trigger `handle_new_user` de SPEC 08 para crear la fila en `users`. Pasar `role: 'parent'` en `raw_user_meta_data`.
- **Yes:** Checkbox de autorización de fotos pre-marcado por defecto. Mejora la UX y coincide con el diseño.
- **No:** UI para gestionar/revocar invitaciones. Va en spec futura.
- **No:** Reenvío de invitaciones expiradas. Va en spec futura.
- **No:** Dominio personalizado de Resend. Se usa `onboarding@resend.dev` por ahora.

## Risks

| Risk                                                          | Mitigation                                                                                                        |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Resend puede fallar si la API key no está configurada         | Validar que `RESEND_API_KEY` exista antes de enviar; mostrar error claro en el modal si falta.                    |
| El email puede llegar a spam                                  | Incluir el código de invitación visible en el modal como backup. El staff puede compartirlo manualmente.          |
| `NEXT_PUBLIC_APP_URL` puede estar mal configurada en prod     | Documentar en el README que esta variable es obligatoria. Usar verificación en el build.                          |
| El código de invitación puede tener colisiones                | Reintentar generación si hay colisión (muy improbable con 5 caracteres alfanuméricos = 32^5 = 33M combinaciones). |
| El trigger `handle_new_user` puede fallar si faltan metadatos | Pasar `role`, `daycare_id`, `full_name` explícitamente en `raw_user_meta_data` al crear el usuario.               |
| RLS policies con subqueries pueden ser lentas                 | Para el volumen de una guardería (<200 niños) no es problema. Se puede optimizar después.                         |
| El padre puede intentar activar con un código ya usado        | Validar `status = 'pending'` y `expires_at > now()` antes de permitir la activación.                              |

## What is **not** in this spec

- UI para gestionar/revocar invitaciones existentes.
- Reenvío de invitaciones expiradas.
- Notificaciones push o SMS.
- UI para editar perfil del padre post-activación.
- Flujo de "olvidé mi contraseña" para padres ya activados.
- Dominio personalizado de Resend.
- Roles avanzados (múltiples tutores con permisos diferenciados).

Cada uno de esos, si llega,