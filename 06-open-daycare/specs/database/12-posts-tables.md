# SPEC 12 — Posts, post_children, post_photos y bucket de fotos

> **Estado:** Aprobado
> **Depende de:** SPEC 08 (users table), SPEC 10 (rooms and children)
> **Fecha:** 2026-10-23
> **Objetivo:** Crear el enum `post_type` de 7 valores, las tablas `posts`, `post_children` y `post_photos` con RLS, el bucket público `post-photos` y la columna `users.room_id`, para que las publicaciones del feed se persistan en Supabase.

## Por qué existe esta spec

SPEC 06 dejó el feed entero en memoria: los posts mueren al recargar y las fotos son object URLs de la pestaña. El schema de referencia (`../07-DB-Schema`) ya define `posts`, `post_children` y `post_photos`, pero ninguna está creada — y el enum de referencia tiene 6 tipos mientras el modal (SPEC 06) ofrece 7: le falta `mood` (Ánimo). Además `users` no tiene sala: sin eso, "Toda la sala" no tiene `room_id` al que apuntar, porque el staff pertenece a una guardería, no a un salón. Esta spec construye el esquema; el modal y el feed lo consumen en la SPEC 13.

## Scope

**In:**

- Crear enum `post_type` con los 7 valores: `meal`, `nap`, `activity`, `achievement`, `mood`, `photo`, `announcement`.
- Crear tabla `posts` con columnas: `id` (uuid PK), `author_id` (uuid FK → `users`), `room_id` (uuid FK → `rooms`, nullable), `type` (`post_type`), `title` (text nullable), `body` (text), `published_at` (timestamptz default `now()`), `created_at` / `updated_at` (timestamptz).
- Crear tabla `post_children` con columnas: `post_id` (uuid FK → `posts`), `child_id` (uuid FK → `children`), PK compuesta (`post_id`, `child_id`).
- Crear tabla `post_photos` con columnas: `id` (uuid PK), `post_id` (uuid FK → `posts`), `url` (text), `width` / `height` (int, nullable), `position` (int), `created_at` (timestamptz).
- Agregar `users.room_id` (uuid FK → `rooms`, nullable) con backfill: cada usuario con guardería queda en la sala "Soles" de su propia guardería.
- Crear bucket público `post-photos` y sus políticas en `storage.objects`: insert, select y delete solo para staff/admin autenticado con path `{daycare_id}/{user_id}/…`, lectura pública de las fotos vía URL canónica del bucket.
- Habilitar RLS en `posts`, `post_children` y `post_photos`: lectura para el mismo daycare (vía autor del post), insert solo staff/admin del mismo daycare. UPDATE y DELETE quedan en default-deny.
- Índices: `posts (published_at)`, `post_children (child_id)`, `post_photos (post_id)`, `posts (author_id)`.
- Migraciones `supabase/migrations/009_posts_and_storage.sql` y `010_storage_select_policy.sql`, aplicadas con `apply_migration` (la 010 es un forward-fix agregado durante la verificación, ver Decisions).
- Verificación con `execute_sql` y `get_advisors` (security).

**Fuera de alcance (specs futuras):**

- Cualquier cambio de aplicación (modal, feed, acciones): van en la SPEC 13.
- Tablas `reactions`, `comments`, `daily_summaries` (el schema de referencia las define; aún no).
- Políticas UPDATE/DELETE en `posts`: llegarán con la spec de editar/eliminar publicación.
- Sembrar posts, usuarios, niños o fotos de prueba: el feed arranca vacío (decisión consciente, ver Decisions).
- Corregir `../07-DB-Schema/opendaycare-database-schema.md`, que queda desactualizado (enum de 6 tipos, sin `mood`, sin `users.room_id`): es una referencia de otro proyecto, no de este repo.
- Notificaciones por publicación (`users.notify_on_post` ya existe pero nadie lo consume).

## Data model

### Enum nuevo

```sql
CREATE TYPE post_type AS ENUM (
  'meal', 'nap', 'activity', 'achievement', 'mood', 'photo', 'announcement'
);
```

Mapeo con la UI (SPEC 06): `meal`→Comida, `nap`→Siesta, `activity`→Actividad, `achievement`→Logro, `mood`→Ánimo, `photo`→Foto, `announcement`→Anuncio.

### Tabla `posts`

```sql
CREATE TABLE posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  room_id uuid REFERENCES rooms(id) ON DELETE RESTRICT,
  type post_type NOT NULL,
  title text,
  body text NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
```

Convención de audiencia (no mezcla tipo con audiencia):

- **Sala:** `room_id` poblado y **cero** filas en `post_children`. El `type` puede ser cualquiera, sí: "Toda la sala" + "Comida" es válido.
- **Niños:** `room_id` es NULL y una o más filas en `post_children`.
- `title` guarda un snapshot del título de audiencia calculado al insertar ("Mateo", "Varios niños", "Toda la sala"), para que renombrar un niño no reescribe posts viejos.

### Tabla `post_children`

```sql
CREATE TABLE post_children (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, child_id)
);

ALTER TABLE post_children ENABLE ROW LEVEL SECURITY;
```

### Tabla `post_photos`

```sql
CREATE TABLE post_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  url text NOT NULL,
  width int,
  height int,
  position int NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE post_photos ENABLE ROW LEVEL SECURITY;
```

`url` guarda la ruta pública del archivo en el bucket (la URL canónica se arma con la base pública del proyecto).

### `users.room_id`

```sql
ALTER TABLE users
  ADD COLUMN room_id uuid REFERENCES rooms(id) ON DELETE SET NULL;

-- Backfill: cada usuario con guardería queda en la sala "Soles" de su daycare.
UPDATE users u
SET room_id = r.id
FROM rooms r
WHERE r.daycare_id = u.daycare_id
  AND r.name = 'Soles'
  AND u.room_id IS NULL;
```

Nullable a propósito: usuarios sin sala siguen pudiendo existir; la app valida que "Toda la sala" requiere sala asignada (SPEC 13).

### Bucket `post-photos`

```sql
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-photos', 'post-photos', true)
ON CONFLICT (id) DO NOTHING;
```

Convención de path: `{daycare_id}/{user_id}/{uuid}.{ext}`. El primer nivel permite acotar por guardería; el segundo atasca cada archivo al usuario que lo subió, lo que hace simples las políticas de insert y delete.

### RLS — `posts`

```sql
-- Lectura: usuarios autenticados de la misma guardería (vía autor del post)
CREATE POLICY "posts_read_own_daycare" ON public.posts
  FOR SELECT TO authenticated
  USING (
    author_id IN (
      SELECT u.id FROM public.users u
      WHERE u.daycare_id = (SELECT private.current_user_daycare_id())
    )
  );

-- Escritura: solo staff/admin, author propio, sala de la propia guardería
CREATE POLICY "posts_staff_insert" ON public.posts
  FOR INSERT TO authenticated
  WITH CHECK (
    author_id = (SELECT auth.uid())
    AND (SELECT private.current_user_role()) IN ('staff', 'admin')
    AND (
      room_id IS NULL
      OR room_id IN (
        SELECT r.id FROM public.rooms r
        WHERE r.daycare_id = (SELECT private.current_user_daycare_id())
      )
    )
  );
```

Sin políticas UPDATE/DELETE: default-deny hasta la spec de editar/eliminar.

### RLS — `post_children` y `post_photos`

```sql
-- post_children: lectura si el post es visible (mismo daycare vía autor)
CREATE POLICY "post_children_read_own_daycare" ON public.post_children
  FOR SELECT TO authenticated
  USING (
    post_id IN (
      SELECT p.id FROM public.posts p
      JOIN public.users u ON u.id = p.author_id
      WHERE u.daycare_id = (SELECT private.current_user_daycare_id())
    )
  );

-- post_children: escritura solo staff/admin sobre posts propios
CREATE POLICY "post_children_author_insert" ON public.post_children
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT private.current_user_role()) IN ('staff', 'admin')
    AND post_id IN (SELECT p.id FROM public.posts p WHERE p.author_id = (SELECT auth.uid()))
  );

-- post_photos: mismas reglas que post_children
CREATE POLICY "post_photos_read_own_daycare" ON public.post_photos
  FOR SELECT TO authenticated
  USING (
    post_id IN (
      SELECT p.id FROM public.posts p
      JOIN public.users u ON u.id = p.author_id
      WHERE u.daycare_id = (SELECT private.current_user_daycare_id())
    )
  );

CREATE POLICY "post_photos_author_insert" ON public.post_photos
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT private.current_user_role()) IN ('staff', 'admin')
    AND post_id IN (SELECT p.id FROM public.posts p WHERE p.author_id = (SELECT auth.uid()))
  );
```

### RLS — `storage.objects` (bucket `post-photos`)

```sql
-- Insert: staff/admin sube a su guardería y su propio prefijo de usuario
CREATE POLICY "post_photos_insert_own_path" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'post-photos'
    AND (SELECT private.current_user_role()) IN ('staff', 'admin')
    AND (storage.foldername(name))[1] = (SELECT private.current_user_daycare_id())::text
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  );

-- Select: el usuario ve (y el upload devuelve) solo los archivos de su path.
-- Agregado en la migración 010 (forward-fix): sin esta policy, el INSERT con
-- RETURNING de storage-js puede fallar o devolver vacío.
CREATE POLICY "post_photos_select_own_path" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'post-photos'
    AND (storage.foldername(name))[1] = (SELECT private.current_user_daycare_id())::text
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  );

-- Delete: el dueño del path limpia sus propios archivos (cleanup ante fallo)
CREATE POLICY "post_photos_delete_own_path" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'post-photos'
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  );
```

Lectura de las fotos por la app: URL canónica del bucket público. La policy de select de arriba no cambia eso; solo habilita el upload y que el dueño vea sus propios archivos vía PostgREST.

### Índices

```sql
CREATE INDEX idx_posts_published_at ON public.posts (published_at DESC);
CREATE INDEX idx_posts_author_id ON public.posts (author_id);
CREATE INDEX idx_post_children_child_id ON public.post_children (child_id);
CREATE INDEX idx_post_photos_post_id ON public.post_photos (post_id);
```

## Implementation plan

1. Escribir `supabase/migrations/009_posts_and_storage.sql` completo: enum, 3 tablas, `users.room_id` + backfill, bucket, políticas RLS (tablas + storage) e índices. El archivo compila como SQL; nada se aplica todavía.
2. Aplicar una sola vez con `apply_migration`. Si falla, corregir el archivo y no reintentar a ciegas: cada fallo se diagnostica con el mensaje exacto.
3. Verificar con `execute_sql`: enum con 7 valores, 3 tablas con sus columnas/FKs, `users.room_id` poblada en el staff seed con la sala Soles, bucket `post-photos` público, políticas `pg_policies` y `storage.objects` presentes.
4. Correr `get_advisors` tipo `security` y revisar que no aparezcan hallazgos nuevos sobre estas tablas ni sobre `storage.objects`.
5. Smoke test de RLS en `begin … rollback`: con `request.jwt.claims` del staff seed, insertar un post de sala y uno con un child; con claims de un usuario de otra guardería, comprobar que el select no devuelve nada.
6. **Forward-fix durante la verificación:** el smoke test del bucket revela que `storage.objects` quedó con solo INSERT y DELETE (sin SELECT para `authenticated`), lo que puede romper el RETURNING del upload de storage-js. Escribir y aplicar `010_storage_select_policy.sql` con `post_photos_select_own_path` (select limitado al path propio) y re-verificar: el usuario ve sus archivos y no los ajenos.

## Acceptance criteria

- [x] Las migraciones `009_posts_and_storage.sql` y `010_storage_select_policy.sql` existen y están aplicadas (visibles en `supabase_migrations.schema_migrations`).
- [x] `post_type` existe con exactamente los 7 valores, incluido `mood`.
- [x] `posts`, `post_children` y `post_photos` existen con las columnas, FKs y PK compuesta definidas en Data model.
- [x] `users.room_id` existe y el usuario staff seed quedó vinculado a la sala "Soles" de su guardería.
- [x] El bucket `post-photos` existe y es público.
- [x] Un insert en `storage.objects` del bucket con path ajeno a `{su_daycare}/{su_uid}/…` es rechazado para el staff seed; con path propio pasa.
- [x] El select en `storage.objects` del staff seed devuelve sus archivos de path propio y no los de otro usuario (`post_photos_select_own_path`).
- [x] El RLS de `posts` permite al staff seed insertar un post con `author_id` propio y `room_id` de su guardería; rechaza `author_id` de otro usuario y `room_id` de otra guardería.
- [x] El RLS de `posts` no devuelve posts de otra guardería.
- [x] `post_children` y `post_photos` solo aceptan insert sobre posts propios del autor autenticado.
- [x] No existen políticas UPDATE ni DELETE en `posts` (default-deny).
- [x] Los 4 índices existen.
- [x] `get_advisors` (security) no reporta hallazgos nuevos imputables a esta migración (los 3 lints de `SECURITY DEFINER` son preexistentes de SPEC 08/11).
- [x] `npm run lint` y `npm run build` siguen en verde (la migración no toca código).

## Decisions

- **Sí:** `mood` entra al enum — la UI de 7 pastillas (SPEC 06) es la fuente de la verdad; el schema de referencia queda corregido como deuda anotada. Se descartó quitar Ánimo del modal.
- **Sí:** audiencia sala = `room_id` poblado + cero filas en `post_children`, con `type` libre. Se descartó forzar "Toda la sala" = `announcement` (mezclaría audiencia con tipo) y etiquetar a todos los niños de la sala (crecería con cada alta y perdería la semántica).
- **Sí:** `users.room_id` con backfill a "Soles" — decisión del usuario en el grill. Se descartó asumir la sala por convención en la app (frágil, invisible en los datos) y un picker de sala en el modal (rompe el mockup).
- **Sí:** RLS de lectura = mismo guardería vía autor del post, con los helpers `private.current_user_*` (patrón corregido en migraciones 003/004 y reusado en 006/007). Se descartó visibilidad por sala: RLS a nivel guardería es el baseline; el filtro fino llega con el feed de la familia.
- **Sí:** UPDATE/DELETE default-deny en `posts`. Llegan con la spec de editar/eliminar, con sus propias políticas y su propio check.
- **Sí:** bucket `post-photos` público — decisión del usuario en el grill. Se descartó bucket privado con URLs firmadas: obligaría a firmar en cada lectura del feed.
- **Sí:** path `{daycare_id}/{user_id}/{uuid}.{ext}`: convención que hace la política de insert una comparación de dos segmentos y habilita el cleanup por dueño.
- **Sí:** `ON DELETE CASCADE` en `author_id` y FKs de hijo; `ON DELETE RESTRICT` en `room_id` (borrar una sala no puede volar posts ni dejarlos flotando sin audiencia).
- **Sí:** `title` persistido como snapshot del título de audiencia. Se descartó recalcularlo en cada lectura: renombrar un niño reescribiría el historial.
- **No:** seed de posts, reactions o comments — el feed arranca vacío (decisión del usuario en el grill). Se descartó sembrar los 3 posts mock y también la variante de sembrar reactions/comments para reproducir los contadores inventados.
- **No:** esta spec no toca una línea de código de la app. Todo el consumo es SPEC 13.
- **Sí (forward-fix):** `post_photos_select_own_path` en `storage.objects`, agregada en `010_storage_select_policy.sql` durante la verificación de esta spec — decisión del usuario. El smoke test reveló que el bucket quedó con solo INSERT y DELETE; el upload() de storage-js puede requerir que el row insertado sea visible vía SELECT/RETURNING, y con default-deny hay uploads que fallan o devuelven vacío. Se descartó dejarlo para la SPEC 13 (riesgo de tropezar con el upload sin la causa a la vista) y asumir que upload funciona sin SELECT. La policy está limitada al path propio (`{su_daycare}/{su_uid}/…`): habilita el upload sin abrir lectura cruzada entre usuarios; las fotos se sirven igual por URL canónica del bucket público.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Usuarios sin `room_id` (backfill solo cubre los existentes con guardería) no pueden publicar "Toda la sala" | Columna nullable a propósito; la SPEC 13 valida en la action y muestra mensaje en voseo |
| El `UPDATE` del backfill toca filas de `users` existentes | Filtro explícito `u.room_id IS NULL` + `r.name = 'Soles'` por daycare; verificado en el smoke test |
| Archivos en el bucket sin fila en `post_photos` (cleanup best-effort de la SPEC 13 puede fallar) | Delete policy permite al dueño limpiar; una futura spec puede barrer huérfanos |
| `post_type` no admite valores extra sin `ALTER TYPE … ADD VALUE` | Enum pensado con los 7 tipos del modal; agregar un tipo nuevo es una migración simple |
| La referencia `../07-DB-Schema` queda desactualizada (6 tipos, sin `room_id` en users) | Anotado en Out of scope: se corrige en ese proyecto, no en este repo |

## What is **not** in this spec

- El modal, el feed, la Server Action de publicar y el "Ver más posts": SPEC 13.
- Editar o eliminar posts (ni sus políticas UPDATE/DELETE).
- Reacciones, comentarios y contadores reales.
- Sembrar contenido de demostración.
- Notificaciones (`notify_on_post` sigue sin consumir).
- Corregir el archivo de referencia del schema en `../07-DB-Schema`.

Cada uno de esos, si llega, va en su propia spec.
