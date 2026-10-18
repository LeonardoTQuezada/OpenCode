-- SPEC 11 (iteración): validate_invitation ahora devuelve id, child_id y
-- daycare_id además de los datos de presentación. El server action
-- activateInvitation necesita child_id (insertar el vínculo parent_children),
-- id (marcar la invitación como accepted) y daycare_id (metadata del trigger
-- handle_new_user, que crea la fila users con rol parent).

CREATE OR REPLACE FUNCTION public.validate_invitation(p_code text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', i.id,
    'status', i.status,
    'email', i.email,
    'full_name', i.full_name,
    'relationship', i.relationship,
    'expires_at', i.expires_at,
    'child_id', i.child_id,
    'child_name', c.full_name,
    'room_name', r.name,
    'daycare_id', r.daycare_id,
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

-- Los grants persisten tras CREATE OR REPLACE; se reitera por claridad.
REVOKE EXECUTE ON FUNCTION public.validate_invitation(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_invitation(text) TO anon, authenticated;
