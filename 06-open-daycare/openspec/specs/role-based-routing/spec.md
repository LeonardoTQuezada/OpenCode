# role-based-routing Specification

## Purpose

Detección de rol y enrutamiento protegido basado en el rol del usuario autenticado. El sistema detecta el rol del usuario (staff, parent, admin) desde la sesión de Supabase y redirige automáticamente a las rutas correspondientes (`/staff/*` o `/family/*`). Protege las rutas para que cada rol solo pueda acceder a lo que le corresponde.

## Requirements

### Requirement: Detección de rol en proxy
El sistema DEBE detectar el rol del usuario autenticado en `proxy.ts` leyendo el perfil desde la sesión de Supabase. El rol DEBE obtenerse de la tabla `users.role` después de autenticar con `supabase.auth.getUser()`.

#### Scenario: Proxy detecta rol de usuario autenticado
- **WHEN** un usuario autenticado hace una request
- **THEN** el proxy lee el rol desde `users.role` y lo almacena en el contexto de la request para uso en layouts y páginas

#### Scenario: Proxy maneja usuario no autenticado
- **WHEN** un usuario no autenticado hace una request a una ruta protegida
- **THEN** el proxy redirige al usuario a `/login`

### Requirement: Redirección automática desde root
El sistema DEBE redirigir automáticamente la ruta raíz `/` a la ruta correspondiente según el rol del usuario: `/staff/feed` para staff/admin, `/family/feed` para parent.

#### Scenario: Usuario staff accede a root
- **WHEN** un usuario con rol staff o admin accede a `/`
- **THEN** el sistema redirige a `/staff/feed`

#### Scenario: Usuario parent accede a root
- **WHEN** un usuario con rol parent accede a `/`
- **THEN** el sistema redirige a `/family/feed`

#### Scenario: Usuario no autenticado accede a root
- **WHEN** un usuario no autenticado accede a `/`
- **THEN** el sistema redirige a `/login`

### Requirement: Protección de rutas de staff
El sistema DEBE proteger todas las rutas bajo `/staff/*` para que solo sean accesibles por usuarios con rol `staff` o `admin`. Si un usuario con rol `parent` intenta acceder, DEBE ser redirigido a `/family/feed`.

#### Scenario: Usuario parent intenta acceder a /staff/feed
- **WHEN** un usuario con rol parent navega a `/staff/feed`
- **THEN** el sistema redirige a `/family/feed`

#### Scenario: Usuario staff accede a /staff/kids
- **WHEN** un usuario con rol staff navega a `/staff/kids`
- **THEN** el sistema permite el acceso y muestra la página correspondiente

### Requirement: Protección de rutas de familia
El sistema DEBE proteger todas las rutas bajo `/family/*` para que solo sean accesibles por usuarios con rol `parent`. Si un usuario con rol `staff` o `admin` intenta acceder, DEBE ser redirigido a `/staff/feed`.

#### Scenario: Usuario staff intenta acceder a /family/feed
- **WHEN** un usuario con rol staff navega a `/family/feed`
- **THEN** el sistema redirige a `/staff/feed`

#### Scenario: Usuario parent accede a /family/kids
- **WHEN** un usuario con rol parent navega a `/family/kids`
- **THEN** el sistema permite el acceso y muestra la página correspondiente

### Requirement: Layout único con contexto de rol
El sistema DEBE proporcionar un layout raíz (`/app/layout.tsx`) que lee el rol del usuario desde la sesión y lo pasa como prop a los componentes compartidos (`Sidebar`, `MobileNav`). El layout DEBE renderizar el contenido de la ruta activa dentro de `<main>`.

#### Scenario: Layout pasa rol a componentes compartidos
- **WHEN** cualquier página se renderiza
- **THEN** el layout lee el rol de la sesión y pasa `role="staff"` o `role="family"` a `<Sidebar />` y `<MobileNav />`

#### Scenario: Layout renderiza contenido de la ruta
- **WHEN** el usuario navega a `/staff/feed` o `/family/feed`
- **THEN** el layout renderiza el contenido específico de esa ruta dentro de `<main>`, manteniendo el sidebar y mobile nav consistentes

### Requirement: Componentes compartidos role-aware
Los componentes `Sidebar` y `MobileNav` DEBEN aceptar un prop `role` y renderizar condicionalmente los ítems de navegación según el rol. El staff ve: Feed, Niños, Avisos, Mi cuenta + botón "Nueva publicación". La familia ve: Feed, Resumen del día, Mi cuenta (sin botón de publicar).

#### Scenario: Sidebar renderiza opciones de staff
- **WHEN** `<Sidebar role="staff" />` se renderiza
- **THEN** muestra los ítems: Feed, Niños, Avisos, Mi cuenta, y el botón "Nueva publicación"

#### Scenario: Sidebar renderiza opciones de familia
- **WHEN** `<Sidebar role="family" />` se renderiza
- **THEN** muestra los ítems: Feed, Resumen del día, Mi cuenta (sin botón "Nueva publicación")

#### Scenario: MobileNav renderiza opciones según rol
- **WHEN** `<MobileNav role="staff" />` o `<MobileNav role="family" />` se renderiza
- **THEN** muestra los mismos ítems que el sidebar correspondiente al rol

### Requirement: Manejo de rutas obsoletas
El sistema DEBE eliminar o redirigir las rutas obsoletas que quedan reemplazadas por la nueva estructura: `/family-feed`, `/kids` (sin prefijo de rol), `/notices` (sin prefijo de rol). Estas rutas NO DEBEN existir en la estructura final.

#### Scenario: Ruta /family-feed es removida
- **WHEN** el sistema está desplegado con la nueva estructura
- **THEN** la ruta `/family-feed` NO existe (fue reemplazada por `/family/feed`)

#### Scenario: Ruta /kids sin prefijo es removida
- **WHEN** el sistema está desplegado con la nueva estructura
- **THEN** las rutas `/kids` y `/notices` sin prefijo NO existen (fueron reemplazadas por `/staff/*` y `/family/*`)
