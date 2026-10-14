-- SPEC 08 (corrección 2): mueve los helpers SECURITY DEFINER a un schema
-- no expuesto. Checklist Supabase: las funciones SECURITY DEFINER necesarias
-- para bypass de RLS deben vivir fuera del schema expuesto de la API (public),
-- para que no sean llamables vía /rest/v1/rpc por anon/authenticated.
-- (Advisor lints 0028/0029.)

CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated;

-- Devuelve la guardería del usuario actual (seguro: clavea por auth.uid())
CREATE OR REPLACE FUNCTION private.current_user_daycare_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.daycare_id FROM public.users u WHERE u.id = (SELECT auth.uid());
$$;

-- Devuelve el rol del usuario actual (seguro: clavea por auth.uid())
CREATE OR REPLACE FUNCTION private.current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.role FROM public.users u WHERE u.id = (SELECT auth.uid());
$$;

-- Recrear las políticas apuntando a private.* (primero se dropean para poder
-- dropear las funciones viejas de public sin dependencias)
DROP POLICY IF EXISTS "users_read_own_daycare" ON public.users;
CREATE POLICY "users_read_own_daycare" ON public.users
  FOR SELECT TO authenticated
  USING (daycare_id = (SELECT private.current_user_daycare_id()));

DROP POLICY IF EXISTS "users_staff_insert" ON public.users;
CREATE POLICY "users_staff_insert" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT private.current_user_role()) IN ('staff', 'admin'));

DROP POLICY IF EXISTS "users_staff_update" ON public.users;
CREATE POLICY "users_staff_update" ON public.users
  FOR UPDATE TO authenticated
  USING ((SELECT private.current_user_role()) IN ('staff', 'admin'))
  WITH CHECK ((SELECT private.current_user_role()) IN ('staff', 'admin'));

DROP POLICY IF EXISTS "users_admin_delete" ON public.users;
CREATE POLICY "users_admin_delete" ON public.users
  FOR DELETE TO authenticated
  USING ((SELECT private.current_user_role()) = 'admin');

-- Eliminar las copias en public (ya referenciadas por nadie)
DROP FUNCTION public.current_user_daycare_id();
DROP FUNCTION public.current_user_role();
