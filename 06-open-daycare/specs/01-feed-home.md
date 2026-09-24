# SPEC 01 — Feed como home de OpenDayCare

> **Estado:** Aprobado
> **Depende de:** ninguna
> **Fecha:** 2026-09-24
> **Objetivo:** Replicar la pantalla `references/pantallas/feed.dc.html` como home `/` de OpenDayCare con estilo visual idéntico, sin autenticación ni base de datos.

## Por qué existe esta spec

`app/page.tsx` sigue siendo el boilerplate de `create-next-app`. Esta spec lo reemplaza por la primera pantalla real de la app, fijando además el sistema de diseño (tokens de color y fuentes) que reutilizarán las próximas pantallas.

## Scope

**In:**

- Convertir `app/page.tsx` en el feed (home `/`) fiel al mockup.
- Sistema de diseño en Tailwind v4 vía tokens `@theme` en `app/globals.css` (colores, fuentes y sombras usadas por el mockup).
- Fuentes Fredoka y Nunito cargadas con `next/font/google` en `app/layout.tsx`.
- Metadatos: título "OpenDayCare", `lang="es"`.
- Componentes: `Sidebar` de escritorio, barra móvil con drawer colapsable, `PostCard` con las tres variantes (logro, actividad con foto, anuncio) e iconos SVG inline.
- Contenido mock hardcodeado idéntico al template (Caro Giménez, Sala Soles, 3 posts).
- Enlaces a pantallas futuras como `href="#"` inertes.
- `npm run lint` y `npm run build` en verde.

**Fuera de alcance (specs futuras):**

- Autenticación / login.
- Base de datos o persistencia.
- Rutas del resto de pantallas (niños, avisos, mi-cuenta, crear-publicación, detalle, foto, login, portada).
- Comportamiento real de crear/editar publicaciones, likes o comentarios.
- Carga de imágenes reales (se mantiene el placeholder de foto del mockup).
- Modo oscuro (el mockup es tema claro fijo).
- Mobile más allá del sidebar colapsable (sin bottom-bar ni rediseño).

## Data model

No introduce estructuras persistentes ni API; el contenido se hardcodea. Tipo ilustrativo para las tarjetas:

```ts
type Badge = "LOGRO" | "ACTIVIDAD" | "ANUNCIO";

type Post = {
  id: string;
  badge: Badge;
  badgeBg: string;      // token de color
  badgeText: string;    // token de color
  avatarBg: string;
  avatarLabel: string;  // "M" (letra) o ícono de anuncio
  title: string;        // "Mateo" / "Anuncio general"
  time: string;         // "14:20 · publicado por vos"
  audience: string;     // "Para: familia de Mateo"
  body: string;
  photo?: { label: string; height: number };
  likes: number;
  comments: number;
};
```

## Implementation plan

1. `app/layout.tsx`: cargar Fredoka y Nunito con `next/font/google` (exponiendo `--font-fredoka` y `--font-nunito`), `lang="es"` y metadata "OpenDayCare". La app sigue compilando con el boilerplate.
2. `app/globals.css`: definir los tokens `@theme` (colores cream/card/ink/coral/badges, `--font-display`/`--font-sans`, sombras) y eliminar el modo oscuro y el `body` default. El boilerplate sigue renderizando.
3. `components/icons.tsx`: componentes SVG inline (sol del logo, casa, personas, campana, usuario, logout, más, cámara, corazón, comentario).
4. `components/sidebar.tsx`: aside de 248px con logo "OpenDayCare/Sala Soles", botón "Nueva publicación", nav (Feed activo) y tarjeta de usuario con logout. Enlaces `href="#"`.
5. `components/mobile-nav.tsx` (cliente): top bar móvil con hamburguesa que abre un drawer reutilizando el contenido del sidebar (`useState`).
6. `components/post-card.tsx`: tarjeta parametrizada (badge, avatar, título, hora, audiencia, cuerpo, foto opcional, likes, comentarios, "Editar").
7. `app/page.tsx`: componer header ("Buenas, Caro", "12 niños · martes 17 jun"), composer "Compartí un momento…", separador "PUBLICADO HOY" y los 3 posts mock.
8. Verificación: `npm run dev` y comparación visual con `references/screenshots/feed.png` (desktop y <768px), más `npm run lint` y `npm run build` en verde.

## Acceptance criteria

- [ ] `npm run dev` sirve `/` con el feed completo sin errores en consola.
- [ ] En desktop el layout coincide con `feed.png`: sidebar 248px fijo a la izquierda, columna central `max-width:760px`, fondo `#F6ECDF`.
- [ ] El header muestra "GUARDERÍA · SALA SOLES", "Buenas, Caro" y "12 niños · martes 17 jun".
- [ ] Se muestran las 3 tarjetas con texto, badge y conteos exactos: LOGRO (3 likes / 1 comentario), ACTIVIDAD (5/2 + placeholder "Foto · pintando con témperas" de 200px con borde dashed), ANUNCIO (8/0).
- [ ] El sidebar muestra logo, botón "Nueva publicación" con gradiente coral, "Feed" activo con fondo `#FBE3D8` y texto `#D9583C`, y "Caro Giménez · Maestra · Soles".
- [ ] Todos los enlaces de navegación son inertes (`href="#"`).
- [ ] Fredoka y Nunito se sirven vía `next/font` (sin `<link>` externo a Google Fonts).
- [ ] Por debajo de 768px el sidebar está oculto por defecto y una hamburguesa lo abre como drawer.
- [ ] `npm run lint` y `npm run build` terminan sin errores.

## Decisions

- **Sí:** Tailwind utilities + tokens `@theme`. Fidelidad asegurada copiando los valores exactos del mockup a los tokens.
- **No:** TSX con estilos inline 1:1. Menos mantenible cuando lleguen las demás pantallas del sidebar.
- **Sí:** `next/font/google`. Fuentes auto-optimizadas, sin render blocking.
- **Sí:** Enlaces muertos `href="#"` para las pantallas aún no creadas; sus rutas van en specs futuras.
- **Sí:** Sidebar colapsable en móvil (decisión del usuario).
- **Sí:** Contenido hardcodeado, sin DB ni API.
- **No:** Modo oscuro. El `prefers-color-scheme` del boilerplate se elimina.
- **No:** Autenticación ni base de datos (explícitamente fuera de alcance).

## Risks

| Riesgo | Mitigación |
| --- | --- |
| La traducción a Tailwind altera medidas pixel-perfect | Copiar valores exactos del mockup a los tokens; comparar con `feed.png` y ajustar con valores arbitrarios si hace falta |
| `next/font` renderiza Fredoka/Nunito con diferencias mínimas vs. el `<link>` crudo | Mismas familias y pesos; aceptar diferencias subpixel irrelevantes |

## What is **not** in this spec

Repetición deliberada del Scope: auth, DB, resto de rutas, crear/editar/likes reales, fotos reales, modo oscuro y mobile más allá del drawer. Cada uno, si llega, va en su propia spec.