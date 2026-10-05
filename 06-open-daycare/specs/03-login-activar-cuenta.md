# SPEC 03 — Pantallas de Login y Activación de cuenta

> **Estado:** Implementado
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-10-01
> **Objetivo:** Replicar las pantallas `references/pantallas/login.dc.html` y `references/pantallas/activar-cuenta.dc.html` como rutas `/login` y `/activate-account`, sin el selector de rol y sin autenticación real.

## Por qué existe esta spec

SPEC 02 dejó `/login` como placeholder con sidebar y `h1`. Esta spec lo reemplaza por la pantalla real (diseño de dos paneles, sin sidebar) y agrega la pantalla de activación de cuenta con su validación, más dos rutas placeholder que los mockups necesitan para navegar (`/forgot-password` y `/family-feed`). Al hacerlo, el criterio de SPEC 02 que pedía "`/login` renderiza sidebar con `active` correcto y un `h1`" queda reemplazado por esta spec.

## Scope

**In:**

- Ruta `/login`: pantalla pública de dos paneles (panel de marca coral + formulario), sin selector "INGRESO COMO" (ni Personal ni Familia), sin sidebar ni MobileNav.
- Enlaces de `/login`: "Iniciar sesión" → `/` (sin validación), "¿Olvidaste tu contraseña?" → `/forgot-password`, "Activá tu cuenta" → `/activate-account`.
- Ruta `/activate-account`: pantalla centrada con tarjeta de invitación, campos precargados como el mockup, checkbox de consentimiento funcional y validación por campo.
- Validación en `/activate-account`: código y email obligatorios (email con formato), contraseña mínimo 6 caracteres; mensaje por campo en rojo `#C5503A`; el botón solo navega a `/family-feed` si todo es válido.
- Datos mock de la invitación en `lib/invitation.ts` (tipados, sin persistencia ni API).
- Icono nuevo en `components/icons.tsx`: `CheckIcon`.
- Tokens `@theme` en `app/globals.css` para los colores nuevos (fondo de página público, bordes de input, foco, panel de marca, consentimiento).
- Rutas placeholder: `/forgot-password` (centrada, sin sidebar, `h1` "Recuperar contraseña") y `/family-feed` (sidebar con `active` + `h1` "Feed familiar").
- Responsive: en <768px el panel de marca de `/login` se oculta y solo queda el formulario.
- `npm run lint` y `npm run build` en verde.

**Fuera de alcance (specs futuras):**

- Autenticación real: verificar credenciales, sesiones, tokens.
- Recuperación de contraseña real (el flujo de `/forgot-password`).
- El feed familiar (`/family-feed` hoy es placeholder con sidebar + `h1`).
- Base de datos, API o persistencia de cualquier tipo.
- Envío real del formulario de activación (validación del código contra un servidor).
- El selector de rol Personal/Familia del mockup de login (decidido: no se implementa).
- Estados de error del servidor ("código inválido", etc.).

## Data model

Todo vive en `lib/invitation.ts`. No hay persistencia: son constantes hardcodeadas.

```ts
export type Invitation = {
  code: string;        // "7K4P9"
  email: string;       // "lucia.fernandez@gmail.com"
  kidName: string;     // "Mateo"
  kidInitial: string;  // "M"
  roomLabel: string;   // "Mateo · Sala Soles"
  avatarBg: string;    // clase Tailwind, ej. "bg-kid-blue"
  avatarInk: string;   // clase Tailwind, ej. "text-kid-blue-ink"
};

export const INVITATION: Invitation;
```

Convenios:

- El email por defecto de `/login` (`caro@opendaycare.com`) vive inline en la página; no comparte datos con la invitación.
- Los mensajes de error de la validación viven en el componente cliente, no en el modelo.

## Implementation plan

1. `app/globals.css`: agregar tokens `@theme` para las pantallas públicas: `--color-page` (`#fbf4ec`), `--color-input-border` (`#eadfd0`), `--color-input-focus` (`#f2a78e`), `--color-panel-start` (`#f6a98e`), `--color-panel-end` (`#ec7e62`), `--color-consent-bg` (`#fbf1d6`), `--color-consent-ink` (`#8a7234`), `--color-consent` (`#5fb97e`) y la sombra del botón de login. El feed sigue renderizando igual. Verificar `/`.
2. `components/icons.tsx`: añadir `CheckIcon` (mismo estilo SVG que los existentes).
3. `lib/invitation.ts`: crear tipo `Invitation` y la constante `INVITATION` con los textos exactos del mockup. Compila sin usarse todavía.
4. `app/login/page.tsx`: reemplazar el placeholder por la pantalla real: grid `1.05fr 1fr` a pantalla completa, panel izquierdo con degradado `155deg #F6A98E 0% → #F2937A 45% → #EC7E62 100%`, círculos decorativos, logo `SunIcon` + "OpenDayCare", titular "El día de cada niño, compartido con su familia." y pie "🌿 Guardería Sala Soles"; panel derecho con formulario (sin bloque "INGRESO COMO"): `h2` "Iniciar sesión", email `defaultValue="caro@opendaycare.com"`, contraseña con placeholder "••••••••", "¿Olvidaste tu contraseña?" → `/forgot-password`, botón "Iniciar sesión" → `/` y "Activá tu cuenta" → `/activate-account`. Verificar `/login` en desktop y <768px (panel oculto).
5. `components/activate-form.tsx` (cliente): campos con `defaultValue` del mockup (código `7K4P9`, email `lucia.fernandez@gmail.com`, contraseña `contraseña`), checkbox de consentimiento marcado por defecto que alterna con `useState`, validación al enviar (código no vacío, email no vacío y con `@`, contraseña ≥ 6), mensaje de error por campo en `text-coral-deep` debajo del input; si es válida, navega a `/family-feed` con `router.push`. Verificar que con campos vacíos no navega y muestra los mensajes.
6. `app/activate-account/page.tsx`: pantalla centrada (max-w 440px) con tile del logo, `h1` "Bienvenida a OpenDayCare", tarjeta de invitación desde `INVITATION` y `ActivateForm`. Verificar `/activate-account`.
7. Placeholders: `app/forgot-password/page.tsx` (centrado sin sidebar, `h1` "Recuperar contraseña") y `app/family-feed/page.tsx` (Sidebar `active="feed"` + `MobileNav` + `h1` "Feed familiar"). Verificar que ambas rutas responden 200.
8. Verificación final: `npm run lint`, `npm run build` y comparación visual de `/login` y `/activate-account` contra los `.dc.html` (desktop y <768px), más regresión de `/` y `/kids`.

## Acceptance criteria

- [x] `npm run dev` sirve `/login` sin errores en consola.
- [x] `/login` renderiza los dos paneles: fondo `#FBF4EC`, panel izquierdo con degradado `155deg, #F6A98E 0%, #F2937A 45%, #EC7E62 100%`, logo "OpenDayCare", titular "El día de cada niño, compartido con su familia." y pie "🌿 Guardería Sala Soles".
- [x] `/login` NO muestra el bloque "INGRESO COMO" ni los botones "Personal" / "Familia".
- [x] El email de `/login` tiene por defecto `caro@opendaycare.com` y la contraseña usa placeholder "••••••••".
- [x] "¿Olvidaste tu contraseña?" apunta a `/forgot-password` y "Activá tu cuenta" apunta a `/activate-account`.
- [x] El botón "Iniciar sesión" navega a `/` sin validar nada.
- [x] Por debajo de 768px el panel izquierdo de `/login` no se muestra y el formulario ocupa el ancho.
- [x] `npm run dev` sirve `/activate-account` con `h1` "Bienvenida a OpenDayCare" y la tarjeta "Te invitaron a seguir a / Mateo · Sala Soles" (datos de `lib/invitation.ts`).
- [x] `/activate-account` muestra precargados el código `7K4P9`, el email `lucia.fernandez@gmail.com` y la contraseña.
- [x] El checkbox de consentimiento ("Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de la app.") nace marcado y alterna al hacer clic.
- [x] Con el código vacío, el botón "Activar mi cuenta" no navega y muestra un mensaje de error en rojo `#C5503A` bajo ese campo.
- [x] Con la contraseña vacía o con menos de 6 caracteres, no navega y muestra mensaje bajo ese campo.
- [x] Con el email sin `@`, no navega y muestra mensaje bajo ese campo.
- [x] Con todos los campos válidos, "Activar mi cuenta" navega a `/family-feed`.
- [x] Al enfocar cualquier input de `/login` o `/activate-account` su borde pasa a `#F2A78E`.
- [x] "¿Ya tenés cuenta? Iniciar sesión" de `/activate-account` apunta a `/login`.
- [x] `/forgot-password` responde 200, está centrada sin sidebar y muestra `h1` "Recuperar contraseña".
- [x] `/family-feed` responde 200 con sidebar (ítem "Feed" activo) e `h1` "Feed familiar".
- [x] El logout del sidebar en `/` y `/kids` sigue apuntando a `/login` (regresión SPEC 02).
- [x] `/` (feed) y `/kids` se ven igual que antes (regresión SPEC 01 y 02).
- [x] `npm run lint` y `npm run build` terminan sin errores.

## Decisions

- **Sí:** sin selector de rol Personal/Familia (decisión del usuario). `/login` siempre apunta a `/`.
- **Sí:** ruta `/activate-account` en inglés, coherente con `/add-child`, `/link-parent`, `/my-account` de SPEC 02.
- **Sí:** "Iniciar sesión" navega a `/` sin validar (decisión del usuario). La autenticación real va en otra spec.
- **Sí:** placeholder `/forgot-password` centrado sin sidebar con `h1` "Recuperar contraseña" (decisión del usuario), porque es una pantalla pública.
- **Sí:** placeholder `/family-feed` con sidebar + `h1` "Feed familiar" (decisión del usuario); recibe `active="feed"` porque no existe ítem de nav familiar.
- **Sí:** validación por campo con mensajes en rojo `#C5503A` (decisión del usuario). Textos: "Ingresá el código de invitación.", "Ingresá tu email.", "Ingresá un email válido.", "Usá al menos 6 caracteres.".
- **Sí:** contraseña mínimo 6 caracteres (decisión del usuario).
- **Sí:** campos precargados iguales al mockup, incluido el checkbox marcado (decisión del usuario).
- **Sí:** el borde naranja `#F2A78E` de "CREAR CONTRASEÑA" se interpreta como estado de foco, no como borde fijo (decisión del usuario).
- **Sí:** datos de invitación en `lib/invitation.ts` (decisión del usuario); el email del login queda inline porque no se comparte con nada.
- **Sí:** `/login` y `/activate-account` sin sidebar: son pantallas públicas y el mockup no las muestra.
- **No:** TSX con estilos inline 1:1. Se sigue el patrón de SPEC 01/02: Tailwind utilities + tokens `@theme`.
- **No:** datos ni lógica en `/family-feed` y `/forgot-password`; solo placeholders.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Reemplazar el placeholder `/login` con sidebar rompe el criterio de SPEC 02 | Criterio de regresión sobre `/` y `/kids`; esta spec deja constancia de que reemplaza ese criterio |
| El logout del sidebar apunta a `/login`, que ahora es pantalla pública sin sidebar | Esperado: el enlace sigue funcionando, solo cambia el destino |
| Los mensajes de error no existen en el mockup estático | Se reutiliza el rojo del proyecto `#C5503A`; la comparación visual es solo del estado sin errores |
| Ocultar el panel de marca en móvil se aleja del mockup (que es desktop) | Decisión tomada en fase de preguntas; verificar en <768px que el formulario conserva sus medidas |

## What is **not** in esta spec

- Autenticación real, sesiones o verificación de credenciales.
- Recuperación de contraseña real (solo placeholder `/forgot-password`).
- El feed familiar real (solo placeholder `/family-feed`).
- Base de datos, API o persistencia.
- El selector de rol Personal/Familia del mockup de login.
- Envío del formulario de activación a un servidor.

Cada uno de esos, si llega, va en su propia spec.
