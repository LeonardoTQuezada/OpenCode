-- Cambia el rol de Edwin Tinitana de 'staff' a 'admin' para que la tarjeta
-- del sidebar muestre "Administrador". Migración de datos (seed), no de esquema.

UPDATE public.users
SET role = 'admin',
    updated_at = now()
WHERE id = (SELECT id FROM auth.users WHERE lower(email) = 'edwintinitana@gmail.com');
