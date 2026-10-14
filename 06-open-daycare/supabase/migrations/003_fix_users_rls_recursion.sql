-- SPEC 08 (corrección): políticas RLS de users causaban 42P17
-- "infinite recursion detected in policy for relation users" porque las
-- políticas hacían subqueries sobre la misma tabla.
-- Fix oficial (docs Supabase): envolver el check en funciones SECURITY DEFINER
-- que leen users sin pasar por RLS, y usar TO authenticated + (select ...) para initPlan.

-- Devuelve la guardería del usuario actual (seguro: clavea por auth.uid())
CREATE OR REPLACE FUNCTION public.current_user_daycare_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.daycare_id FROM public.users u WHERE u.id = (SELECT auth.uid());
$$;

-- Devuelve el rol del usuario actual (seguro: clavea por auth.uid())
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT u.role FROM public.users u WHERE u.id = (SELECT auth.uid());
$$;

-- Lectura: usuarios autenticados pueden ver usuarios de su misma guardería
DROP POLICY IF EXISTS "users_read_own_daycare" ON public.users;
CREATE POLICY "users_read_own_daycare" ON public.users
  FOR SELECT TO authenticated
  USING (daycare_id = (SELECT public.current_user_daycare_id()));

-- Escritura: solo staff y admin pueden insertar
DROP POLICY IF EXISTS "users_staff_insert" ON public.users;
CREATE POLICY "users_staff_insert" ON public.users
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.current_user_role()) IN ('staff', 'admin'));

-- Actualización: staff y admin pueden actualizar
DROP POLICY IF EXISTS "users_staff_update" ON public.users;
CREATE POLICY "users_staff_update" ON public.users
  FOR UPDATE TO authenticated
  USING ((SELECT public.current_user_role()) IN ('staff', 'admin'))
  WITH CHECK ((SELECT public.current_user_role()) IN ('staff', 'admin'));

-- Eliminación: solo admin puede eliminar
DROP POLICY IF EXISTS "users_admin_delete" ON public.users;
CREATE POLICY "users_admin_delete" ON public.users
  FOR DELETE TO authenticated
  USING ((SELECT public.current_user_role()) = 'admin');
