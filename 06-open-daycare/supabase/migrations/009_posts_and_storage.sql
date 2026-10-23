-- SPEC 12: enum post_type, tablas posts/post_children/post_photos, RLS,
-- users.room_id con backfill, bucket público post-photos e índices.
-- La app (SPEC 13) consume todo esto; esta migración no toca código.

-- Enum con los 7 tipos del modal "Nueva publicación" (SPEC 06). 'mood' = Ánimo:
-- el schema de referencia tenía 6 y le faltaba; la UI manda.
CREATE TYPE post_type AS ENUM (
  'meal', 'nap', 'activity', 'achievement', 'mood', 'photo', 'announcement'
);

-- Tabla posts. Convención de audiencia (no mezcla tipo con audiencia):
--   sala   → room_id poblado y CERO filas en post_children (el type es libre)
--   kids   → room_id NULL y una o más filas en post_children
-- title guarda un snapshot del título de audiencia calculado al insertar
-- ("Mateo", "Varios niños", "Toda la sala"), para que renombrar un niño no
-- reescriba posts viejos.
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

-- Niños etiquetados en un post: es la clave para el feed filtrado por familia
-- (spec futura del parent feed).
CREATE TABLE post_children (
  post_id uuid NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, child_id)
);

ALTER TABLE post_children ENABLE ROW LEVEL SECURITY;

-- Fotos adjuntas. url guarda la ruta pública dentro del bucket post-photos
-- (la URL canónica se arma con la base pública del proyecto en la app).
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

-- users.room_id: el staff pertenece a una guardería y a una sala. Sin esto,
-- "Toda la sala" no tiene room_id al que apuntar (SPEC 12 / grill).
ALTER TABLE users
  ADD COLUMN room_id uuid REFERENCES rooms(id) ON DELETE SET NULL;

-- Backfill: cada usuario con guardería queda en la sala "Soles" de SU daycare.
UPDATE users u
SET room_id = r.id
FROM rooms r
WHERE r.daycare_id = u.daycare_id
  AND r.name = 'Soles'
  AND u.room_id IS NULL;

-- Bucket público de fotos de publicaciones. Lectura vía URL canónica (bucket
-- public); escritura/borrado solo vía policies de storage.objects de abajo.
INSERT INTO storage.buckets (id, name, public)
VALUES ('post-photos', 'post-photos', true)
ON CONFLICT (id) DO NOTHING;

-- RLS posts: lectura para usuarios autenticados de la misma guardería
-- (visibilidad a nivel guardería; el filtro por familia llega con el parent
-- feed en su propia spec).
CREATE POLICY "posts_read_own_daycare" ON public.posts
  FOR SELECT TO authenticated
  USING (
    author_id IN (
      SELECT u.id FROM public.users u
      WHERE u.daycare_id = (SELECT private.current_user_daycare_id())
    )
  );

-- RLS posts: insert solo staff/admin, author propio y sala de la propia
-- guardería (room_id NULL = audiencia por niños, siempre permitido).
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

-- Sin políticas UPDATE ni DELETE en posts: default-deny hasta la spec de
-- editar/eliminar publicación.

-- RLS post_children: lectura si el post es visible (mismo daycare vía autor).
CREATE POLICY "post_children_read_own_daycare" ON public.post_children
  FOR SELECT TO authenticated
  USING (
    post_id IN (
      SELECT p.id FROM public.posts p
      JOIN public.users u ON u.id = p.author_id
      WHERE u.daycare_id = (SELECT private.current_user_daycare_id())
    )
  );

-- RLS post_children: escritura solo staff/admin sobre posts propios.
CREATE POLICY "post_children_author_insert" ON public.post_children
  FOR INSERT TO authenticated
  WITH CHECK (
    (SELECT private.current_user_role()) IN ('staff', 'admin')
    AND post_id IN (
      SELECT p.id FROM public.posts p WHERE p.author_id = (SELECT auth.uid())
    )
  );

-- RLS post_photos: mismas reglas que post_children.
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
    AND post_id IN (
      SELECT p.id FROM public.posts p WHERE p.author_id = (SELECT auth.uid())
    )
  );

-- storage.objects (bucket post-photos). Path convención:
-- {daycare_id}/{user_id}/{uuid}.{ext}. El primer nivel acota por guardería;
-- el segundo ata cada archivo al usuario que lo subió, lo que hace simples
-- las políticas de insert y delete (y el cleanup best-effort de SPEC 13).
CREATE POLICY "post_photos_insert_own_path" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'post-photos'
    AND (SELECT private.current_user_role()) IN ('staff', 'admin')
    AND (storage.foldername(name))[1] = (SELECT private.current_user_daycare_id())::text
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  );

CREATE POLICY "post_photos_delete_own_path" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'post-photos'
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  );

-- Índices para los accesos previstos: feed por fecha, joins de audiencia y
-- fotos, y autoría (visibilidad RLS y "Editar" solo propio).
CREATE INDEX idx_posts_published_at ON public.posts (published_at DESC);
CREATE INDEX idx_posts_author_id ON public.posts (author_id);
CREATE INDEX idx_post_children_child_id ON public.post_children (child_id);
CREATE INDEX idx_post_photos_post_id ON public.post_photos (post_id);
