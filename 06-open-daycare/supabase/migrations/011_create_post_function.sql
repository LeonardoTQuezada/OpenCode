-- SPEC 13: create_post — insert transaccional de posts + post_children +
-- post_photos en una sola función. PostgREST no transacciona varias tablas en
-- llamadas separadas y `posts` no tiene política DELETE (SPEC 12), así que sin
-- esto un fallo a mitad de camino dejaría un post visible sin sus fotos.
-- SECURITY INVOKER: se ejecuta con los privilegios del usuario, por lo que
-- siguen aplicando las policies de las 3 tablas tal cual (autor propio,
-- rol staff/admin y sala de la propia guardería).

CREATE OR REPLACE FUNCTION public.create_post(
  p_type public.post_type,
  p_body text,
  p_title text,
  p_room_id uuid,
  p_child_ids uuid[] DEFAULT '{}',
  p_photos jsonb DEFAULT '[]'::jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public, pg_temp
AS $$
declare
  v_author_id uuid := auth.uid();
  v_daycare_id uuid;
  v_post_id uuid;
  v_photos jsonb := coalesce(p_photos, '[]'::jsonb);
begin
  if v_author_id is null then
    raise exception 'no_session';
  end if;

  if p_body is null or length(trim(p_body)) = 0 then
    raise exception 'empty_body';
  end if;

  -- Misma regla que la action: hasta 10 fotos por publicación.
  if jsonb_typeof(v_photos) <> 'array' or jsonb_array_length(v_photos) > 10 then
    raise exception 'too_many_photos';
  end if;

  select u.daycare_id into v_daycare_id
  from public.users u
  where u.id = v_author_id;

  -- Convención de audiencia (SPEC 12): sala → room_id y CERO hijos;
  -- niños → room_id NULL y una o más filas en post_children.
  if p_room_id is null then
    if coalesce(array_length(p_child_ids, 1), 0) = 0 then
      raise exception 'no_children';
    end if;

    -- Cada niño etiquetado debe ser de la guardería del autor. Las policies
    -- de post_children no lo chequean (solo que el post sea del autor), así
    -- que este guard impide etiquetar ids de otras guarderías.
    if exists (
      select 1
      from unnest(p_child_ids) as t(child_id)
      left join public.children c on c.id = t.child_id
      left join public.rooms r on r.id = c.room_id
      where c.id is null
         or r.daycare_id is distinct from v_daycare_id
    ) then
      raise exception 'child_out_of_daycare';
    end if;
  end if;

  insert into public.posts (author_id, room_id, type, title, body)
  values (
    v_author_id,
    p_room_id,
    p_type,
    nullif(trim(coalesce(p_title, '')), ''),
    trim(p_body)
  )
  returning id into v_post_id;

  if p_room_id is null then
    insert into public.post_children (post_id, child_id)
    select v_post_id, t.child_id
    from unnest(p_child_ids) as t(child_id)
    on conflict do nothing;
  end if;

  insert into public.post_photos (post_id, url, width, height, position)
  select
    v_post_id,
    nullif(p.photo ->> 'url', ''),
    (p.photo ->> 'width')::int,
    (p.photo ->> 'height')::int,
    (p.photo ->> 'position')::int
  from jsonb_array_elements(v_photos) as p(photo)
  where nullif(p.photo ->> 'url', '') is not null;

  return v_post_id;
end;
$$;

-- Los grants persisten tras CREATE OR REPLACE; se reitera por claridad.
REVOKE EXECUTE ON FUNCTION public.create_post(public.post_type, text, text, uuid, uuid[], jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_post(public.post_type, text, text, uuid, uuid[], jsonb) TO authenticated;
