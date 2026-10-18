# SPEC 10 — Rooms y Children: tablas, RLS, seed rooms y CRUD de niños

> **Estado:** Aprobado
> **Depende de:** SPEC 07 (daycares table), SPEC 08 (users table + enums), SPEC 02 (kids list visual), SPEC 04 (add kid modal visual), SPEC 09 (real auth)
> **Fecha:** 2026-10-18
> **Objetivo:** Crear las tablas `rooms` y `children` con RLS, enums `child_status` y `relationship_type`, seed de 3 rooms (Soles, Estrellas, Arcoíris), y convertir las páginas `/kids` y `/kids/[id]` de mock a datos reales con CRUD funcional.

## Scope

**In:**

- Crear los enums `child_status` (`active`, `archived`) y `relationship_type` (`father`, `mother`, `guardian`).
- Crear tabla `rooms` con columnas: `id` (uuid PK), `daycare_id` (uuid FK → `daycares`), `name` (text), `created_at` (timestamptz).
- Crear tabla `children` con columnas: `id` (uuid PK), `room_id` (uuid FK → `rooms`), `full_name` (text), `birth_date` (date), `enrolled_at` (date), `medical_notes` (text nullable), `allergy_tags` (text[]), `photo_consent` (boolean default true), `status` (child_status default `active`), `created_at` / `updated_at` (timestamptz).
- Habilitar RLS en `rooms` y `children`.
- Crear políticas RLS: lectura para usuarios autenticados de la misma guardería, escritura para staff/admin.
- Insertar 3 rooms seed (Soles, Estrellas, Arcoíris) vinculados al daycare existente, sin niños.
- Convertir `app/kids/page.tsx` de mock a datos reales: leer rooms y children de Supabase, mostrar agrupación por sala, buscador funcional.
- Convertir `app/kids/[id]/page.tsx` de mock a datos reales: leer child por ID, mostrar perfil con alergias, datos y padres vinculados.
- Convertir `AddKidModal` de memoria a crear un registro real en `children` vía Supabase.
- Eliminar o archivar los datos mock de `app/_data/kids.ts` (ya no se usan).

**Out of scope (para futuras specs):**

- Tabla `parent_children` y vinculación de padres (ya existe SPEC 05 para el modal visual, pero la tabla y lógica real va en otra spec).
- Tabla `invitations` y flujo de invitaciones.
- Tabla `posts`, `post_children`, `post_photos`, `reactions`, `comments`, `daily_summaries`.
- UI para editar/eliminar niños (solo crear por ahora).
- UI para gestionar rooms (solo seed data).
- Upload de foto de perfil del niño.
- Migrar otros mocks a datos reales.

## Data model

### Enums nuevos

```sql
CREATE TYPE child_status AS ENUM ('active', 'archived');
CREATE TYPE relationship_type AS ENUM ('father', 'mother', 'guardian');
```

### Tabla `rooms`

```sql
CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daycare_id uuid NOT NULL REFERENCES daycares(id),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
```

### Tabla `children`

```sql
CREATE TABLE children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id uuid NOT NULL REFERENCES rooms(id),
  full_name text NOT NULL,
  birth_date date NOT NULL,
  enrolled_at date NOT NULL,
  medical_notes text,
  allergy_tags text[],
  photo_consent boolean NOT NULL DEFAULT true,
  status child_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE children ENABLE ROW LEVEL SECURITY;
```

### RLS Policies — `rooms`

```sql
-- Lectura: usuarios autenticados de la misma guardería
CREATE POLICY "rooms_read_own_daycare" ON rooms
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT u.id FROM users u WHERE u.daycare_id = rooms.daycare_id
    )
  );

-- Escritura: solo staff y admin
CREATE POLICY "rooms_staff_write" ON rooms
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT u.id FROM users u WHERE u.id = auth.uid() AND u.role IN ('staff', 'admin')
    )
  );
```

### RLS Policies — `children`

```sql
-- Lectura: usuarios autenticados de la misma guardería
CREATE POLICY "children_read_own_daycare" ON children
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT u.id FROM users u WHERE u.daycare_id = (
        SELECT r.daycare_id FROM rooms r WHERE r.id = children.room_id
      )
    )
  );

-- Escritura: solo staff y admin
CREATE POLICY "children_staff_write" ON children
  FOR ALL
  USING (
    auth.uid() IN (
      SELECT u.id FROM users u WHERE u.id = auth.uid() AND u.role IN ('staff', 'admin')
    )
  );
```

### Seed data — 3 rooms

```sql
-- Insertar 3 rooms para el daycare existente (sin children)
INSERT INTO rooms (daycare_id, name)
SELECT id, 'Soles' FROM daycares LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO rooms (daycare_id, name)
SELECT id, 'Estrellas' FROM daycares LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO rooms (daycare_id, name)
SELECT id, 'Arcoíris' FROM daycares LIMIT 1
ON CONFLICT DO NOTHING;
```

> **Nota:** No se insertan niños seed. La tabla `children` queda vacía.

### Tipos TypeScript (client-side)

```ts
export interface Room {
  id: string;
  daycare_id: string;
  name: string;
  created_at: string;
}

export interface Child {
  id: string;
  room_id: string;
  full_name: string;
  birth_date: string; // ISO date
  enrolled_at: string; // ISO date
  medical_notes: string | null;
  allergy_tags: string[];
  photo_consent: boolean;
  status: 'active' | 'archived';
  created_at: string;
  updated_at: string;
}
```

## Implementation plan

1. **Enums y tablas.** Crear migración Supabase con:
   - Enums `child_status` y `relationship_type`.
   - Tablas `rooms` y `children` con FKs, defaults y RLS.
   - Políticas RLS para `rooms` y `children`.
   - Seed de 3 rooms (Soles, Estrellas, Arcoíris) sin children.
   - Aplicar con `apply_migration`.

2. **Server actions para children.** Crear `app/_actions/children.ts` con:
   - `getRooms(daycareId: string): Promise<Room[]>` — obtiene rooms de un daycare.
   - `getChildrenByRoom(roomId: string): Promise<Child[]>` — obtiene children de una room.
   - `getAllChildren(daycareId: string): Promise<{ room: Room; children: Child[] }[]>` — obtiene todos los children agrupados por room.
   - `getChildById(id: string): Promise<Child | null>` — obtiene un child por ID.
   - `createChild(data: CreateChildInput): Promise<Child>` — crea un nuevo child.
   - Cada acción usa `createClient` de `@/utils/supabase/server`.

3. **Convertir `/kids` a datos reales.** Actualizar `app/kids/page.tsx`:
   - Server component que obtiene el usuario autenticado, su `daycare_id`, y llama a `getAllChildren`.
   - Renderiza agrupación por sala con contador real de niños.
   - Buscador: convertir a cliente (`'use client'`) con filtrado frontend por `full_name`.
   - Botón "Agregar niño" abre `AddKidModal` (ahora funcional).
   - Eliminar dependencia de `app/_data/kids.ts`.

4. **Convertir `/kids/[id]` a datos reales.** Actualizar `app/kids/[id]/page.tsx`:
   - Server component que lee `params.id` y llama a `getChildById`.
   - Si no existe, muestra "Niño no encontrado" con link a `/kids`.
   - Calcula edad desde `birth_date`, muestra sala desde `room_id`.
   - Sección de padres vinculados: mostrar placeholder hasta que exista `parent_children` real.
   - Eliminar dependencia de `app/_data/kids.ts`.

5. **Convertir `AddKidModal` a crear datos reales.** Actualizar `components/kids/AddKidModal.tsx`:
   - El `onAdd` ahora llama a una server action `createChild`.
   - Tras crear exitosamente: `revalidatePath('/kids')` y cerrar modal.
   - Mantener validación de campos obligatorios y máscara de fecha.
   - El select de sala obtiene opciones reales de `getRooms`.

6. **Limpiar datos mock.** Eliminar o archivar `app/_data/kids.ts` y sus helpers. Actualizar imports en componentes que aún lo referencien.

7. **Generar tipos TypeScript.** Ejecutar `supabase_generate_typescript_types` para obtener los tipos actualizados de la BD.

8. **Verificar.** `npm run dev`, comparar `/kids` contra `ninos.dc.html`. `npm run lint` y `npx tsc --noEmit`.

## Acceptance criteria

- [x] Los enums `child_status` y `relationship_type` existen en la base de datos.
- [x] La tabla `rooms` existe con RLS habilitado.
- [x] La tabla `children` existe con RLS habilitado.
- [x] Las políticas RLS permiten SELECT para usuarios de la misma guardería.
- [x] Las políticas RLS permiten escritura solo para staff/admin.
- [x] Existen 3 rooms (Soles, Estrellas, Arcoíris) vinculadas al daycare existente.
- [x] La tabla `children` está vacía (sin seed data).
  - La migración `006` no inserta ningún niño (el seed es solo de rooms). La tabla contiene 1 fila, `Jessica Tinitana`, creada por el usuario desde el CRUD de la app (dato real, no seed); el niño de prueba de la verificación fue eliminado.
- [x] `/kids` muestra las rooms reales con sus children desde la base de datos.
- [x] `/kids` agrupa niños por sala con contador real.
- [x] El buscador filtra niños por nombre (frontend).
- [x] Click en una tarjeta de niño navega a `/kids/[id]`.
- [x] `/kids/[id]` muestra el perfil real del niño desde la base de datos.
- [x] `/kids/[id]` calcula la edad desde `birth_date`.
- [x] El botón "Agregar niño" abre el modal funcional.
- [x] Crear un niño nuevo lo inserta en la base de datos y refresca la lista.
- [x] `npm run lint` pasa sin errores.
- [x] `npx tsc --noEmit` pasa sin errores.
- [x] No hay errores en la consola del navegador.

## Decisions

- **Sí:** Server actions para CRUD de children. Sigue el patrón de Next.js 16 App Router con `createServerClient`.
- **Sí:** Buscador frontend en `/kids`. No hay necesidad de server-side search para el volumen esperado de niños.
- **Sí:** 3 rooms seed sin children. El usuario confirmó que no necesita niños de prueba.
- **Sí:** RLS con lectura por `daycare_id` y escritura solo para staff/admin. Estándar del proyecto.
- **Sí:** Eliminar `app/_data/kids.ts` tras la migración. No tiene sentido mantener mock y datos reales en paralelo.
- **No:** UI para gestionar rooms. Solo existen como seed data; no se editan ni eliminan desde la UI.
- **No:** Tabla `parent_children` ni vinculación de padres. Va en spec separada.
- **No:** Editar/eliminar niños. Solo crear por ahora.
- **Nota (verificación 18/10/2026):** las políticas RLS se implementaron con los helpers `private.current_user_daycare_id()` / `private.current_user_role()` (patrón de SPEC 08, migración `004`) en lugar de la subquery directa a `users` del Data model; misma semántica y evita recursión RLS. La migración agrega además `UNIQUE (daycare_id, name)` en `rooms` para soportar el `ON CONFLICT` del seed.
- **Nota (verificación 18/10/2026):** `/kids` solo lista las salas con al menos un niño (las salas vacías, p. ej. Arcoíris, no muestran encabezado), igual que el mockup `ninos.dc.html`. El resto de la pantalla sí sale 100 % de datos reales.

## Risks

| Risk                                                                    | Mitigation                                                                                                   |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `birth_date` como `date` en Postgres puede tener problemas de timezone  | Usar formato ISO (`YYYY-MM-DD`) y convertir a string en la UI. No se necesita hora.                          |
| RLS policies con subqueries pueden ser lentas                           | Para el volumen de una guardería (<200 niños) no es problema. Se puede optimizar después con joins directos. |
| El modal de agregar niño puede fallar si no hay rooms                   | Las 3 rooms seed garantizan que siempre hay al menos una sala disponible.                                    |
| `allergy_tags` como `text[]` puede ser difícil de manejar en el cliente | Convertir a array de strings en el cliente; la UI ya maneja texto libre para alergias.                       |

## What is **not** in this spec

- Tabla `parent_children` y vinculación de padres.
- Tabla `invitations` y flujo de invitaciones.
- UI para editar/eliminar niños.
- UI para gestionar rooms.
- Tablas `posts`, `post_children`, `post_photos`, `reactions`, `comments`, `daily_summaries`.
- Upload de foto de perfil del niño.
- Migrar otros mocks a datos reales.

Cada uno de esos, si llega, va en su propia spec.