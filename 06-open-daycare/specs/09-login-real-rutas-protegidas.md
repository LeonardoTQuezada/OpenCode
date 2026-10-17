# SPEC 09 — Login real con Supabase y protección de rutas

> **Estado:** Aprobado
> **Depende de:** SPEC 02, SPEC 03, SPEC 08 (base de datos)
> **Fecha:** 2026-10-17
> **Objetivo:** Implementar login real con email y contraseña contra Supabase Auth, proteger todas las rutas salvo las públicas en `proxy.ts` y conectar el cierre de sesión del sidebar.

## Por qué existe esta spec

SPEC 03 dejó `/login` como réplica visual del mockup: el botón "Iniciar sesión" navega a `/` con un `<Link>` sin validar nada, y el logout del sidebar es un enlace inerte a `/login`. SPEC 08 (base de datos) ya creó la tabla `users` con trigger sobre `auth.users`, RLS y un usuario staff de prueba (`edwinTinitana@gmail.com` / `Abc123456@`, email confirmado). Esta spec une ambas cosas: el formulario pasa a autenticar de verdad contra Supabase Auth, `proxy.ts` pasa a exigir sesión para todo lo que no sea pantalla pública, y el logout limpia la sesión. Al hacerlo reemplaza tres criterios de specs anteriores: el que pedía que "Iniciar sesión" navegue a `/` sin validar (SPEC 03), el que pedía que `/family-feed` responda 200 con sidebar (SPEC 03) y el que registraba el logout del sidebar apuntando a `/login` como enlace (SPEC 02/03).

## Scope

**In:**

- Server Actions en `app/login/actions.ts`: `loginAction` (valida campos vacíos, llama `supabase.auth.signInWithPassword` con el cliente de `utils/supabase/server.ts`, redirige a `/` en éxito) y `logoutAction` (`supabase.auth.signOut()` + redirect a `/login`).
- `components/login-form.tsx` (cliente): formulario con `useActionState`, email sin prefill, contraseña con `autoComplete`, botón "Iniciar sesión" que pasa a "Ingresando…" deshabilitado mientras valida, y mensaje de error en rojo `#C5503A` debajo del botón.
- `app/login/page.tsx` pasa a envolver el formulario en `<LoginForm />`; el panel de marca no cambia.
- Protección de rutas en `proxy.ts`: rutas públicas exactamente `/login`, `/activate-account` y `/forgot-password`; todo lo demás requiere sesión. Sin sesión en ruta protegida → redirect a `/login`. Con sesión en ruta pública → redirect a `/`.
- El check de sesión usa el resultado de `supabase.auth.getClaims()`, que `proxy.ts` ya ejecuta: no se agregan llamadas a la BD.
- Los redirects del proxy conservan las cookies de sesión de `supabaseResponse` (para no perder un refresh de token).
- Logout real en `components/sidebar.tsx` (drawer móvil incluido): el `<Link href="/login">` pasa a ser `<form action={logoutAction}>` con botón del mismo estilo.
- Credenciales de prueba: el usuario staff seed de SPEC 08 (`edwinTinitana@gmail.com` / `Abc123456@`).
- Capturas Playwright en `.playwright-mcp/`.
- `npm run lint` y `npm run build` en verde.

**Fuera de alcance (specs futuras):**

- Signup y activación de cuenta reales: `/activate-account` sigue siendo mock (SPEC 03).
- Recuperación de contraseña real: `/forgot-password` sigue siendo placeholder.
- Redirects según rol (staff → `/`, parent → `/family-feed`): solo existe el staff y el rol no decide pantalla.
- Protección por rol de rutas (qué puede ver un parent vs un staff).
- Mostrar el usuario real en la tarjeta del sidebar: sigue "Caro Giménez" hardcodeada.
- Cambio de contraseña, 2FA, "mantener sesión" (lo resuelven las cookies de Supabase).
- Migración de los datos mock (kids, posts) a la BD: siguen en JSON/memoria.

## Data model

Esta spec no introduce tablas ni structsura nueva en la BD: la sesión vive en las cookies que maneja `@supabase/ssr` y el usuario ya existe en `auth.users` + `public.users` (SPEC 08). Lo nuevo es la forma del resultado de las actions:

```ts
// app/login/actions.ts ("use server")
export type LoginResult =
  | { ok: true }
  | { ok: false; message: string };

export async function loginAction(formData: FormData): Promise<LoginResult>;
// Vacíos → { ok:false, message } · error de Supabase → mensaje genérico
// Éxito → redirect("/") (lanza NEXT_REDIRECT, no retorna)

export async function logoutAction(): Promise<never>;
// signOut() + redirect("/login")
```

Conveniones:

- `loginAction` recibe `FormData` para usarse directo como `form action` con `useActionState`.
- Los mensajes de error son únicos (un solo slot visual), en voseo y rojo `#C5503A`:
  - email vacío → "Ingresá tu email."
  - contraseña vacía → "Ingresá tu contraseña."
  - credenciales rechazadas por Supabase → "Email o contraseña incorrectos." (genérico: no distingue usuario inexistente de password mal, por seguridad)
  - cualquier otro error → "No se pudo iniciar sesión. Intentá de nuevo."
- El proxy define la lista de públicas como constante:

```ts
// proxy.ts
const PUBLIC_ROUTES = ["/login", "/activate-account", "/forgot-password"];
```

## Implementation plan

1. `app/login/actions.ts` ("use server"): `loginAction` (lee `email`/`password` del `FormData`, valida vacíos con los mensajes de Data model, `createClient(cookieStore)` + `signInWithPassword`, éxito → `redirect("/")`) y `logoutAction` (`signOut()` + `redirect("/login")`). Compila sin usarse todavía.
2. `components/login-form.tsx` (cliente): `<form action={loginAction}>` + `useActionState`; email vacío con `autoComplete="email"`, password con `autoComplete="current-password"`, botón submit con `pending ? "Ingresando…" : "Iniciar sesión"` y `disabled={isPending}`, mensaje de error en `text-[#C5503A]` debajo del botón. Los links "¿Olvidaste tu contraseña?" y "Activá tu cuenta" quedan intactos.
3. `app/login/page.tsx`: el bloque del formulario renderiza `<LoginForm />`; el panel de marca no cambia. Verificar `/login` sin sesión (es pública, carga normal) y con credenciales seed en el submit.
4. `proxy.ts`: después de `getClaims()`, decidir redirect según sesión + `PUBLIC_ROUTES`, copiando las cookies de `supabaseResponse` a la respuesta de redirección. Verificar en ventana anónima: `/`, `/kids`, `/kids/mateo`, `/my-account`, `/notices`, `/day-summary` y `/family-feed` redirigen a `/login`; `/login`, `/activate-account` y `/forgot-password` cargan.
5. `components/sidebar.tsx`: el Link de logout pasa a `<form action={logoutAction}>` con `<button>` del mismo estilo. Verificar: cerrar sesión desde `/` lleva a `/login` y escribir `/` a mano vuelve a redirigir a `/login`.
6. Verificación final: `npm run lint`, `npm run build`, capturas Playwright (login vacío, error de credenciales, "Ingresando…", redirección anónima, sesión activa) y regresión de `/activate-account`, `/forgot-password` y `/` con sesión.

## Acceptance criteria

- [ ] Con sesión activa (staff seed), `/` renderiza el feed sin redirección.
- [ ] Sin sesión, visitar `/` redirige a `/login` y el formulario queda visible.
- [ ] Sin sesión, `/kids`, `/kids/mateo`, `/my-account`, `/notices`, `/day-summary` y `/family-feed` redirigen a `/login`.
- [ ] Sin sesión, `/login`, `/activate-account` y `/forgot-password` cargan sin redirección.
- [ ] Con sesión activa, entrar a `/login` redirige a `/`.
- [ ] Con sesión activa, entrar a `/activate-account` o `/forgot-password` redirige a `/`.
- [ ] `/login` ya no precarga `caro@opendaycare.com`: el email nace vacío.
- [ ] Con email vacío, "Iniciar sesión" muestra "Ingresá tu email." en `#C5503A` bajo el botón y no navega.
- [ ] Con password vacía (y email con texto), muestra "Ingresá tu contraseña." y no navega.
- [ ] Con credenciales válidas (`edwinTinitana@gmail.com` / `Abc123456@`), el botón muestra "Ingresando…" mientras valida y termina en `/` con la sesión creada (cookies de Supabase presentes).
- [ ] Con password incorrecta, muestra "Email o contraseña incorrectos." bajo el botón y permanece en `/login`.
- [ ] Mientras el submit está en curso, el botón está deshabilitado y su texto es "Ingresando…".
- [ ] Cerrar sesión desde el sidebar de escritorio borra la sesión y navega a `/login`.
- [ ] Cerrar sesión desde el drawer móvil también borra la sesión y navega a `/login`.
- [ ] Tras cerrar sesión, escribir `/` a mano redirige a `/login` (la sesión quedó limpia, no solo la navegación).
- [ ] "¿Olvidaste tu contraseña?" y "Activá tu cuenta" siguen apuntando a `/forgot-password` y `/activate-account`.
- [ ] El panel de marca de `/login` se ve igual que antes (regresión SPEC 03).
- [ ] `/activate-account` y `/forgot-password` se ven y responden igual que antes para un usuario sin sesión (regresión SPEC 03).
- [ ] `/` con sesión se ve igual que antes: feed, sidebar y composer intactos (regresión SPEC 01/06).
- [ ] `npm run lint` y `npm run build` terminan sin errores.
- [ ] Las capturas quedan guardadas en `.playwright-mcp/`.

## Decisions

- **Sí:** rutas protegidas = todo excepto públicas (`/login`, `/activate-account`, `/forgot-password`) — decisión del usuario. Se descartó la lista explícita de protegidas: habría que mantenerla sincronizada con cada ruta nueva.
- **Sí:** destino de redirect siempre `/`, tanto al loguearse como al encontrar sesión en una pública — decisión del usuario. Se descartó el parámetro `next` (volver a la página original) y el redirect por rol (staff/parent): solo existe el staff seed y el rol no decide pantalla todavía.
- **Sí:** logout real en esta spec — decisión del usuario. Se descartó dejar el enlace inerte: quedarían cookies huérfanas y la protección no estaría completa.
- **Sí:** los tres puntos de UX del login (mensaje de error, estado "Ingresando…", sin prefill) — decisión del usuario. Se descartó conservar el prefill `caro@opendaycare.com`: es un email mock inexistente en Supabase.
- **Sí:** Server Action para el envío — decisión del usuario. Precedente en `app/kids/actions.ts`; el submit corre en el server con cookies y `utils/supabase/server.ts`.
- **Sí:** check de sesión con el `getClaims()` que `proxy.ts` ya ejecuta — sin llamadas extra a la BD, siguiendo la guía de Next.js 16 de checks optimistas en proxy.
- **Sí:** mensaje genérico "Email o contraseña incorrectos." para credenciales rechazadas — no se distingue si el email existe, por seguridad.
- **Sí:** validar vacíos en la action (un solo slot de error), no por campo — el mockup de login no define zonas de error por campo.
- **Sí:** conservar las cookies de `supabaseResponse` en los redirects del proxy — sin eso, un refresh de token hecho por `getClaims()` se perdería al redirigir.
- **Sí:** usar el usuario staff seed de SPEC 08 como credencial de prueba; no se crea ningún usuario nuevo.
- **No:** tocar el matcher de `proxy.ts`: el actual ya excluye assets estáticos. Se evaluó agregar `missing: next-router-prefetch` (como sugiere la guía de auth de Next.js para que los prefetch no disparen redirects) — comportamiento aceptable sin eso; decisión del usuario de dejarlo fuera.
- **Verificado con Context7 (Next.js 16.2.9 + `@supabase/ssr`):** el check optimista con `getClaims()` en el proxy es el patrón recomendado (lee de cookies sin network; `getUser()` haría una llamada por request). Copiar los cookies de `supabaseResponse` al redirect es necesario: `@supabase/ssr` confirma que el refresh de sesión ocurre en el proxy y sus `Set-Cookie` viajan en esa respuesta.
- **No:** autenticación client-side con `utils/supabase/client.ts`: todo pasa por el server.
- **No:** mostrar el usuario real en la tarjeta del sidebar (sigue "Caro Giménez" hardcodeada); va en una spec futura cuando se lea `public.users`.

## Risks

| Riesgo | Mitigación |
| --- | --- |
| Un redirect del proxy descarta cookies y pierde un refresh de sesión | Copiar los cookies de `supabaseResponse` a la respuesta de redirección (paso 4) |
| `/family-feed` queda protegida y ahora redirige a `/login` sin sesión | Esperado: es una ruta interna. Esta spec reemplaza el criterio de SPEC 03 que pedía 200 con sidebar |
| `/activate-account` y `/forgot-password` siguen públicas con lógica mock | Son mockups sin datos sensibles; el flujo real va en su propia spec |
| `getClaims()` en el proxy ya corría en todos los requests; ahora además condiciona redirects | No se agregan llamadas a la BD; el matcher ya excluye assets. Criterio de regresión sobre `/` y `/login` |
| El botón de logout pasa de `<Link>` a `<form>` dentro de un componente cliente | Mismo estilo visual; criterio de regresión del sidebar y drawer móvil |

## What is **not** in this spec

- Signup y activación de cuenta reales (`/activate-account` sigue mock).
- Recuperación de contraseña real (`/forgot-password` sigue placeholder).
- Redirects o protecciones por rol (staff vs parent).
- Usuario real en la tarjeta del sidebar.
- Cambio de contraseña, 2FA, sesiones "persistentes" propias.
- Migración de kids/posts desde JSON a la BD.

Cada uno de esos, si llega, va en su propia spec.
