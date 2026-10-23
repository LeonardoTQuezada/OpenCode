-- SPEC 12 (forward-fix, descubierto en el smoke test de la verificación):
-- storage.objects quedó con solo INSERT y DELETE. El upload() de storage-js
-- puede requerir que el row insertado sea visible vía SELECT/RETURNING para
-- devolver el resultado; con default-deny en SELECT hay uploads que fallan o
-- devuelven vacío. Se agrega SELECT limitado al path propio
-- ({daycare_id}/{user_id}/…): habilita el upload sin abrir lectura cruzada.
-- Las fotos se sirven igual por URL canónica (bucket público).

CREATE POLICY "post_photos_select_own_path" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'post-photos'
    AND (storage.foldername(name))[1] = (SELECT private.current_user_daycare_id())::text
    AND (storage.foldername(name))[2] = (SELECT auth.uid())::text
  );
