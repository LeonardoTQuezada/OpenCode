-- SPEC 08: enums, tabla users con RLS, trigger de auth.users

-- Enums
CREATE TYPE user_role AS ENUM ('staff', 'parent', 'admin');
CREATE TYPE user_status AS ENUM ('pending', 'active');

-- Tabla users
CREATE TABLE users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  daycare_id uuid REFERENCES daycares(id),
  role user_role NOT NULL,
  status user_status NOT NULL DEFAULT 'active',
  full_name text NOT NULL,
  avatar_url text,
  notify_on_post boolean NOT NULL DEFAULT true,
  daily_summary_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Lectura: usuarios autenticados pueden ver usuarios de su misma guardería
CREATE POLICY "users_read_own_daycare" ON users
  FOR SELECT
  USING (
    auth.uid() IN (
      SELECT u.id FROM users u WHERE u.daycare_id = users.daycare_id
    )
  );

-- Escritura: solo staff y admin pueden insertar
CREATE POLICY "users_staff_insert" ON users
  FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT u.id FROM users u WHERE u.id = auth.uid() AND u.role IN ('staff', 'admin')
    )
  );

-- Actualización: staff y admin pueden actualizar
CREATE POLICY "users_staff_update" ON users
  FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT u.id FROM users u WHERE u.id = auth.uid() AND u.role IN ('staff', 'admin')
    )
  );

-- Eliminación: solo admin puede eliminar
CREATE POLICY "users_admin_delete" ON users
  FOR DELETE
  USING (
    auth.uid() IN (
      SELECT u.id FROM users u WHERE u.id = auth.uid() AND u.role = 'admin'
    )
  );

-- Trigger: al crear un usuario en auth.users se crea su fila en users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.users (id, daycare_id, role, full_name, status)
  VALUES (
    NEW.id,
    (NEW.raw_user_meta_data->>'daycare_id')::uuid,
    (NEW.raw_user_meta_data->>'role')::user_role,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'status')::user_status, 'active')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
