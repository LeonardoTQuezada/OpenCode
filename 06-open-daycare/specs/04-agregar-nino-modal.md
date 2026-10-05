# SPEC 04 — Modal "Agregar niño" en la pantalla de Niños

> **Estado:** Aprobado
> **Depende de:** SPEC 02
> **Fecha:** 2026-10-05
> **Objetivo:** Abrir un modal desde el botón "Agregar niño" de `/kids` con nombre completo, fecha de nacimiento enmascarada con calendario y sala (6 salas mock), que agrega el niño a la lista en memoria.

## Por qué existe esta spec

SPEC 02 dejó el botón "Agregar niño" de `/kids` enlazando al placeholder `/add-child`, con la nota de que "el formulario llega en una spec futura". Esta spec es esa spec futura, pero el formulario no vive en una ruta: vive en un modal sobre `/kids`. Al hacerlo reemplaza dos criterios de SPEC 02: el que pedía "`/add-child` … renderiza sidebar … y un `h1`" y el que pedía "El botón 'Agregar niño' de `/kids` apunta a `/add-child`".

## Scope

**In:**

- Botón "Agregar niño" de `/kids`: deja de navegar y abre un modal sobre la misma página.
- Modal con el diseño de `references/pantallas/agregar-nino.dc.html`: header con "Cancelar" · "Agregar niño" · "Guardar" y body con los 5 campos del mockup.
- Campos obligatorios: nombre completo, fecha de nacimiento y sala.
- Campos opcionales: alergias (etiquetas) y notas médicas.
- Máscara de fecha `dd/mm/aaaa` con auto-barras, más un botón de calendario que abre el date picker nativo.
- Validación por campo con mensajes en rojo `#C5503A` bajo el input.
- 6 salas mock en `lib/kids.ts` y su `<select>` en el modal.
- Al guardar: el niño se agrega al final de la grilla en memoria (`useState`), el contador pasa a "9 niños" y su tarjeta enlaza a `/kids/mateo`.
- Cierre sin guardar con "Cancelar", con la tecla Esc y con clic en el fondo.
- Se elimina la ruta `/add-child`; el "Editar" de `/kids/mateo` queda inerte.
- Iconos nuevos en `components/icons.tsx`: `ChevronDownIcon`, `CalendarIcon`.
- Tokens `@theme` en `app/globals.css` para el overlay y la sombra del modal.
- Capturas Playwright en `.playwright-mcp/`.
- `npm run lint` y `npm run build` en verde.

**Fuera de alcance (specs futuras):**

- Persistencia, API o base de datos: los niños agregados se pierden al recargar.
- Editar o eliminar un niño existente (el botón "Editar" queda inerte).
- Ruta `/kids/[id]` o perfil propio del niño nuevo (todas las tarjetas siguen yendo a `/kids/mateo`).
- Filtrar la grilla por sala: el encabezado sigue diciendo "SALA SOLES" y muestra todos los niños.
- Mostrar las notas médicas o el listado completo de alergias en alguna pantalla (solo se guardan; el badge usa la primera alergia).
- Chips / etiquetas múltiples para alergias.
- Focus trap y programa completo de accesibilidad del modal.
- Fecha de ingreso, padres vinculados y quién registró al niño.

## Data model

Todo sigue en `lib/kids.ts`. No hay persistencia: la lista vive en `useState` y muere al recargar.

```ts
export type Room = {
  id: string;      // "soles"
  name: string;    // "Soles"
};

export const ROOMS: Room[]; // 6: Soles, Lunas, Estrellas, Nubes, Mariposas, Cielo

export type Kid = {
  slug: string;
  name: string;
  initial: string;
  age: string;
  room: string;            // nuevo: "Soles" en los 8 existentes
  allergies?: string;      // nuevo: texto libre, ej. "Maní, Lactosa"
  medicalNotes?: string;   // nuevo: texto libre
  avatarBg: string;
  avatarInk: string;
  parentLabel: string;
  tag?: { label: string; kind: KidTagKind };
};
```

Helpers nuevos en `lib/kids.ts`:

```ts
// "12/03/2022" → "3 años"; con singular "1 año"; menos de un año → "5 meses"
export function ageLabel(birthDate: string): string;

// "Martina López" → "martina-lopez"; si ya existe → "martina-lopez-2"
export function slugify(name: string, taken: string[]): string;

// Construye el Kid nuevo a partir del formulario validado
export function createKid(
  input: {
    fullName: string;
    birthDate: string;   // "dd/mm/aaaa"
    roomId: string;
    allergies?: string;
    medicalNotes?: string;
  },
  existing: Kid[],
): Kid;
```

Convenios:

- `createKid` deriva `initial` (primera letra del primer nombre en mayúscula), `age` con `ageLabel`, `slug` con `slugify`, `parentLabel: "sin padres vinculados"` y `avatarBg`/`avatarInk` rotando entre las 5 paletas por `existing.length % 5`.
- Orden de paletas: blue, pink, green, yellow, purple (los tokens ya existen en `globals.css`).
- Si `allergies` no está vacío, `tag = { label: primera alergia en mayúsculas, kind: "allergy" }`. Si está vacío, sin `tag`.
- `room` se guarda en el objeto pero nada lo muestra todavía: no existe filtro por sala.
- El estado del modal y de la lista vive en `components/kids-screen.tsx`; `lib/kids.ts` no guarda estado.

## Implementation plan

1. `lib/kids.ts`: añadir `Room` y `ROOMS`, el campo `room: "Soles"` a los 8 niños existentes, los opcionales `allergies`/`medicalNotes` y los helpers `ageLabel`, `slugify`, `createKid`. Compila sin usarse todavía.
2. `app/globals.css`: tokens `@theme` del modal (`--color-modal-overlay`, `--shadow-modal`). El feed y `/kids` siguen renderizando igual.
3. `components/icons.tsx`: añadir `ChevronDownIcon` y `CalendarIcon` (mismo estilo SVG que los existentes).
4. `components/kids-list.tsx`: recibe `kids` por prop en lugar de importar `KIDS`; el encabezado usa `kids.length` para el contador. Con los 8 iniciales el buscador y la grilla se ven igual que hoy.
5. `components/add-child-modal.tsx` (cliente): overlay fijo + card `max-w-[520px]` con header ("Cancelar", "Agregar niño", "Guardar"), los 5 campos, la máscara de fecha, el calendario nativo, el `<select>` de 6 salas, validación por campo, `role="dialog"` y bloqueo del scroll del fondo. Verificar apertura y cierre en `/kids`.
6. `components/kids-screen.tsx` (cliente): `useState<Kid[]>(KIDS)` + estado de apertura; renderiza el header con el botón "Agregar niño", `KidsList` y `AddChildModal`. Verificar que "Guardar" agrega la tarjeta y que el contador pasa a 9.
7. `app/kids/page.tsx`: la página server pasa a renderizar `<KidsScreen />`; el botón y el header se mudan al componente cliente.
8. `components/child-profile.tsx`: el "Editar" deja de ser `<Link href="/add-child">` y queda como elemento sin acción, con el mismo texto y estilo.
9. Eliminar `app/add-child/` y comprobar que ningún archivo la referencia.
10. Verificación final: `npm run lint`, `npm run build`, capturas Playwright de `/kids` (modal cerrado, modal con errores, modal válido, niño agregado, <768px) y regresión de `/`, `/kids` y `/kids/mateo`.

## Acceptance criteria

- [ ] `npm run dev` sirve `/kids` sin errores en consola.
- [ ] El botón "Agregar niño" ya no navega: la URL sigue en `/kids` y el modal queda visible.
- [ ] El modal muestra el header "Cancelar" · "Agregar niño" · "Guardar" y los labels "NOMBRE COMPLETO", "FECHA DE NACIMIENTO", "SALA", "ALERGIAS (ETIQUETAS)" y "NOTAS MÉDICAS".
- [ ] Los tres campos obligatorios nacen vacíos, sin valor por defecto.
- [ ] Escribir `12032022` en la fecha deja el campo en `12/03/2022` (solo dígitos, auto-barras, máximo 10 caracteres).
- [ ] `31022022` muestra el mensaje "Usá una fecha válida en formato dd/mm/aaaa." en `#C5503A` bajo el campo.
- [ ] Una fecha futura muestra "La fecha no puede ser futura." bajo el campo.
- [ ] `01/01/2000` muestra "El niño debe tener máximo 6 años." bajo el campo.
- [ ] El botón de calendario abre el date picker nativo del navegador y, al elegir una fecha, el campo queda en `dd/mm/aaaa`.
- [ ] El select de sala muestra exactamente 6 opciones: Soles, Lunas, Estrellas, Nubes, Mariposas y Cielo, y arranca en "Elegí una sala".
- [ ] Con el formulario vacío, "Guardar" no cierra el modal y muestra los 3 mensajes de error en `#C5503A`.
- [ ] Con nombre, fecha y sala válidos, "Guardar" cierra el modal y agrega la tarjeta al final de la grilla.
- [ ] El contador de "SALA SOLES" pasa de "8 niños" a "9 niños".
- [ ] La tarjeta nueva muestra el nombre completo, la edad calculada ("3 años", "1 año" en singular o "5 meses" si tiene menos de un año) y "sin padres vinculados".
- [ ] Si "ALERGIAS (ETIQUETAS)" se completó con "Maní, Lactosa", la tarjeta nueva muestra el badge rojo "MANÍ"; si se dejó vacía, muestra el chevron derecho.
- [ ] Agregar dos niños con el mismo nombre muestra dos tarjetas (slugs distintos y sin error de `key` en consola).
- [ ] El buscador filtra también a los niños nuevos: con su nombre queda solo su tarjeta y con "zzz" aparece "Sin resultados".
- [ ] La tarjeta del niño nuevo navega a `/kids/mateo`.
- [ ] "Cancelar" cierra el modal sin agregar nada.
- [ ] La tecla Esc cierra el modal sin agregar nada.
- [ ] Hacer clic en el fondo oscuro cierra el modal sin agregar nada.
- [ ] Mientras el modal está abierto, la página de fondo no hace scroll.
- [ ] Al enfocar cualquier campo del modal su borde pasa a `#F2A78E`.
- [ ] En desktop el modal está centrado con ancho máximo 520px; por debajo de 768px ocupa casi todo el ancho.
- [ ] `/kids/mateo` muestra "Editar" con el mismo texto y estilo pero sin enlace a `/add-child`.
- [ ] `/add-child` responde 404 y ningún archivo del proyecto la referencia.
- [ ] `/`, `/kids` y `/kids/mateo` se ven igual que antes (regresión SPEC 01 y 02), salvo el comportamiento del botón "Agregar niño".
- [ ] `npm run lint` y `npm run build` terminan sin errores.
- [ ] Las capturas quedan guardadas en `.playwright-mcp/`.

## Decisions

- **Sí:** modal en lugar de ruta (decisión del usuario). El botón "Agregar niño" de `/kids` deja de navegar.
- **Sí:** eliminar `app/add-child/` (decisión del usuario). Reemplaza los dos criterios de SPEC 02 que la mencionaban.
- **Sí:** "Editar" de `/kids/mateo` queda inerte, con el mismo texto y estilo (decisión del usuario). Su formulario va en otra spec.
- **Sí:** 3 campos obligatorios + alergias y notas médicas opcionales (decisión del usuario).
- **Sí:** el niño nuevo se agrega a la lista en memoria (decisión del usuario). Sin persistencia: se pierde al recargar.
- **Sí:** 6 salas `Soles, Lunas, Estrellas, Nubes, Mariposas, Cielo` y lista sin filtrar (decisión del usuario). El encabezado "SALA SOLES" queda fijo y solo cambia el contador.
- **Sí:** máscara `dd/mm/aaaa` + date picker nativo (decisión del usuario). Se descartó el calendario propio por la cantidad de código que implica.
- **Sí:** la fecha rechaza el futuro y las edades mayores a 6 años (decisión del usuario).
- **Sí:** badge de alergia en la tarjeta (decisión del usuario): la primera alergia en mayúsculas alimenta `tag`.
- **Sí:** cierre con "Cancelar" + Esc + clic en el fondo, sin confirmación (decisión del usuario).
- **Sí:** avatar rotando entre las 5 paletas por `existing.length % 5` (decisión del usuario).
- **Sí:** la edad se calcula desde la fecha de nacimiento (decisión del usuario); menos de un año se muestra como "N meses".
- **Sí:** la tarjeta nueva navega a `/kids/mateo`, igual que las demás (decisión del usuario).
- **Sí:** modal centrado de 520px en desktop y casi a pantalla completa por debajo de 768px (decisión del usuario).
- **Sí:** el select arranca en "Elegí una sala" (vacío) para que la validación de obligatoriedad sea real. El "Soles" del mockup se interpretó como valor estático del diseño, no como valor por defecto.
- **Sí:** `Kid` gana `room` (obligatorio) y `allergies`/`medicalNotes` (opcionales). Sin el campo `room`, la sala elegida en el modal se descartaría.
- **Sí:** alergias como texto libre separado por comas, no como chips: el mockup muestra un input con placeholder "Ej. Maní, Lactosa".
- **Sí:** el estado del modal y de la lista vive en `components/kids-screen.tsx`, un componente cliente; `app/kids/page.tsx` sigue siendo server.
- **No:** `KidsList` importando `KIDS` directamente: pasa a recibir `kids` por prop para que la lista sea una función del estado.
- **No:** focus trap ni accesibilidad completa; se queda `role="dialog"` y `aria-modal` como mínimo.
- **No:** header del modal como `<Link>` a ninguna parte: "Cancelar" es un botón que cierra.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Eliminar `/add-child` deja en rojo dos criterios ya verdes de SPEC 02 | Esta spec deja constancia de que los reemplaza; criterios de regresión sobre `/kids/mateo` y de "ningún archivo la referencia" |
| `Kid` gana un campo obligatorio y hay 8 entradas existentes | El paso 1 actualiza los 8 con `room: "Soles"`; `npm run build` falla si falta alguno |
| El date picker nativo entrega `YYYY-MM-DD` y su formato visible depende del navegador | Solo se usa el picker para elegir: el valor interno se convierte a `dd/mm/aaaa` antes de validar y guardar; el campo visible siempre es texto enmascarado |
| Dos niños con el mismo nombre colisionan en `slug`, que es además la `key` de React | `slugify` recibe los slugs ya tomados y agrega `-2`, `-3`… |
| La máscara y las reglas de fecha son la mayor concentración de lógica de la spec | Se concentran en `add-child-modal.tsx` en funciones pequeñas, con un criterio de aceptación por regla |

## What is **not** in this spec

- Persistencia, API o base de datos: lo agregado se pierde al recargar.
- Editar o eliminar un niño existente.
- Perfil propio del niño nuevo (todas las tarjetas van a `/kids/mateo`).
- Filtrar la grilla por sala.
- Mostrar las notas médicas o el listado completo de alergias en alguna pantalla.
- Chips de alergias, foco atrapado dentro del modal y accesibilidad completa.

Cada uno de esos, si llega, va en su propia spec.
