-- SPEC 11: enum invitation_status, tablas invitations y parent_children con RLS.
-- Además de las políticas de la spec, incluye las de activación: la validación
-- del código corre sin sesión (visitante de /activate-account) y la inserción
-- del vínculo + aceptación corren con la sesión del padre recién creado
-- (rol parent), no como staff/admin. La RPC validate_invitation es la única
-- ventana de lectura pre-auth y devuelve solo campos no sensibles.

-- Enum
CREATE TYPE invitation_status AS ENUM ('pending', 'accepted', 'expired', 'cancelled');

-- Tabla invitations
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

-- Tabla parent_children
CREATE TABLE parent_children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  relationship relationship_type NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (parent_id, child_id)
);

ALTER TABLE parent_children ENABLE ROW LEVEL SECURITY;

-- Índices para las consultas por FK (el UNIQUE de code ya indexa esa columna)
CREATE INDEX idx_invitations_child_id ON invitations (child_id);
CREATE INDEX idx_invitations_email ON invitations (email);
CREATE INDEX idx_parent_children_parent_id ON parent_children (parent_id);
CREATE INDEX idx_parent_children_child_id ON parent_children (child_id);

-- RLS invitations: lectura para usuarios de la misma guardería (vía child)
CREATE POLICY "invitations_read_own_daycare" ON invitations
  FOR SELECT TO authenticated
  USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN rooms r ON r.id = c.room_id
      WHERE r.daycare_id = (SELECT private.current_user_daycare_id())
    )
  );

-- RLS invitations: escritura solo staff/admin
CREATE POLICY "invitations_staff_write" ON invitations
  FOR ALL TO authenticated
  USING ((SELECT private.current_user_role()) IN ('staff', 'admin'))
  WITH CHECK ((SELECT private.current_user_role()) IN ('staff', 'admin'));

-- RLS invitations: el padre invitado acepta su propia invitación (activación).
-- Solo la transición pending → accepted y solo si el email del JWT coincide.
CREATE POLICY "invitations_parent_accept" ON invitations
  FOR UPDATE TO authenticated
  USING (email = (SELECT auth.email()) AND status = 'pending')
  WITH CHECK (email = (SELECT auth.email()) AND status = 'accepted');

-- RLS parent_children: lectura para usuarios de la misma guardería (vía child)
CREATE POLICY "parent_children_read_own_daycare" ON parent_children
  FOR SELECT TO authenticated
  USING (
    child_id IN (
      SELECT c.id FROM children c
      JOIN rooms r ON r.id = c.room_id
      WHERE r.daycare_id = (SELECT private.current_user_daycare_id())
    )
  );

-- RLS parent_children: el padre puede ver sus propios vínculos
CREATE POLICY "parent_children_read_own" ON parent_children
  FOR SELECT TO authenticated
  USING (parent_id = (SELECT auth.uid()));

-- RLS parent_children: escritura solo staff/admin
CREATE POLICY "parent_children_staff_write" ON parent_children
  FOR ALL TO authenticated
  USING ((SELECT private.current_user_role()) IN ('staff', 'admin'))
  WITH CHECK ((SELECT private.current_user_role()) IN ('staff', 'admin'));

-- RLS parent_children: el padre recién activado se inserta su propio vínculo.
-- El child debe pertenecer a su guardería (defensa en profundidad).
CREATE POLICY "parent_children_parent_self_insert" ON parent_children
  FOR INSERT TO authenticated
  WITH CHECK (
    parent_id = (SELECT auth.uid())
    AND child_id IN (
      SELECT c.id FROM children c
      JOIN rooms r ON r.id = c.room_id
      WHERE r.daycare_id = (SELECT private.current_user_daycare_id())
    )
  );

-- RPC de validación pre-auth: devuelve datos limitados de una invitación
-- pending y vigente. Es la única ventana de lectura para anon (el padre aún
-- no tiene cuenta al validar el código); no expone la tabla completa.
CREATE OR REPLACE FUNCTION public.validate_invitation(p_code text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'status', i.status,
    'email', i.email,
    'full_name', i.full_name,
    'relationship', i.relationship,
    'expires_at', i.expires_at,
    'child_name', c.full_name,
    'room_name', r.name,
    'invited_by_name', u.full_name
  )
  FROM invitations i
  JOIN children c ON c.id = i.child_id
  JOIN rooms r ON r.id = c.room_id
  JOIN users u ON u.id = i.invited_by
  WHERE i.code = upper(trim(p_code))
    AND i.status = 'pending'
    AND i.expires_at > now();
$$;

-- EXECUTE es PUBLIC por defecto; se restringe explícitamente a los roles que
-- lo necesitan (visitante anónimo de /activate-account y usuarios logueados).
REVOKE EXECUTE ON FUNCTION public.validate_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_invitation(text) TO anon, authenticated;
