# Proposal

## Why

Actualmente la aplicación muestra la misma interfaz para todos los usuarios (staff y familias), lo que genera confusión y acceso inapropiado a funcionalidades. El staff ve rutas diseñadas para familias y viceversa. Los mockups de referencia muestran claramente dos experiencias distintas, pero la implementación actual no las separa. Es necesario implementar una arquitectura de rutas separadas por rol para proporcionar experiencias personalizadas y seguras.

## What Changes

- **Nueva estructura de rutas por rol**: Crear directorios `/app/staff/` y `/app/family/` con rutas específicas para cada rol
- **Redirección basada en rol**: Actualizar `proxy.ts` para detectar el rol del usuario y redirigir automáticamente a `/staff/*` o `/family/*`
- **Root route como redirect**: La ruta `/` redirige automáticamente según el rol detectado
- **Staff routes**: `/staff/feed`, `/staff/kids`, `/staff/kids/[id]`, `/staff/notices`, `/staff/my-account`
- **Family routes**: `/family/feed`, `/family/kids`, `/family/kids/[id]`, `/family/notices`, `/family/day-summary`, `/family/my-account`
- **Layout único con contexto de rol**: El layout raíz lee el rol de la sesión y lo pasa a componentes compartidos (`Sidebar`, `MobileNav`)
- **Componentes role-aware**: Actualizar componentes compartidos para recibir prop `role` y renderizar condicionalmente
- **Filtrado de datos por rol**: Staff ve todos los niños, familias solo ven sus hijos vinculados vía `parent_children`
- **Notices diferenciadas**: Staff ve noticias internas + noticias de familia; familias solo ven anuncios generales
- **Day summary exclusivo**: Ruta `/family/day-summary` solo accesible para familias
- **Eliminar rutas obsoletas**: Remover `/app/family-feed/` y rutas que quedan reemplazadas por la nueva estructura

## Capabilities

### New Capabilities

- `staff-dashboard`: Interfaz y funcionalidades específicas para el staff de la guardería. Incluye feed completo de la sala, gestión de todos los niños, noticias internas del equipo, tareas pendientes, protocolos, y capacidad de publicar actualizaciones. El staff puede ver todas las noticias (internas + familias).

- `family-dashboard`: Interfaz y funcionalidades específicas para las familias. Incluye feed filtrado por hijos vinculados, vista de solo sus hijos, anuncios generales de la guardería, eventos, comunicaciones oficiales, y resumen diario exclusivo. Las familias no pueden publicar ni ver datos de otros niños.

- `role-based-routing`: Detección de rol y enrutamiento protegido. El proxy detecta el rol del usuario autenticado y redirige a las rutas correspondientes (`/staff/*` para staff/admin, `/family/*` para parent). Protege las rutas para que cada rol solo acceda a lo que le corresponde.

### Modified Capabilities

(Ninguna - este es el primer conjunto de specs del proyecto)

## Impact

- **Estructura de archivos**: Reorganización completa de `/app/` con nuevos directorios `staff/` y `family/`
- **Componentes**: Actualización de `Sidebar`, `MobileNav`, `FeedScreen`, `PostCard`, `KidsScreen` para aceptar prop `role`
- **Proxy/Middleware**: Modificación de `proxy.ts` para implementar detección de rol y redirección
- **Autorización**: Verificación de rol en cada página (server-side) y en componentes (client-side)
- **RLS (Supabase)**: Las políticas ya implementadas aseguran aislamiento de datos a nivel de base de datos
- **Breaking changes**: Las rutas existentes (`/`, `/kids`, `/notices`, `/family-feed`) cambian a `/staff/*` o `/family/*`. Usuarios con bookmarks necesitarán actualizar.
