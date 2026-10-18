-- SPEC 10: enums, tablas rooms y children con RLS, seed de 3 rooms

-- Enums
CREATE TYPE child_status AS ENUM ('active', 'archived');
CREATE TYPE relationship_type AS ENUM ('father', 'mother', 'guardian');

-- Tabla rooms
CREATE TABLE rooms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  daycare_id uuid NOT NULL REFERENCES daycares(id),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (daycare_id, name)
);

ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;

-- Tabla children
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

-- Índice para las consultas children por sala
CREATE INDEX idx_children_room_id ON children (room_id);

-- RLS rooms: lectura para usuarios de la misma guardería
CREATE POLICY "rooms_read_own_daycare" ON rooms
  FOR SELECT TO authenticated
  USING (daycare_id = (SELECT private.current_user_daycare_id()));

-- RLS rooms: escritura solo staff/admin
CREATE POLICY "rooms_staff_write" ON rooms
  FOR ALL TO authenticated
  USING ((SELECT private.current_user_role()) IN ('staff', 'admin'))
  WITH CHECK ((SELECT private.current_user_role()) IN ('staff', 'admin'));

-- RLS children: lectura para usuarios de la misma guardería (vía room)
CREATE POLICY "children_read_own_daycare" ON children
  FOR SELECT TO authenticated
  USING (
    room_id IN (
      SELECT r.id FROM rooms r
      WHERE r.daycare_id = (SELECT private.current_user_daycare_id())
    )
  );

-- RLS children: escritura solo staff/admin
CREATE POLICY "children_staff_write" ON children
  FOR ALL TO authenticated
  USING ((SELECT private.current_user_role()) IN ('staff', 'admin'))
  WITH CHECK ((SELECT private.current_user_role()) IN ('staff', 'admin'));

-- Seed: 3 rooms para la guardería del usuario existente (sin children)
INSERT INTO rooms (daycare_id, name)
SELECT u.daycare_id, v.name
FROM users u
CROSS JOIN (VALUES ('Soles'), ('Estrellas'), ('Arcoíris')) AS v(name)
WHERE u.daycare_id IS NOT NULL
ON CONFLICT (daycare_id, name) DO NOTHING;
