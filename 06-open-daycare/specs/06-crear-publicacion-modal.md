# SPEC 06 — Modal "Nueva publicación" en el feed

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 02, SPEC 04, SPEC 05
> **Fecha:** 2026-10-13
> **Objetivo:** Abrir un modal "Nueva publicación" desde el sidebar y el composer para crear un post con destinatarios múltiples (niños o toda la sala, mutuamente excluyentes), tipo, descripción y fotos, que se agrega en memoria arriba del feed.

## Por qué existe esta spec

SPEC 01 dejó el composer "Compartí un momento…" como enlace `href="#"` y SPEC 02 creó la ruta placeholder `/create-post` con el botón "Nueva publicación" del sidebar apuntando a ella, dejando explícito que "Publicar, editar o eliminar contenido desde `/create-post`" era fuera de alcance. Esta spec es esa spec futura, pero el formulario no vive en una ruta: vive en un modal, siguiendo el precedente de SPEC 04 y SPEC 05. Al hacerlo reemplaza dos criterios de SPEC 02: el que apuntaba "Nueva publicación" a `/create-post` y el que pedía que `/create-post` devuelva 200 con su `h1`. También reemplaza la decisión de SPEC 02 de no tocar el enlace del composer.

## Scope

**In:**

- Modal `components/create-post-modal.tsx` con el diseño de `references/pantallas/crear-publicacion.dc.html`: header "Cancelar" · "Nueva publicación" · "Publicar" y los bloques PARA, TIPO, DESCRIPCIÓN y FOTOS.
- Bloque PARA: selección múltiple con los chips de los 8 niños de `data/kids.json` más el chip "Toda la sala", que es exclusivo respecto del resto (tabla de interacción en Data model).
- Bloque TIPO: las 7 pastillas del mockup (Comida, Siesta, Actividad, Logro, Ánimo, Foto, Anuncio), selección única y obligatoria.
- DESCRIPCIÓN: textarea obligatoria con placeholder "Contá cómo le fue hoy…".
- FOTOS: opcional, múltiple; "Agregar" abre el selector de archivos (`accept="image/*"`, `multiple`) y cada foto se quita con una X.
- Validación por bloque con mensajes en voseo y rojo `#C5503A` bajo cada bloque.
- Apertura desde el botón "Nueva publicación" del sidebar (escritorio y drawer móvil) y desde el composer de `/`, funcionando en cualquier página.
- Estado global en `components/posts-provider.tsx`, montado en `app/layout.tsx`: posts, kids y el modal.
- Al publicar: el post nuevo aparece como primera tarjeta bajo "PUBLICADO HOY" y el modal se cierra y limpia; si la pantalla actual no es `/`, solo cierra sin navegar.
- Feed: `app/page.tsx` pasa a renderizar `components/feed-screen.tsx`, que lee los posts del provider; los 3 posts mock se siembran allí.
- `Post` gana `avatarInk` y `photos[]` (reemplaza a `photo`); el tipo `Badge` pasa a `PostType` de 7 variantes y se muda a `lib/posts.ts`.
- Tokens `@theme` en `app/globals.css` para los 4 pares de badge nuevos (Comida, Siesta, Ánimo, Foto) y para las pastillas del modal.
- Se elimina la ruta `app/create-post/`.
- Capturas Playwright en `.playwright-mcp/`.
- `npm run lint` y `npm run build` en verde.

**Fuera de alcance (specs futuras):**

- Persistencia de publicaciones (`data/posts.json` + Server Action): los posts publicados se pierden al recargar.
- Migración a base de datos: el estado en memoria se reemplaza en su propia spec; la BD destino está por definir.
- Editar o eliminar una publicación existente (el "Editar" de la tarjeta sigue inerte).
- Likes y comentarios reales (siguen siendo contadores estáticos).
- Ruta `/create-post` como página: se elimina, no se reemplaza.
- Feed de la familia (`/family-feed`), detalle de publicación y vista de foto.
- Subida real de imágenes a un servidor: las fotos viven como object URL en memoria.
- Validación de peso o formato de archivo más allá de `accept="image/*"`.
- Autenticación: "publicado por vos" sigue siendo texto fijo de Caro Giménez.
- Focus trap y programa completo de accesibilidad del modal.

## Data model

Todo vive en memoria: no hay persistencia nueva. `Post` y sus helpers se mudan de `components/post-card.tsx` a `lib/posts.ts`, porque ahora hay dos consumidores (modal y feed).

```ts
// lib/posts.ts — nuevo
export type PostType =
  | "COMIDA" | "SIESTA" | "ACTIVIDAD" | "LOGRO"
  | "ÁNIMO" | "FOTO" | "ANUNCIO";

export type PostPhoto = {
  src?: string;    // object URL de la foto elegida; ausente = placeholder del mockup
  label: string;   // "Foto · pintando con témperas" solo en los posts semilla
  height: number;  // 200
};

export type Post = {
  id: string;         // crypto.randomUUID()
  type: PostType;
  badgeBg: string;    // "bg-badge-logro-bg"
  badgeText: string;  // "text-badge-logro"
  avatarBg: string;
  avatarInk: string;  // nuevo: reemplaza a avatarTextClass(badge)
  avatarLabel: string;
  title: string;
  time: string;       // "14:20 · publicado por vos"
  audience: string;   // "Para: familia de Mateo"
  body: string;
  photos: PostPhoto[]; // nuevo: reemplaza a photo?: {...}
  likes: number;
  comments: number;
};

export type Audience =
  | { kind: "room" }                 // "Toda la sala"
  | { kind: "kids"; slugs: string[] }; // selección múltiple, sin "room"

export type NewPostInput = {
  audience: Audience;
  type: PostType;
  body: string;
  photos: PostPhoto[];
};

export const SEED_POSTS: Post[];   // los 3 posts actuales, textos y colores exactos
```

Helpers:

```ts
export function audienceLabel(a: Audience, kids: Kid[]): string;
// room → "Para: toda la sala"
// 1 niño → "Para: familia de Mateo"
// n niños → "Para: familia de Mateo, Sofía y Benjamín"

export function postTitle(a: Audience, kids: Kid[]): string;
// room → "Toda la sala" · 1 → "Mateo" · n → "Varios niños"

export function postAvatar(a: Audience, kids: Kid[]):
  { bg: string; ink: string; label: string; useMegaphone: boolean };
// room → bg-badge-anuncio-bg / text-badge-anuncio / "" / megáfono
// si no → avatar del primer niño (kid.avatarBg / kid.avatarInk / kid.initial)

export function createPost(input: NewPostInput, kids: Kid[], now: Date): Post;
// id, title, avatar, audience, time "HH:MM · publicado por vos", likes 0, comments 0
```

Tabla de interacción del bloque PARA (exclusión mutua en ambos sentidos):

| Estado actual | Clic en un chip de niño | Clic en "Toda la sala" |
| --- | --- | --- |
| Nada seleccionado | Selecciona ese niño; podés seguir agregando | Selecciona "Toda la sala"; los chips de niños quedan atenuados |
| 1 o más niños | Agrega o quita ese niño | Limpia los niños y deja solo "Toda la sala" |
| "Toda la sala" | Deselecciona "Toda la sala" y queda **solo** ese niño | Deselecciona "Toda la sala" (queda nada) |

Mientras "Toda la sala" está activa, los chips de niños se ven atenuados (`opacity-50`) y deseleccionados: no pueden convivir con ella.

Estado del modal y del provider:

```ts
// components/posts-provider.tsx ("use client")
type PostsContextValue = {
  posts: Post[];
  kids: Kid[];
  composerOpen: boolean;
  openComposer: () => void;
  closeComposer: () => void;
  addPost: (input: NewPostInput) => void; // llama a createPost y hace prepend
};
```

Mensajes de validación (rojo `#C5503A`, bajo el bloque):

- PARA vacío → "Elegí al menos un destinatario."
- TIPO sin marcar → "Elegí un tipo de publicación."
- DESCRIPCIÓN vacía → "Escribí qué querés contar."

Convenios:

- Los chips usan `kid.avatarBg` / `kid.avatarInk` del JSON y el mismo estilo de las pastillas del mockup: seleccionada `#3F362E` con texto blanco; sin seleccionar fondo `#FFFDF9`, borde `#ECE0D0`, texto `#6E6359`.
- Las fotos reales se guardan como `URL.createObjectURL(file)`; al quitarlas o al resetear el modal se llama a `URL.revokeObjectURL`.
- `SEED_POSTS` reproduce literalmente los 3 posts actuales: `photos: [{ label, height: 200 }]` solo en el de témperas (sin `src` → placeholder dashed).
- El badge del feed conserva el estilo claro (fondo + texto + punto); pares nuevos: Comida `#F3E9D0` / `#9A7B1E` (tinte derivado del sólido del mockup), Siesta `#E7DCF6` / `#7B5FC0`, Ánimo `#F9D2DE` / `#C56486`, Foto `#FBD8CC` / `#D9684A`. Logro, Actividad y Anuncio ya existen.
- El estado del modal (selección, campos, errores, fotos) vive en `create-post-modal.tsx` y se reinicia en cada apertura.
- `Post`, `PostPhoto` y `Audience` son objetos JSON serializables y no dependen de ningún ORM ni librería de persistencia, para que la BD destino que todavía no está definida no obligue a rediseñar el shape.

## Implementation plan

1. `lib/posts.ts`: tipos `PostType`, `PostPhoto`, `Post`, `Audience`, `NewPostInput`, `SEED_POSTS` y helpers `audienceLabel`, `postTitle`, `postAvatar`, `createPost`. Compila sin usarse todavía.
2. `app/globals.css`: tokens `@theme` de los 4 pares de badge nuevos y de las pastillas del modal. `/` se ve igual.
3. `components/post-card.tsx` + `app/page.tsx`: los tipos se importan de `lib/posts.ts`, el avatar usa `avatarInk`, `photo` pasa a `photos[]` (1 → caja de 200px, 2+ → grilla de 2 columnas) y el feed usa `SEED_POSTS`. Regresión: `/` idéntica a la de hoy.
4. `components/create-post-modal.tsx` (cliente): overlay + card `max-w-[580px]`, header ("Cancelar", "Nueva publicación", "Publicar"), los 4 bloques con la tabla de exclusión de PARA, validación, bloqueo de scroll, `role="dialog"` y cierre por Cancelar/Esc/fondo. Compila sin montar todavía.
5. `components/posts-provider.tsx` (cliente): estado con `SEED_POSTS`, `kids`, `composerOpen`, `openComposer`/`closeComposer`, `addPost`, y monta `<CreatePostModal />`.
6. `app/layout.tsx`: lee `readKids()` de `lib/data.ts`, exporta `dynamic = "force-dynamic"` y envuelve `children` en `<PostsProvider initialKids={kids}>`. Toda la app sigue viéndose igual.
7. `components/sidebar.tsx` pasa a cliente: el botón "Nueva publicación" deja de navegar y llama a `openComposer()`. Verificar apertura y cierre en `/` y en `/kids`, y con el drawer móvil.
8. `components/feed-screen.tsx` (cliente) + `app/page.tsx` (server): header, composer como botón que abre el modal, separador y `posts` del provider. Verificar que "Publicar" agrega la tarjeta arriba del feed.
9. Eliminar `app/create-post/` y comprobar que ningún archivo la referencia.
10. Verificación final: `npm run lint`, `npm run build`, capturas Playwright (`/` con modal abierto, con errores de validación, con "Toda la sala", con fotos, post publicado, <768px) y regresión de `/`, `/kids`, `/kids/mateo` y `/login`.

## Acceptance criteria

- [x] `npm run dev` sirve `/` sin errores en consola.
- [x] El botón "Nueva publicación" del sidebar ya no navega: la URL no cambia y el modal queda visible, en `/` y en `/kids`.
- [x] El composer "Compartí un momento…" abre el mismo modal.
- [x] El botón del drawer móvil (hamburguesa) también abre el modal.
- [x] El modal muestra el header "Cancelar" · "Nueva publicación" · "Publicar" y los labels "PARA", "TIPO", "DESCRIPCIÓN" y "FOTOS".
- [x] PARA lista los 8 niños de `data/kids.json` con sus colores y el chip "Toda la sala"; ninguno nace seleccionado.
- [x] Con un niño marcado se pueden marcar otros a la vez (selección múltiple).
- [x] Con "Toda la sala" marcada, los chips de niños quedan atenuados (`opacity-50`) y deseleccionados.
- [x] Con "Toda la sala" marcada, hacer clic en un niño la deselecciona y queda solo ese niño.
- [x] Con niños marcados, hacer clic en "Toda la sala" los limpia y deja solo "Toda la sala".
- [x] Hacer clic en "Toda la sala" estando marcada la desmarca (queda nada seleccionado).
- [x] TIPO lista exactamente 7 pastillas (Comida, Siesta, Actividad, Logro, Ánimo, Foto, Anuncio), ninguna nace marcada y solo admite una a la vez.
- [x] DESCRIPCIÓN nace vacía con placeholder "Contá cómo le fue hoy…".
- [x] Con los tres bloques vacíos, "Publicar" no publica y muestra los 3 mensajes en `#C5503A`.
- [x] Con TIPO marcado y el resto vacío, muestra solo los 2 mensajes restantes.
- [x] Con PARA, TIPO y DESCRIPCIÓN válidos, "Publicar" cierra el modal y agrega la tarjeta como primera debajo de "PUBLICADO HOY".
- [x] La tarjeta nueva muestra el badge del tipo elegido en estilo claro (fondo + texto + punto) con las 7 variantes.
- [x] La tarjeta nueva muestra "HH:MM · publicado por vos" con la hora actual, 0 likes y 0 comentarios.
- [x] La audiencia queda como "Para: familia de Mateo" con 1 niño, "Para: familia de Mateo, Sofía y Benjamín" con 3 y "Para: toda la sala" con el chip exclusivo.
- [x] El título/avatar queda "Mateo" con su avatar para 1 niño, "Varios niños" con el avatar del primero para varios, y "Toda la sala" con el avatar de megáfono para el chip exclusivo.
- [x] "Agregar" abre el selector de archivos y la foto elegida aparece como miniatura con una X.
- [x] Agregando 3 fotos y quitando la segunda quedan 2 fotos en el orden original.
- [x] Con 1 foto la tarjeta la muestra en caja de 200px a ancho completo; con 2 o más, en grilla de 2 columnas.
- [x] Publicar sin fotos es válido, y marcar TIPO "Foto" sin fotos también (sin validación cruzada).
- [x] "Cancelar" cierra sin publicar; la tecla Esc también; el clic en el fondo también, y en los tres casos sin confirmación.
- [x] Reabrir tras cerrar o tras publicar arranca vacío: nada en PARA, ningún TIPO, descripción vacía y sin fotos.
- [x] Mientras el modal está abierto, la página de fondo no hace scroll.
- [x] Al enfocar el textarea su borde pasa a `#F2A78E`.
- [x] En desktop el modal está centrado con ancho máximo 580px; por debajo de 768px ocupa casi todo el ancho.
- [x] Publicar desde `/kids` cierra el modal sin navegar; al volver a `/` el post nuevo está arriba del feed.
- [x] Recargar `/` descarta los posts publicados (la lista vuelve a los 3 semilla).
- [x] `/create-post` responde 404 y ningún archivo del proyecto la referencia.
- [x] `/`, `/kids`, `/kids/mateo` y `/login` se ven igual que antes (regresión SPEC 01–05).
- [x] `npm run lint` y `npm run build` terminan sin errores.
- [x] Las capturas quedan guardadas en `.playwright-mcp/`.

## Decisions

- **Sí:** modal en lugar de ruta, y se elimina `app/create-post/` (decisión del usuario). Reemplaza los dos criterios de SPEC 02 que la mencionaban.
- **Sí:** abre desde el sidebar y desde el composer, en todas las páginas (decisión del usuario). Se descartó limitarlo al feed: el botón vive en el sidebar compartido.
- **Sí:** exclusión mutua en ambos sentidos entre "Toda la sala" y los niños (decisión del usuario). Mientras el chip exclusivo está activo, los niños quedan atenuados y no pueden convivir con él.
- **Sí:** PARA arranca vacío, aunque el mockup muestra a Mateo seleccionado (precedente SPEC 04/05): así la validación de obligatoriedad es real.
- **Sí:** persistencia en memoria con `useState` (decisión del usuario). `data/posts.json` + Server Action queda para otra spec.
- **No:** rediseñar el modelo "listo para BD" ahora (`createdAt` ISO, `audience` estructurado, repositorio intercambiable) — decisión del usuario: la migración se encarga en su propia spec.
- **Sí:** modelo neutral JSON serializable, sin dependencias de un ORM (decisión del usuario; BD destino por definir).
- **Sí:** los chips salen de `data/kids.json`, leído en el layout raíz (decisión del usuario). Se descartó hardcodear los 3 del mockup.
- **Sí:** TIPO único y obligatorio, DESCRIPCIÓN obligatoria, FOTOS opcional (decisión del usuario).
- **Sí:** sin validación cruzada entre TIPO "Foto" y FOTOS (decisión del usuario).
- **Sí:** fotos múltiples con X para quitar, como object URL (decisión del usuario); se descartó una sola foto y la opción de no poder quitar.
- **Sí:** 1 foto → caja de 200px; 2 o más → grilla de 2 columnas (decisión del usuario).
- **Sí:** badge del feed en estilo claro con pares nuevos por tipo (decisión del usuario); se descartaron los colores sólidos del mockup porque romperían el estilo de los badges existentes.
- **Sí:** título/avatar: "Toda la sala" con megáfono, nombre del niño propio y "Varios niños" (decisión del usuario).
- **Sí:** el modal siempre arranca vacío al reabrir (decisión del usuario).
- **Sí:** publicar desde otra pantalla cierra sin navegar (decisión del usuario).
- **Sí:** `app/layout.tsx` exporta `dynamic = "force-dynamic"` porque lee `data/kids.json` y `cacheComponents` está desactivado en `next.config.ts`; mismo criterio que SPEC 05 aplicó en `app/kids/layout.tsx`.
- **Sí:** `Post`/`PostType` se mudan a `lib/posts.ts`: hay dos consumidores y los helpers de audiencia necesitan el tipo.
- **Sí:** el provider raíz guarda también los posts, no solo el estado del modal: así el post publicado desde `/kids` sigue vivo al navegar a `/`.
- **No:** estado "Enviando…" en "Publicar": no hay Server Action, la escritura es síncrona.
- **No:** focus trap ni accesibilidad completa; se queda `role="dialog"` y `aria-modal`, igual que SPEC 04 y 05.
- **No:** confirmación al cerrar con cambios sin publicar.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| `dynamic = "force-dynamic"` en el layout raíz vuelve dinámica a toda la app | Mismo criterio ya usado en `app/kids/layout.tsx`; criterio de regresión sobre `/login` y `/kids` |
| `sidebar.tsx` y `app/page.tsx` pasan a cliente y pueden alterar el render | Estilos sin cambios; criterios de regresión visual y de `npm run build` |
| Las object URLs de las fotos no se liberan | `URL.revokeObjectURL` al quitar la foto y al resetear el modal |
| Borrar `app/create-post/` deja en rojo dos criterios verdes de SPEC 02 | Esta spec deja constancia de que los reemplaza; criterio de "ningún archivo la referencia" |
| El avatar depende del niño y del tipo a la vez | `postAvatar` centraliza la decisión y tiene criterio propio por los 3 casos |
| Migración futura a BD: `time` está formateado para UI, `audience` es un string de presentación y las fotos son object URLs que mueren al recargar | Registrado en esta spec como deuda consciente: todo el estado vive en `posts-provider.tsx` y `lib/posts.ts` es puro (sin React), así que migrar significa tocar esa capa y volcar `SEED_POSTS`; la migración va en su propia spec |

## What is **not** in this spec

- Persistencia de publicaciones (`data/posts.json`): los posts se pierden al recargar.
- Migración a base de datos del estado en memoria.
- Editar o eliminar publicaciones, likes o comentarios reales.
- La ruta `/create-post` como página: se elimina.
- Feed de la familia, detalle de publicación y vista de foto.
- Subida real de imágenes a un servidor.
- Focus trap y accesibilidad completa del modal.

Cada uno de esos, si llega, va en su propia spec.
