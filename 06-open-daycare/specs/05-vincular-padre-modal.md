# SPEC 05 — Modal "Vincular padre" en el perfil del niño

> **Estado:** Aprobado
> **Depende de:** SPEC 02, SPEC 04
> **Fecha:** 2026-10-07
> **Objetivo:** Vincular un padre desde `/kids/mateo` mediante un modal de invitación con código generado, persistiendo padres y niños en archivos JSON para que sobrevivan a la recarga.

## Por qué existe esta spec

SPEC 02 dejó el botón "Vincular otro padre" de `/kids/mateo` enlazando al placeholder `/link-parent`, con la nota de que "los formularios reales llegan en una spec futura". Esta spec es esa spec futura, pero el formulario no vive en una ruta: vive en un modal sobre `/kids/mateo`, siguiendo el precedente de SPEC 04. Al hacerlo reemplaza los criterios de SPEC 02 que mencionan `/link-parent`.

Además, hasta ahora todo el proyecto es memoria volátil: SPEC 04 agregaba niños que desaparecían al recargar. Esta spec introduce por primera vez persistencia real (archivos JSON + Server Actions) y la aplica a los dos flujos que ya existen: padres nuevos y niños nuevos.

## Scope

**In:**

- Botón "Vincular otro padre" de `/kids/mateo`: deja de navegar y abre un modal sobre la misma página.
- Modal con el diseño de `references/pantallas/vincular-padre.dc.html`: header con "Vincular padre" · "a Mateo Fernández" · botón X; banner informativo azul; campos nombre, email y parentesco; caja amarilla con el código de invitación; botón "Enviar invitación".
- Código de invitación generado al abrir el modal: 5 caracteres A-Z + 0-9, sin `O`, `0`, `I` ni `1`, con el texto fijo "Vence en 7 días".
- Validación por campo con mensajes en voseo y rojo `#C5503A` bajo el input: nombre obligatorio, email obligatorio con formato y un parentesco seleccionado.
- Rechazo de email duplicado dentro del mismo niño: no se envía y aparece "Ese email ya está vinculado a este niño." bajo EMAIL.
- Botón deshabilitado con "Enviando…" mientras corre la Server Action.
- Pantalla de éxito dentro del modal: "Invitación enviada" + línea con el email + botón "Listo" que cierra.
- Cierre sin enviar con el botón X, con la tecla Esc y con clic en el fondo, sin confirmación intermedia.
- Padre nuevo agregado con `status: "PENDIENTE"`, `role: "<Parentesco> · invitación enviada"` y código + fecha de envío guardados.
- Persistencia en disco: `data/kids.json` (la lista de niños, sembrada con los 8 de SPEC 02) y `data/family.json` (mapa de padres por `Kid.slug`, sembrado con Lucía y Diego).
- Server Actions `linkParentAction` y `addKidAction` que leen y escriben esos archivos.
- Estado compartido entre `/kids` y `/kids/mateo` en `app/kids/layout.tsx` + `FamilyProvider` (cliente).
- `Kid.parentLabel` se elimina: el texto se deriva del conteo de padres ("sin padres vinculados" / "1 padre vinculado" / "n padres vinculados").
- El alta de niños de SPEC 04 pasa a persistir en `data/kids.json` (reemplaza el criterio de "se pierde al recargar").
- Se elimina la ruta `/link-parent`.
- Iconos nuevos en `components/icons.tsx`: `InfoIcon`, `SendIcon`, `CloseIcon`.
- Tokens `@theme` en `app/globals.css` para el banner informativo, las pastillas de parentesco y la caja del código.
- Capturas Playwright en `.playwright-mcp/`.
- `npm run lint` y `npm run build` en verde.

**Fuera de alcance (specs futuras):**

- Envío real de correos y validación del código contra un servidor.
- Que el padre acepte la invitación: el estado `PENDIENTE` nunca pasa a `ACTIVA` en esta spec.
- Caducidad real del código a los 7 días: "Vence en 7 días" es texto fijo.
- Editar o eliminar un padre ya vinculado.
- Perfiles de niños distintos a Mateo (`/kids/[id]`): el modal solo existe en `/kids/mateo`.
- Que el badge "VINCULAR" de Valentina Soto en `/kids` abra el modal (necesita perfil propio).
- Renovar o revocar un código ya enviado.
- Autenticación, autorización o multi-usuario sobre los JSON.
- Base de datos o API: la persistencia es un archivo JSON por feature.

## Data model

Dos archivos nuevos en `data/`, cada uno dueño de una feature. Se leen con `node:fs/promises` desde el servidor y se escriben desde Server Actions.

```json
// data/kids.json — semilla: los 8 niños de SPEC 02, mismo orden y textos
[
  {
    "slug": "mateo-fernandez",
    "name": "Mateo Fernández",
    "initial": "M",
    "age": "3 años",
    "room": "Soles",
    "allergies": "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
    "birthDate": "12 mar 2022",
    "joinedAt": "feb 2025",
    "avatarBg": "bg-kid-blue",
    "avatarInk": "text-kid-blue-ink",
    "tag": { "label": "MANÍ", "kind": "allergy" }
  }
]
```

```json
// data/family.json — clave: Kid.slug
{
  "mateo-fernandez": [
    { "name": "Lucía Fernández", "email": "lucia.fernandez@gmail.com",
      "relation": "Mamá", "status": "ACTIVA", "code": null, "sentAt": null },
    { "name": "Diego Fernández", "email": "diego.fernandez@gmail.com",
      "relation": "Papá", "status": "PENDIENTE", "code": null, "sentAt": null }
  ]
}
```

Tipos (en `lib/kids.ts` y `lib/family.ts`):

```ts
// lib/kids.ts — Kid cambia
export type Kid = {
  slug: string;
  name: string;
  initial: string;
  age: string;
  room: string;
  allergies?: string;
  medicalNotes?: string;
  birthDate?: string;   // nuevo, opcional: "12 mar 2022"
  joinedAt?: string;    // nuevo, opcional: "feb 2025"
  avatarBg: string;
  avatarInk: string;
  tag?: { label: string; kind: KidTagKind };
};
// parentLabel se elimina. KIDS y MATEO dejan de existir como constantes.

// lib/family.ts — nuevo
export type Relation = "Mamá" | "Papá" | "Tutor/a";

export type FamilyEntry = {
  name: string;
  email: string;
  relation: Relation;
  status: "ACTIVA" | "PENDIENTE";
  code: string | null;    // "7K4P9"; null en los padres semilla
  sentAt: string | null;  // "2026-10-07"
};

export type FamilyData = Record<string, FamilyEntry[]>;
```

Helpers nuevos:

```ts
// lib/data.ts (solo servidor)
export async function readKids(): Promise<Kid[]>;
export async function readFamily(): Promise<FamilyData>;
export async function writeKids(kids: Kid[]): Promise<void>;
export async function writeFamily(family: FamilyData): Promise<void>;

// lib/family.ts
export function generateInviteCode(): string;        // 5 chars, sin O/0/I/1
export function parentLabel(count: number): string;  // 0/1/n → textos del mockup
export function toParentLinks(entries: FamilyEntry[]): ParentLink[];
```

Convenios:

- `toParentLinks` deriva `initial` (primera letra del nombre), `role` (`"<relation> · activa"` si `ACTIVA`, `"<relation> · invitación enviada"` si `PENDIENTE`) y `avatarBg` rotando por índice entre `["bg-kid-purple", "bg-parent-blue", "bg-kid-pink", "bg-kid-green", "bg-kid-yellow"]`. Los índices 0 y 1 reproducen exactamente los colores de Lucía y Diego del mockup.
- `linkParentAction` valida el duplicado contra `entries` de ese `kidSlug`, comparando email en minúsculas.
- Server Actions en `app/kids/actions.ts` con `"use server"`; al final de la escritura llaman a `refresh()` de `next/cache` para que el router muestre los datos frescos.
- Las páginas bajo `app/kids/` leen los JSON en el layout con `export const dynamic = "force-dynamic"`, porque `next.config.ts` no habilita `cacheComponents`: sin eso, `next build` prerenderizaría los datos en build time.
- El estado del modal (abierto/cerrado, campos, código, éxito) vive en `components/link-parent-modal.tsx`; los datos viven en el JSON y en `FamilyProvider`.

## Implementation plan

1. `data/kids.json` y `data/family.json` con las semillas de arriba, más `lib/data.ts` con `readKids`, `readFamily`, `writeKids`, `writeFamily` (`node:fs/promises` + `path.join(process.cwd(), "data", ...)`). Compila sin usarse todavía.
2. `lib/family.ts`: tipos `Relation`, `FamilyEntry`, `FamilyData` y helpers `generateInviteCode`, `parentLabel`, `toParentLinks`. Compila sin usarse todavía.
3. `app/kids/actions.ts` (`"use server"`): `linkParentAction` (lee, valida duplicado, agrega `PENDIENTE` con `code` y `sentAt`, escribe, `refresh()`) y `addKidAction` (lee `kids.json`, `createKid`, agrega, escribe, `refresh()`), ambos devolviendo `{ ok, field?, message? }`. Compila sin usarse todavía.
4. `components/family-provider.tsx` (cliente): `useState` con `kids` y `family` iniciales, expone `linkParent` y `addKid` que llaman a las acciones y actualizan el estado local con el resultado.
5. `app/kids/layout.tsx` (nuevo): lee los dos JSON, exporta `dynamic = "force-dynamic"` y renderiza `<FamilyProvider>` con `children`. `/kids` y `/kids/mateo` siguen funcionando igual.
6. `components/icons.tsx`: añadir `InfoIcon`, `SendIcon` y `CloseIcon` (mismo estilo SVG que los existentes).
7. `app/globals.css`: tokens `@theme` del banner informativo (`#E3ECFB` / `#4E72C8` / `#3F5694`), de las pastillas de parentesco (`#CCD8F4` / `#9FB8EC` / `#4E72C8`) y de la caja del código (reutilizar `--color-consent-bg` / `--color-consent-ink` de SPEC 03). Regresión: `/` y `/kids` se ven igual.
8. `components/link-parent-modal.tsx` (cliente): overlay fijo + card `max-w-[480px]` con header ("Vincular padre", "a {kidName}", `CloseIcon`), banner, los 3 campos, pastillas de parentesco, caja de código con el código generado al abrir, validación, estado "Enviando…", pantalla de éxito y cierre por X/Esc/fondo con scroll bloqueado. Sin montar todavía.
9. `components/child-profile.tsx` pasa a cliente: consume `useFamily`, el enlace "Vincular otro padre" se reemplaza por un botón que abre `LinkParentModal`. Verificar apertura y cierre en `/kids/mateo`.
10. `components/kid-card.tsx` y `components/kids-list.tsx`: el texto de padres pasa a `parentLabel(family[kid.slug]?.length ?? 0)` en lugar de `kid.parentLabel`. `/kids` se ve idéntico con los datos semilla.
11. `lib/kids.ts`: eliminar `parentLabel` del tipo `Kid`, añadir `birthDate?` y `joinedAt?`, borrar la asignación de `parentLabel` en `createKid` y eliminar las constantes `KIDS` y `MATEO`. Verificar que nada las referencia.
12. `components/kids-screen.tsx`: deja de importar `KIDS` y de guardar `useState<Kid[]>(KIDS)`; toma `kids` y `addKid` del provider y llama a `addKidAction`. Verificar que un niño agregado sobrevive a recargar `/kids`.
13. `app/kids/mateo/page.tsx` y `app/kids/page.tsx`: los perfiles y la grilla se componen desde el provider (`ChildProfileView` recibe el `kid` de `mateo-fernandez` y `toParentLinks` de su familia). Verificar que `/kids/mateo` muestra el perfil idéntico al de antes.
14. Eliminar `app/link-parent/` y comprobar que ningún archivo la referencia.

## Acceptance criteria

- [ ] `npm run dev` sirve `/kids/mateo` sin errores en consola.
- [ ] "Vincular otro padre" ya no navega: la URL sigue en `/kids/mateo` y el modal queda visible.
- [ ] El modal muestra el header "Vincular padre" con subtítulo "a Mateo Fernández" y el banner azul con el texto "Le enviaremos un correo con un código para que active su cuenta. Solo verá el feed de Mateo."
- [ ] El modal muestra los labels "NOMBRE DEL PADRE/MADRE", "EMAIL", "PARENTESCO" y "CÓDIGO DE INVITACIÓN".
- [ ] Nombre y email nacen vacíos y ninguna pastilla de parentesco nace seleccionada.
- [ ] El código generado tiene exactamente 5 caracteres de A-Z y 0-9, sin `O`, `0`, `I` ni `1`, y debajo dice "Vence en 7 días".
- [ ] Cerrar y reabrir el modal genera un código distinto al anterior.
- [ ] Con el formulario vacío, "Enviar invitación" no envía y muestra 3 mensajes en `#C5503A` bajo los campos.
- [ ] Con un email sin `@`, no envía y muestra "Ingresá un email válido." bajo EMAIL.
- [ ] Con un email ya vinculado a Mateo, no envía y muestra "Ese email ya está vinculado a este niño." bajo EMAIL.
- [ ] Con datos válidos, el botón queda deshabilitado con texto "Enviando…" mientras se escribe el JSON.
- [ ] Tras enviar, el modal muestra la pantalla "Invitación enviada" con la línea "Le enviamos un código a {email} para que active su cuenta." y el botón "Listo".
- [ ] "Listo" cierra el modal y la tarjeta "Padres vinculados" muestra la fila nueva con el nombre, `"<Parentesco> · invitación enviada"` y el badge `PENDIENTE`.
- [ ] El botón X del header cierra el modal sin enviar.
- [ ] La tecla Esc cierra el modal sin enviar.
- [ ] Hacer clic en el fondo oscuro cierra el modal sin enviar.
- [ ] Mientras el modal está abierto, la página de fondo no hace scroll.
- [ ] Al enfocar cualquier campo del modal su borde pasa a `#F2A78E`.
- [ ] En desktop el modal está centrado con ancho máximo 480px; por debajo de 768px ocupa casi todo el ancho.
- [ ] `data/family.json` contiene la entrada nueva con `status: "PENDIENTE"`, el `code` generado y el `sentAt` de hoy.
- [ ] Recargar `/kids/mateo` mantiene al padre recién agregado en la tarjeta.
- [ ] Tras recargar, la tarjeta de Mateo en `/kids` muestra "3 padres vinculados"; con un cuarto padre, "4 padres vinculados"; Sofía sigue mostrando "1 padre vinculado" y Valentina "sin padres vinculados".
- [ ] Un niño agregado desde el modal de SPEC 04 sobrevive a recargar `/kids` (queda en `data/kids.json`).
- [ ] `/kids` sigue mostrando los mismos 8 niños iniciales, en el mismo orden y con los mismos badges.
- [ ] `/link-parent` responde 404 y ningún archivo del proyecto la referencia.
- [ ] `Kid` ya no tiene la propiedad `parentLabel` y ningún archivo la referencia.
- [ ] El perfil de `/kids/mateo` se ve idéntico al de antes: avatar, filas de datos, "Resumen del día", Lucía ACTIVA y Diego PENDIENTE.
- [ ] `/`, `/kids` y `/login` se ven igual que antes (regresión SPEC 01, 02, 03 y 04).
- [ ] `npm run lint` y `npm run build` terminan sin errores.
- [ ] Las capturas quedan guardadas en `.playwright-mcp/`.

## Decisions

- **Sí:** modal en lugar de ruta, y se elimina `app/link-parent/` (decisión del usuario). Reemplaza los criterios de SPEC 02 que la mencionaban.
- **Sí:** al enviar se muestra la pantalla de éxito dentro del modal y **también** se agrega el padre como `PENDIENTE` hasta que lo confirme (decisión del usuario). El estado no pasa a `ACTIVA`.
- **Sí:** validación de nombre, email y parentesco obligatorios (decisión del usuario), con textos en voseo estilo SPEC 04.
- **Sí:** código de invitación generado al abrir el modal, 5 caracteres A-Z + 0-9 sin `O/0/I/1` (decisión del usuario). El `7K4P9` del mockup se interpretó como valor estático del diseño.
- **Sí:** persistencia en `data/family.json` + Server Action (decisión del usuario). Elegido sobre localStorage porque queda en el repo y sirve para cualquier navegador.
- **Sí:** persistir también los niños de SPEC 04 (decisión del usuario), en `data/kids.json`. Amplía el alcance de la spec anterior: sus criterios de "se pierde al recargar" quedan reemplazados.
- **Sí:** dos archivos de datos, uno por feature (decisión del usuario). Se descartó un `data/family.json` único con `{ kids, parents }` para no mezclar responsabilidades.
- **Sí:** migrar los 8 niños al JSON y eliminar `KIDS` (decisión del usuario). Se descartó el fallback a la constante porque crearía dos fuentes de verdad.
- **Sí:** `Kid.parentLabel` se elimina y el texto se deriva del conteo (decisión del usuario). Un string guardado se desincroniza apenas se agrega un padre.
- **Sí:** estado compartido en `app/kids/layout.tsx` + `FamilyProvider` (decisión del usuario), con el JSON como fuente de verdad: el provider da actualización inmediata y el layout se relee al recargar.
- **Sí:** rechazar el email duplicado dentro del mismo niño con mensaje bajo el campo (decisión del usuario).
- **Sí:** `role` del padre nuevo = `"<Parentesco> · invitación enviada"` y `status: PENDIENTE`, textualmente igual que Diego Fernández del mockup (decisión del usuario).
- **Sí:** pantalla de éxito con título "Invitación enviada", el email y botón "Listo" (decisión del usuario). El código no se repite en la pantalla de éxito.
- **Sí:** cierre con X + Esc + clic en el fondo, sin confirmación (decisión del usuario); el mockup no tiene botón "Cancelar".
- **Sí:** botón deshabilitado con "Enviando…" durante la escritura (decisión del usuario). Evita dobles envíos que dupliquen filas.
- **Sí:** el parentesco nace vacío aunque el mockup muestra "Mamá" seleccionado: es el mismo criterio que SPEC 04 aplicó al select de sala, para que la validación de obligatoriedad sea real.
- **Sí:** las páginas bajo `/kids` se marcan `dynamic = "force-dynamic"`: `cacheComponents` está desactivado en `next.config.ts`, así que sin eso los JSON se leerían una sola vez en `next build`.
- **Sí:** después de escribir el JSON se llama a `refresh()` de `next/cache` (forma vigente en Next 16 para Server Actions).
- **No:** que el badge "VINCULAR" de Valentina abra el modal: no existe perfil de Valentina.
- **No:** focus trap y programa completo de accesibilidad del modal; se queda `role="dialog"` y `aria-modal` como mínimo, igual que SPEC 04.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Eliminar `/link-parent` deja en rojo dos criterios ya verdes de SPEC 02 | Esta spec deja constancia de que los reemplaza; criterio de "ningún archivo la referencia" y de regresión sobre `/kids/mateo` |
| Quitar `parentLabel` de `Kid` rompe `KidCard`, `createKid` y la semilla a la vez | El paso 10 saca a los consumidores del campo antes de que el paso 11 lo elimine; `npm run build` falla si queda alguna referencia |
| Migrar `KIDS`/`MATEO` al JSON puede cambiar el render de `/kids` y `/kids/mateo` | La semilla replica los textos exactos de las constantes; criterios de regresión visual y de "los mismos 8 niños en el mismo orden" |
| `next build` prerenderiza los JSON en build time y la app mostraría datos viejos | `export const dynamic = "force-dynamic"` en `app/kids/layout.tsx`; criterio de persistencia verificado recargando |
| Escribir archivos desde Server Actions no controla concurrencia | Aceptado para una demo: se lee y escribe completo en una sola acción; si llegan dos envíos simultáneos, el último gana |
| El provider y el JSON pueden desincronizarse si falla la escritura | La acción solo actualiza el estado local si devolvió `ok: true`; el `refresh()` relee el archivo |
| Los niños persisten pero el resto de SPEC 04 seguía en memoria, y ahora quedan fuentes mezcladas | Esta spec migra el alta de niños completa al JSON; lo que no migra queda listado en "Fuera de alcance" |

## What is **not** in this spec

- Envío real de correos, validación del código contra un servidor o caducidad real de 7 días.
- Cambiar un padre de `PENDIENTE` a `ACTIVA` (el flujo de activación del padre).
- Editar o eliminar un padre ya vinculado.
- Perfil de niños distintos a Mateo o que el badge "VINCULAR" de Valentina abra el modal.
- Renovar o revocar códigos ya enviados.
- Base de datos, API o autenticación: la persistencia son dos archivos JSON.
- Focus trap y accesibilidad completa del modal.

Cada uno de esos, si llega, va en su propia spec.
