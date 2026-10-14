# SPEC 07 — Daycares table with RLS and seed data

> **Status:** Implemented
> **Depends on:** None (primera tabla del esquema)
> **Date:** 2026-10-14
> **Objective:** Crear la tabla `daycares` con RLS, campo de dirección, y datos semilla incluyendo "Guardería Sala Soles".

## Scope

**In:**

- Crear tabla `daycares` con columnas: `id` (uuid PK), `name` (text), `address` (text nullable), `created_at` (timestamptz), `updated_at` (timestamptz).
- Habilitar Row Level Security (RLS) en la tabla.
- Crear políticas RLS básicas: lectura pública, escritura restringida (preparado para roles futuros).
- Insertar 4 daycares semilla incluyendo "Guardería Sala Soles".
- Aplicar como migración Supabase usando el patrón `apply_migration`.

**Out of scope (for future specs):**

- Migrar los mocks existentes (`app/_data/mock.ts`, `app/_data/kids.ts`) a datos reales.
- Crear enums (`user_role`, `user_status`, etc.) — se harán en specs posteriores.
- Tablas relacionadas (`users`, `rooms`, `children`, etc.).
- UI para gestionar daycares (CRUD visual).

## Data model

```sql
CREATE TABLE daycares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE daycares ENABLE ROW LEVEL SECURITY;

-- Política de lectura: cualquiera puede leer (preparado para auth futura)
CREATE POLICY "daycares_read" ON daycares
  FOR SELECT
  USING (true);

-- Política de escritura: restringida (se ajustará cuando existan roles)
CREATE POLICY "daycares_insert" ON daycares
  FOR INSERT
  WITH CHECK (false);

CREATE POLICY "daycares_update" ON daycares
  FOR UPDATE
  USING (false);

CREATE POLICY "daycares_delete" ON daycares
  FOR DELETE
  USING (false);
```

Seed data:

```sql
INSERT INTO daycares (name, address) VALUES
  ('Guardería Sala Soles', 'Av. Principal 123, Centro'),
  ('Guardería Arcoíris', 'Calle Luna 456, Zona Norte'),
  ('Guardería Semillitas', 'Blvd. del Sol 789, Col. Jardines'),
  ('Guardería Estrellitas', 'Paseo de los Niños 321, Residencial');
```

## Implementation plan

1. Crear migración Supabase `001_create_daycares_table.sql` con:
   - Definición de tabla `daycares`.
   - Habilitar RLS.
   - Políticas de lectura/escritura.
   - Insertar 4 daycares semilla.
2. Aplicar la migración con `apply_migration`.
3. Verificar con `list_tables` que la tabla existe y `execute_sql` para confirmar los datos semilla.

## Acceptance criteria

- [x] La tabla `daycares` existe en la base de datos con columnas `id`, `name`, `address`, `created_at`, `updated_at`.
- [x] RLS está habilitado en la tabla `daycares`.
- [x] Existen al menos 4 filas en `daycares`, incluyendo "Guardería Sala Soles".
- [x] La migración se aplicó sin errores vía `apply_migration`.
- [x] Las políticas RLS permiten SELECT y bloquean INSERT/UPDATE/DELETE.

## Decisions

- **Yes:** Incluir campo `address` (text nullable) desde el inicio. Útil para pantallas futuras de directorio de guarderías.
- **Yes:** Políticas RLS restrictivas para escritura (false). Se ajustarán cuando existan los enums de roles y la tabla `users`.
- **No:** Migrar mocks ahora. Los datos ficticios siguen funcionando para el desarrollo de UI.
- **No:** Crear enums en esta migración. Se harán cuando se creen las tablas que los necesitan (`users`, `invitations`, etc.).

## Risks

| Risk                                                     | Mitigation                                                                                                                                   |
| -------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Políticas RLS demasiado restrictivas bloquean desarrollo | Se pueden desactivar temporalmente con `ALTER TABLE daycares DISABLE ROW LEVEL SECURITY` para pruebas locales, o crear políticas temporales. |
| Seed data en migración no es idempotente                 | Usar `INSERT ... ON CONFLICT DO NOTHING` o verificar antes de insertar si se re-ejecuta.                                                     |

## What is **not** in this spec

- Migrar los mocks a datos reales de Supabase.
- Crear enums ni tablas relacionadas.
- UI para crear/editar/borrar daycares.
- Integración con las pantallas existentes.

Cada uno de esos, si llega, va en su propia spec.
