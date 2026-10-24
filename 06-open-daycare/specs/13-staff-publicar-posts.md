# SPEC 13 — Publicar posts reales desde el staff y feed desde la BD

> **Estado:** Aprobado
> **Depende de:** SPEC 06 (modal nueva publicación), SPEC 09 (login real), SPEC 10 (children reales), SPEC 12 (posts tables + bucket)
> **Fecha:** 2026-10-23
> **Objetivo:** Que el modal "Nueva publicación" persista posts reales del staff en Supabase —con fotos en Storage o sin ellas— y que el feed lea los posts de hoy desde la BD con carga paginada de días anteriores.

## Por qué existe esta spec

SPEC 06 construyó el modal completo pero lo dejó en memoria: los posts mueren al recargar, las fotos son object URLs que mueren con la pestaña, y "publicado por vos" está hardcodeado. SPEC 12 ya creó las tablas, el bucket y `users.room_id`. Además, el código ya dio dos pasos que esta spec aprovecha en vez de recrear: los chips del modal ya leen `children` reales (`lib/feed-kids.ts`) y el sidebar ya muestra el usuario real de la sesión (`user-profile-provider.tsx`). Lo que sigue mintiendo es el feed: "Buenas, Caro", "12 niños · martes 17 jun", el avatar "C" del composer, los 3 posts semilla y los contadores inventados.

## Scope

**In:**

- Server Action `createPostAction` en `app/_actions/posts.ts`: valida destinatarios, tipo, descripción y límites de fotos; sube las fotos a `post-photos/{daycare}/{user}/…`; inserta `posts` + `post_children` + `post_photos`; si el insert falla, borra los archivos subidos (best-effort) y devuelve error. Nunca queda un post visible sin sus fotos.
- Límites de fotos validados en cliente y en la action: máximo 10 por post, máximo 5 MB por archivo, formatos `image/jpeg`, `image/png`, `image/webp`.
- Mapa `PostType` de la UI ↔ `post_type` de la BD (7 pares, incluido `ÁNIMO`↔`mood`).
- El modal pasa de `onPublish` en memoria a la action: botón "Publicando…" deshabilitado mientras dura, errores en rojo `#C5503A` en voseo bajo el bloque correspondiente, y al éxito cierra el modal y hace `router.refresh()`.
- `lib/feed-posts.ts` (solo servidor): `getTodayPosts()` (posts con `published_at` de hoy, orden desc) y `getOlderPosts(before, limit)` (lotes de 10 más viejos que el cursor), ambos con autor, fotos, hijos etiquetados y `isOwn` calculado contra la sesión.
- El feed (`app/page.tsx` → `components/feed-screen.tsx`) pasa a servidor/con props: lee los posts de hoy desde la BD; el provider ya no guarda posts.
- Tarjetas con datos reales: fotos desde URLs públicas del bucket, "HH:MM · publicado por vos" si el autor es la sesión o "HH:MM · publicado por {nombre}" si es otro staff, contadores siempre 0/0, y "Editar" visible solo en posts propios (sigue inerte).
- "Ver más posts" al final del feed: carga lotes de 10 posts más viejos que hoy, cada lote aparece bajo su separador de día ("PUBLICADO AYER", "PUBLICADO EL 17 JUN"); estado "Cargando…" mientras; el link desaparece cuando no quedan más.
- Estado vacío: si no hay posts de hoy, debajo del separador "PUBLICADO HOY" se muestra "Todavía no hay publicaciones. Compartí el primer momento del día."
- Header del feed conectado: "Buenas, {nombre real}" vía `UserProfileProvider`, "{n} niños · {fecha real}" (`kids.length` del provider + fecha en formato "martes 17 jun"), y el avatar del composer con la inicial real.
- La action rechaza "Toda la sala" cuando el usuario no tiene `room_id` asignado.
- `SEED_POSTS`, `createPost()` de memoria y el estado `posts`/`addPost` del provider se eliminan.
- `npm run lint` y `npm run build` en verde, capturas Playwright en `.playwright-mcp/`.

**Fuera de alcance (specs futuras):**

- Editar o eliminar publicaciones: "Editar" sigue siendo un botón sin acción, ahora solo visible en posts propios.
- Likes y comentarios reales (`reactions` / `comments`): los contadores quedan en 0/0.
- Realtime de Supabase: tras publicar alcanza con `router.refresh()`.
- Feed de la familia (`/family-feed`) y reglas de visibilidad por padre: el RLS actual es a nivel guardería.
- Filtrar los chips del modal por sala: siguen siendo los `children` activos de toda la guardería (comportamiento actual de `lib/feed-kids.ts`).
- Comprimir o redimensionar imágenes antes de subir.
- El eyebrow "GUARDERÍA · SALA SOLES" y el subtítulo "Sala Soles" del logo quedan hardcodeados.
- Foto de perfil de usuario y foto por niño (`photo_consent` sigue sin consumirse).
- Notificaciones al publicar (`notify_on_post`).
- Sembrar posts de demostración: el feed arranca vacío por decisión de SPEC 12.

## Data model

No hay tablas nuevas (SPEC 12). Lo nuevo es el shape de lectura del feed y el resultado de la action:

```ts
// lib/feed-posts.ts — solo servidor
export type FeedPost = {
  id: string;
  type: PostType; // tipo de la UI, ya mapeado desde la BD
  title: string; // snapshot de la BD ("Mateo" / "Varios niños" / "Toda la sala")
  // Avatar calculado al leer: paleta del niño (por child.id, igual que los
  // chips del modal) o colores de anuncio con label vacío para el megáfono.
  avatarBg: string;
  avatarInk: string;
  avatarLabel: string; // "" = ícono de megáfono ("Toda la sala")
  authorFirstName: string;
  isOwn: boolean; // author_id === sesión actual
  time: string; // "14:20"
  audience: string; // "Para: familia de Mateo" / "Para: toda la sala"
  body: string;
  photos: { src: string; width: number | null; height: number | null }[];
  likes: number; // siempre 0 hasta la spec de reacciones
  comments: number; // siempre 0
};

export async function getTodayPosts(viewerId: string): Promise<FeedPost[]>;
export async function getOlderPosts(
  viewerId: string,
  before: string, // ISO del inicio del día más viejo ya cargado
  limit: number, // 10
): Promise<FeedPost[]>;
```

```ts
// app/_actions/posts.ts ("use server")
export type CreatePostResult =
  | { ok: true }
  | { ok: false; message: string };
```

Mensajes de validación (rojo `#C5503A`, voseo):

- PARA vacío → "Elegí al menos un destinatario."
- TIPO sin marcar → "Elegí un tipo de publicación."
- DESCRIPCIÓN vacía → "Escribí qué querés contar."
- Más de 10 fotos → "Subí hasta 10 fotos."
- Archivo de más de 5 MB → "Cada foto puede pesar hasta 5 MB."
- Formato no soportado → "Usá archivos JPG, PNG o WEBP."
- "Toda la sala" sin `room_id` en el usuario → "No tenés una sala asignada. Hablá con el administrador."
- Error inesperado de Storage o BD → "No se pudo publicar. Intentá de nuevo."

Convenciones:

- El mapeo de tipos vive en `lib/posts.ts`: `BD_TYPE_BY_UI: Record<PostType, post_type>` y el mapa inverso; los colores de badge y pastillas no cambian.
- El separador de día de un lote viejo: "PUBLICADO AYER" para ayer; "PUBLICADO EL {d} {MON}" con mes corto en español en mayúsculas para todo lo demás.
- La fecha del header: weekday en español minúscula, día y mes corto ("martes 17 jun"), generada con `Intl.DateTimeFormat("es-ES")`.
- El título de audienceLabel/postTitle se calcula en el server al leer, usando los `children` etiquetados y `room_id`; el `title` de la BD manda cuando existe.
- El `FeedPost` lleva el avatar calculado en el server (`avatarBg`/`avatarInk`/`avatarLabel`): paleta del primer niño por `child.id` (mismo color que su chip en el modal) o megáfono con colores de anuncio para "Toda la sala". Sin estos campos el card no podría reproducir el avatar de memoria.
- Los hijos etiquetados se resuelven con los `children` visibles (RLS) del post; si un hijo quedó archivado, el nombre igual se muestra (viene del join).
- `router.refresh()` tras el éxito: revalida el Server Component del feed sin realtime.
- La limpieza de archivos ante fallo de insert usa el cliente de Storage del server y continúa con el mejor esfuerzo: si el delete falla, se loguea el error y se devuelve el mensaje genérico igual.

## Implementation plan

1. `lib/posts.ts`: agregar el mapa UI↔enum y las constantes `MAX_PHOTOS = 10` y `MAX_PHOTO_BYTES = 5 * 1024 * 1024`. Los helpers de memoria (`createPost`, `SEED_POSTS`) siguen compilando todavía. Regresión: nada cambia en la UI.
2. `app/_actions/posts.ts`: `createPostAction(formData)` con validación de los 3 bloques + límites de fotos, subida a `post-photos` con path `{daycare}/{user}/{uuid}`, insert transaccional (`posts` + `post_children` + `post_photos`) y cleanup best-effort ante fallo. Compila sin estar conectada.
3. `lib/feed-posts.ts`: `getTodayPosts` y `getOlderPosts` con el mapeo a `FeedPost`. Compila sin consumirse.
4. `app/page.tsx` (server) + `components/feed-screen.tsx`: el page lee `getTodayPosts` y las pasa como props; el header usa el perfil real y la fecha real; estado vacío bajo "PUBLICADO HOY". Verificar `/` renderiza sin posts y con un post sembrado a mano por SQL.
5. `components/posts-provider.tsx`: elimina `posts`, `addPost` y el estado de posts; queda `composerOpen` + `kids` + montaje del modal. Verificar apertura del modal desde sidebar y composer.
6. `components/create-post-modal.tsx`: las fotos se guardan como `File[]` (object URL solo para la miniatura, con `revokeObjectURL` al quitar); al publicar arma el `FormData` y llama a la action con estado "Publicando…"; al éxito cierra y refresca. Verificar publicar con 0, 1 y 3 fotos.
7. `components/post-card.tsx`: acepta `FeedPost`; "publicado por vos" / "publicado por {nombre}"; fotos reales (1 → caja 200px, 2+ → grilla 2 columnas, igual que hoy); "Editar" solo si `isOwn`. Verificar tarjeta propia y tarjeta de otro autor.
8. "Ver más posts": componente cliente al final del feed que llama a `getOlderPosts` vía Server Action de solo lectura (o route handler interno), apenda lotes con su separador de día y oculta el link al agotarse. Verificar con 25 posts sembrados por SQL: carga 10 + 10 y termina.
9. Limpieza: eliminar `SEED_POSTS`, `createPost` de memoria y cualquier referencia; el modal ya no recibe `onPublish`. Verificar que el build no arrastra código muerto.
10. Verificación final: `npm run lint`, `npm run build`, capturas Playwright (modal con errores, "Publicando…", feed vacío, feed con posts propios y ajenos, "Ver más" con lotes, <768px) y regresión de `/kids`, `/kids/[id]` y `/login`.

## Acceptance criteria

- [ ] `npm run dev` sirve `/` sin errores en consola.
- [ ] Con PARA, TIPO y DESCRIPCIÓN válidos y sin fotos, "Publicar" crea una fila en `posts` con `author_id` de la sesión y el post aparece como primera tarjeta del feed.
- [ ] El post publicado sobrevive a recargar `/` (lee de la BD, no de memoria).
- [ ] Con 3 fotos se crean 3 filas en `post_photos` con `position` 0, 1, 2 y los archivos existen en el bucket con path `{daycare_id}/{user_id}/…`.
- [ ] Publicando sin seleccionar destinatarios no crea la fila y muestra "Elegí al menos un destinatario."
- [ ] Sin TIPO muestra "Elegí un tipo de publicación."; sin DESCRIPCIÓN muestra "Escribí qué querés contar."
- [ ] Elegir 11 fotos no publica y muestra "Subí hasta 10 fotos."
- [ ] Un archivo de 6 MB no publica y muestra "Cada foto puede pesar hasta 5 MB."
- [ ] Un archivo `.gif` no publica y muestra "Usá archivos JPG, PNG o WEBP."
- [ ] Elegir "Toda la sala" crea el post con `room_id` = sala del staff y cero filas en `post_children`.
- [ ] Elegir 2 niños crea exactamente 2 filas en `post_children` con sus ids y `room_id` NULL.
- [ ] Con "Toda la sala" y un usuario sin sala asignada, la action rechaza con "No tenés una sala asignada. Hablá con el administrador."
- [ ] Si el insert en BD falla, no queda el post y los archivos subidos se eliminan del bucket (mejor esfuerzo verificable en el código de la action).
- [ ] Mientras la publicación está en curso, el botón dice "Publicando…" y está deshabilitado.
- [ ] Al éxito el modal se cierra, el feed muestra el post nuevo y el form reabre vacío.
- [ ] El feed vacío muestra "Todavía no hay publicaciones. Compartí el primer momento del día." bajo PUBLICADO HOY.
- [ ] La tarjeta propia muestra "HH:MM · publicado por vos"; una tarjeta de otro autor muestra "HH:MM · publicado por {nombre}".
- [ ] Todos los posts muestran 0 likes y 0 comentarios.
- [ ] "Editar" no aparece en tarjetas ajenas; en las propias aparece pero no ejecuta nada.
- [ ] Con posts de hoy y de ayer sembrados por SQL, el feed inicial muestra solo los de hoy; "Ver más posts" carga los de ayer bajo "PUBLICADO AYER".
- [ ] Cada clic de "Ver más" carga como máximo 10 posts y muestra "Cargando…" mientras.
- [ ] Sin más posts viejos, el link "Ver más posts" desaparece.
- [ ] El header muestra "Buenas, {nombre real de la sesión}" y "{n} niños · {fecha real}".
- [ ] El avatar del composer muestra la inicial del usuario real.
- [ ] El eyebrow "GUARDERÍA · SALA SOLES" y el sidebar se ven igual que antes (regresión).
- [ ] `/kids`, `/kids/[id]` y `/login` se ven y responden igual que antes (regresión SPEC 09/10).
- [ ] `npm run lint` y `npm run build` terminan sin errores.
- [ ] Las capturas quedan guardadas en `.playwright-mcp/`.

## Decisions

- **Sí:** escritura **y** lectura en la misma spec — decisión del usuario en el grill. Se descartó "solo escritura" (dos fuentes de verdad compitiendo: el post existiría en la BD sin verse tras recargar) y "solo imágenes a Storage".
- **Sí:** PARA sigue leyendo los `children` reales activos de la guardería — ya era el comportamiento post-SPEC 10 y el grill lo confirmó. Se descartó sembrar los 8 niños de `kids.json` (que ya ni existe en el repo) y se descartó filtrar chips por sala: se mantiene guardería-wide, coherente con el RLS actual.
- **Sí:** `mood` en el enum de la BD en lugar de quitar Ánimo del modal — la UI manda (SPEC 12 lo implementa).
- **Sí:** audiencia sala = `room_id` + cero `post_children`, con tipo libre ("Toda la sala" + "Comida" es válido).
- **Sí:** `users.room_id` con backfill Soles — "Toda la sala" se resuelve contra la sala del staff que publica. Se descartó asumir la sala en la app y el picker de sala en el modal.
- **Sí:** el feed arranca vacío, sin seeds — decisión del usuario en el grill. Se descartó sembrar los 3 posts mock y la variante con reactions/comments para conservar los contadores inventados. Consecuencia aceptada: el conteo del header dirá "1 niños" con el único child real, y el placeholder dashed de témperas muere.
- **Sí:** contadores 0/0 en todas las tarjetas — decisión del usuario. Se descartó ocultar los contadores (rompería el diseño de SPEC 01).
- **Sí:** límites de 10 fotos y 5 MB por archivo, formatos JPG/PNG/WEBP, validados en cliente y en la action — decisión del usuario. Se descartó el "sin límite" actual (posts de 100 MB y timeouts) y "solo 1 foto" (rompe el modal y la grilla de SPEC 06).
- **Sí:** upload primero e insert atómico en una transacción, con borrado best-effort de los archivos si el insert falla — decisión del usuario. Se descartó crear el post primero (quedaría visible a medias) y orquestar con Edge Function (despliegue y cold starts de más para un formulario).
- **Sí:** feed inicial = solo posts de hoy + "Ver más posts" con lotes de 10 bajo separador de día — decisión personalizada del usuario. Se descartó la lista plana (fechas sin contexto) y las secciones por día de carga eager.
- **Sí:** header con nombre, conteo de niños y fecha reales — decisión del usuario. Se descartó conectar solo el nombre (la mentira pegada al nombre real se nota más).
- **Sí:** "Editar" visible solo si sos el autor, y conectado el usuario real al sidebar/header — decisión del usuario. El sidebar ya estaba conectado (posterior a SPEC 09); esta spec completa el feed.
- **Sí:** autor ajeno se muestra como "publicado por {nombre}" — consecuencia inevitable de un feed multi-autor; "publicado por vos" queda solo para lo propio.
- **Sí:** `router.refresh()` tras publicar, sin Realtime. Se descartó suscribirse a cambios: innecesario con un solo cliente escribiendo.
- **Sí:** botón "Publicando…" — SPEC 06 lo descartó porque la escritura era síncrona; con upload + insert remotos ahora es obligatorio.
- **Sí:** mensajes de error en voseo y rojo `#C5503A`, un solo slot por bloque, siguiendo SPEC 06.
- **Sí:** el provider raíz deja de guardar posts y kids se queda solo para los chips y el conteo del header. Se descartó mover los chips al modal: el layout ya los resuelve y funciona en cualquier página.
- **No:** tocar el eyebrow "GUARDERÍA · SALA SOLES" ni el logo del sidebar: son marca hardcodeada; el nombre de usuario real ya se muestra en la tarjeta.
- **No:** filtrar "los míos" en el RLS de lectura: el feed es de la guardería (todos los staff ven los posts de todos); el filtro por familia es del feed de padres, spec futura.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| "Posts de hoy" depende de la timezone del servidor vs la del usuario | Filtro por día local del servidor por ahora; anotado como deuda para la spec del feed de la familia |
| El cleanup best-effort puede fallar y dejar archivos huérfanos en el bucket | Delete policy permite al dueño limpiar; una futura spec puede barrer huérfanos |
| Un staff de otra sala ve los posts de todos (RLS a nivel guardería) | Comportamiento deseado hoy: el feed es de la guardería; el aislamiento por familia llega con el RLS del parent feed |
| Subir varias fotos en serie alarga el "Publicando…" | Límite de 10 y 5 MB acotan el peor caso; no hay compresión (fuera de alcance) |
| El "Ver más" apilado crece sin tope en la sesión | 10 por lote y solo días anteriores al inicial; si duele, el tope va en la spec que lo retoque |
| Cambiar el feed a servidor puede alterar el render actual | `force-dynamic` ya está en el layout; criterios de regresión sobre `/kids` y `/login` |

## What is **not** in this spec

- Editar o eliminar publicaciones (el "Editar" propio sigue inerte).
- Likes, comentarios y contadores reales.
- Realtime y notificaciones.
- Feed de la familia y visibilidad por padre.
- Filtrar los chips del modal por sala.
- Compresión o redimensión de imágenes.
- Eyebrow y logo con datos reales de la sala.
- Posts de demostración sembrados.

Cada uno de esos, si llega, va en su propia spec.
