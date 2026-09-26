# SPEC 02 — Pantallas de Niños y perfil de niño

> **Estado:** Implementado
> **Depende de:** SPEC 01
> **Fecha:** 2026-09-26
> **Objetivo:** Replicar las pantallas `references/pantallas/ninos.dc.html` y `references/pantallas/perfil-nino.dc.html` como rutas `/kids` y `/kids/mateo`, solo interfaces y componentes, sin datos reales.

## Por qué existe esta spec

SPEC 01 dejó el sidebar con enlaces inertes (`href="#"`) porque solo existía el feed. Esta spec crea las dos pantallas de gestión de niños y, de paso, convierte la navegación del sidebar en rutas reales (existentes o placeholder), por lo que actualiza el criterio de SPEC 01 que decía "todos los enlaces son inertes".

## Scope

**In:**

- Ruta `/kids`: listado con header, buscador funcional, encabezado de sala y grilla de 2 columnas con los 8 niños del mockup.
- Ruta `/kids/mateo`: perfil con back link, cabecera, tarjeta de alergias, filas de datos, columna derecha con "Resumen del día" y "Padres vinculados".
- Datos mock en `lib/kids.ts` (tipados, sin persistencia ni API).
- Componentes: `Avatar`, `KidCard`, `KidsList` (buscador + grilla, cliente), `ChildProfile`.
- Iconos nuevos en `components/icons.tsx`: `SearchIcon`, `ArrowLeftIcon`, `ChevronRightIcon`, `AlertTriangleIcon`.
- `Sidebar`/`SidebarContents` reciben prop `active` y navegan a rutas reales; `MobileNav` la propaga.
- Tokens `@theme` en `app/globals.css` para los colores nuevos (avatares, badges de alergia/vincular, estados de padre, tarjeta de alergias).
- Rutas placeholder con sidebar + `h1`: `/add-child`, `/day-summary`, `/link-parent`, `/notices`, `/my-account`, `/login`, `/create-post`.
- `app/page.tsx` (feed) pasa `active="feed"` y sigue viéndose igual.
- Responsive: mismo tratamiento que SPEC 01 (sidebar oculto <768px con drawer por hamburguesa; grilla a 1 columna; perfil apilado).
- `npm run lint` y `npm run build` en verde.

**Fuera de alcance (specs futuras):**

- Base de datos, API o persistencia de cualquier tipo.
- Ruta dinámica `/kids/[id]` con perfil de cualquier niño (hoy solo existe `/kids/mateo`).
- Formularios reales de `/add-child`, `/link-parent` y el resto de placeholders.
- Publicar, editar o eliminar contenido desde `/create-post`.
- Autenticación real en `/login`.
- El enlace "Compartí un momento…" del feed y los "Editar" post de SPEC 01 (siguen en `href="#"`).
- Cambios visuales en el feed más allá de pasar `active="feed"`.

## Data model

Todo vive en `lib/kids.ts`. No hay persistencia: son constantes hardcodeadas.

```ts
export type KidTagKind = "allergy" | "link";

export type Kid = {
  slug: string;        // "mateo-fernandez"
  name: string;
  initial: string;     // "M"
  age: string;         // "3 años"
  avatarBg: string;    // clase Tailwind, ej. "bg-kid-blue"
  avatarInk: string;   // clase Tailwind, ej. "text-kid-blue-ink"
  parentLabel: string; // "2 padres vinculados" | "sin padres vinculados"
  tag?: { label: string; kind: KidTagKind }; // "MANÍ" | "LACTOSA" | "VINCULAR"
};

export const KIDS: Kid[]; // 8 entradas, mismo orden y textos del mockup

export type ParentLink = {
  name: string;        // "Lucía Fernández"
  initial: string;     // "L"
  role: string;        // "Mamá · activa"
  status: "ACTIVA" | "PENDIENTE";
  avatarBg: string;
};

export type ChildProfile = {
  name: string;
  initial: string;
  ageRoom: string;     // "3 años · Sala Soles"
  birthDate: string;   // "12 mar 2022"
  room: string;        // "Soles"
  joinedAt: string;    // "feb 2025"
  allergies: string;
  parents: ParentLink[];
};

export const MATEO: ChildProfile;
```

Convenios:

- Los colores de avatar/badge se referencian como clases de tokens (`bg-kid-blue`, `text-kid-blue-ink`), nunca hex sueltos en los componentes.
- El texto de padres se guarda ya formateado (`parentLabel`) para respetar singular/plural del mockup sin lógica.

## Implementation plan

1. `lib/kids.ts`: crear tipos `Kid`, `ParentLink`, `ChildProfile` y las constantes `KIDS` (8 niños) y `MATEO` con los textos exactos del mockup. Compila sin usarse todavía.
2. `app/globals.css`: agregar tokens `@theme` de avatares (`--color-kid-blue` / `--color-kid-blue-ink`, idem pink, green, yellow, purple), badges (`--color-tag-allergy-bg/text`, `--color-tag-link-bg/text`, `--color-status-active-bg/text`, `--color-status-pending-bg/text`) y tarjeta de alergias (`--color-alert-bg`, `--color-alert-icon-bg`, `--color-alert-title`, `--color-alert-body`). El feed sigue renderizando igual.
3. `components/icons.tsx`: añadir `SearchIcon`, `ArrowLeftIcon`, `ChevronRightIcon`, `AlertTriangleIcon` (mismo estilo SVG que los existentes).
4. `components/sidebar.tsx`: tipo `NavKey = "feed" | "kids" | "notices" | "account"`, prop `active` en `SidebarContents` y `Sidebar`; hrefs reales (`/`, `/kids`, `/notices`, `/my-account`, `/login`; logo a `/`, "Nueva publicación" a `/create-post`).
5. `components/mobile-nav.tsx`: recibe y pasa `active` a `SidebarContents`.
6. `app/page.tsx`: `<Sidebar active="feed" />` y `<MobileNav active="feed" />`. Verificar en `npm run dev` que `/` se ve igual que antes.
7. `components/avatar.tsx`: círculo con letra (`size`, `label`, `bg`, `ink`), reutilizado por listado, perfil y padres.
8. `components/kid-card.tsx`: tarjeta enlazada a `/kids/mateo` con avatar, nombre, `parentLabel`, badge `tag` o `ChevronRightIcon`, y hover `border-[#F2A78E] -translate-y-0.5` con `transition`.
9. `components/kids-list.tsx` (cliente): input "Buscar niño…" que filtra `KIDS` por nombre, encabezado "SALA SOLES · 8 niños", grilla `grid-cols-1 md:grid-cols-2` y mensaje "Sin resultados" si el filtro queda vacío.
10. `app/kids/page.tsx`: header "GESTIÓN / Niños" + botón "Agregar niño" → `/add-child`, buscador y grilla vía `KidsList`. Verificar la ruta `/kids`.
11. `components/child-profile.tsx`: layout de dos columnas (contenido + 300px) con back link → `/kids`, cabecera con avatar 84px y "Editar" → `/add-child`, tarjeta de alergias, filas de datos, botón "Resumen del día" → `/day-summary` y card "Padres vinculados" con estados y "Vincular otro padre" → `/link-parent`.
12. `app/kids/mateo/page.tsx`: renderiza `ChildProfile` con `MATEO`. Verificar `/kids/mateo`.
13. Placeholders: crear `app/add-child`, `app/day-summary`, `app/link-parent`, `app/create-post`, `app/notices`, `app/my-account`, `app/login` con `Sidebar active` correcto + `h1` con el título.
14. Verificación final: `npm run lint`, `npm run build` y comparación visual de `/kids` y `/kids/mateo` contra los `.dc.html` (y `references/screenshots/ninos.png`), en desktop y <768px.

## Acceptance criteria

- [x] `npm run dev` sirve `/kids` sin errores en consola.
- [x] `/kids` muestra exactamente 8 tarjetas en el orden del mockup, con nombre, edad, `parentLabel` y badge ("MANÍ", "VINCULAR", "LACTOSA") idénticos al template.
- [x] La grilla de `/kids` tiene 2 columnas en desktop y 1 columna por debajo de 768px.
- [x] Al escribir "sof" en el buscador solo queda visible la tarjeta de Sofía Méndez.
- [x] Al escribir "zzz" no queda ninguna tarjeta y se muestra el texto "Sin resultados".
- [x] Al pasar el cursor sobre una tarjeta su borde pasa a `#F2A78E` y se desplaza 2px hacia arriba en 150ms.
- [x] El botón "Agregar niño" de `/kids` apunta a `/add-child`.
- [x] `npm run dev` sirve `/kids/mateo` y el back link "Volver a Niños" apunta a `/kids`.
- [x] `/kids/mateo` muestra avatar de 84px, "Mateo Fernández", "3 años · Sala Soles" y botón "Editar" → `/add-child`.
- [x] La tarjeta de alergias muestra "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila." sobre fondo `#FBDAD6`.
- [x] Las filas de datos muestran "Fecha de nacimiento → 12 mar 2022", "Sala → Soles", "Ingreso → feb 2025".
- [x] La columna derecha de `/kids/mateo` mide 300px en desktop y contiene: "Resumen del día" → `/day-summary`, Lucía Fernández con badge ACTIVA y Diego Fernández con badge PENDIENTE, y "Vincular otro padre" → `/link-parent`.
- [x] En `/kids` y `/kids/mateo` el ítem "Niños" del sidebar está activo (fondo `#FBE3D8`, texto `#D9583C`, peso 800) y en `/` lo está "Feed".
- [x] El nav del sidebar apunta a `/`, `/kids`, `/notices`, `/my-account`; el logo a `/`, logout a `/login` y "Nueva publicación" a `/create-post`.
- [x] `/add-child`, `/day-summary`, `/link-parent`, `/create-post`, `/notices`, `/my-account` y `/login` renderizan sidebar con `active` correcto y un `h1` con su título; todas devuelven 200.
- [x] Por debajo de 768px el sidebar está oculto y la hamburguesa abre el drawer en `/kids` y `/kids/mateo`.
- [x] `/` sigue renderizando el feed igual que antes (regresión de SPEC 01).
- [x] `npm run lint` y `npm run build` terminan sin errores.

## Decisions

- **Sí:** rutas fijas `/kids` y `/kids/mateo` (decisión del usuario). Todas las tarjetas del listado apuntan a `/kids/mateo`, igual que el mockup.
- **No:** ruta dinámica `/kids/[id]`. Se mueve a una spec futura cuando haya datos reales.
- **Sí:** prop `active` al `Sidebar` en lugar de `usePathname`. Mantiene los componentes server-side; el coste es pasarla explícitamente en cada página.
- **Sí:** buscador funcional con `useState` en `components/kids-list.tsx` (componente cliente). Es la única interactividad nueva.
- **Sí:** datos mock en `lib/kids.ts` compartido por listado y perfil.
- **Sí:** rutas placeholder en inglés: `/add-child`, `/day-summary`, `/link-parent`, `/create-post`, `/notices`, `/my-account`, `/login`.
- **Sí:** placeholders con sidebar + `h1` (decisión del usuario), no páginas en blanco.
- **Sí:** mensaje "Sin resultados" cuando el filtro no coincide (decisión del usuario).
- **Sí:** responsive idéntico a SPEC 01: drawer con hamburguesa, grilla a 1 columna, perfil apilado.
- **Sí:** "Editar" apunta a `/add-child`, igual que el mockup apunta a `agregar-nino`.
- **No:** cambiar el enlace "Compartí un momento…" del feed; no está confirmado y queda para su spec.
- **Sí:** actualizar el criterio de SPEC 01 sobre enlaces inertes: esta spec lo reemplaza por rutas reales.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Cambiar los href del sidebar compartido rompe el feed ya aceptado | Criterio de regresión sobre `/` + `npm run build`; el único cambio visible en el feed es `active="feed"` |
| La traducción de estilos inline a Tailwind altera medidas | Copiar valores exactos del mockup a tokens/utilidades arbitrarias y comparar con los `.dc.html` |
| `/kids/mateo` fijo obliga a tocar código cuando llegue otro perfil | Aceptado; la migración a `/kids/[id]` queda documentada como fuera de alcance |

## What is **not** in this spec

- Ruta dinámica `/kids/[id]`.
- Formularios o lógica en `/add-child`, `/link-parent`, `/day-summary`, `/create-post`, `/notices`, `/my-account`, `/login`.
- Base de datos, API o autenticación.
- El enlace "Compartí un momento…" del feed.
- Cualquier cambio visual del feed más allá de `active="feed"`.

Cada uno de esos, si llega, va en su propia spec.
