# Tasks

## 1. Crear estructura de rutas

- [x] 1.1 Crear directorio `/app/staff/` y verificar que existe
- [x] 1.2 Crear directorio `/app/family/` y verificar que existe
- [x] 1.3 Crear páginas placeholder en `/app/staff/`: `feed/page.tsx`, `kids/page.tsx`, `notices/page.tsx`, `my-account/page.tsx` y verificar que cada una renderiza sin errores
- [x] 1.4 Crear páginas placeholder en `/app/family/`: `feed/page.tsx`, `kids/page.tsx`, `notices/page.tsx`, `day-summary/page.tsx`, `my-account/page.tsx` y verificar que cada una renderiza sin errores

## 2. Actualizar componentes compartidos para ser role-aware

- [x] 2.1 Actualizar `components/sidebar.tsx` para aceptar prop `role: "staff" | "family"` y renderizar condicionalmente los ítems de navegación (staff: Feed, Niños, Avisos, Mi cuenta + botón "Nueva publicación"; family: Feed, Resumen del día, Mi cuenta sin botón de publicar). Verificar que el sidebar muestra los ítems correctos según el rol.
- [x] 2.2 Actualizar `components/mobile-nav.tsx` para aceptar prop `role: "staff" | "family"` y renderizar los mismos ítems que el sidebar correspondiente. Verificar que la navegación móvil muestra los ítems correctos según el rol.
- [x] 2.3 Actualizar `components/feed-screen.tsx` para aceptar prop `role: "staff" | "family"` y ajustar el header según el rol (staff: "GUARDERÍA · SALA SOLES" + botón "Nueva publicación"; family: "TU FAMILIA" + saludo personalizado + pills de filtro por hijo). Verificar que el feed muestra el header correcto según el rol.
- [x] 2.4 Actualizar `components/post-card.tsx` para aceptar prop `role: "staff" | "family"` y mostrar/ocultar el botón "Editar" según el rol (staff ve "Editar", family no). Verificar que el botón "Editar" solo aparece para staff.

## 3. Mover contenido existente a nuevas rutas

- [x] 3.1 Mover el contenido de `/app/page.tsx` (FeedScreen actual) a `/app/staff/feed/page.tsx`, ajustando para que use el rol "staff". Verificar que `/staff/feed` muestre el feed completo de la sala.
- [x] 3.2 Mover `/app/kids/page.tsx` a `/app/staff/kids/page.tsx` y crear `/app/family/kids/page.tsx` con filtrado por hijos vinculados. Verificar que staff ve todos los niños y family solo ve sus hijos.
- [x] 3.3 Mover `/app/kids/[id]/page.tsx` a `/app/staff/kids/[id]/page.tsx` y crear `/app/family/kids/[id]/page.tsx` con verificación de que el niño pertenece al padre. Verificar que staff puede ver cualquier niño y family solo puede ver sus hijos.
- [x] 3.4 Crear `/app/staff/notices/page.tsx` con noticias internas del staff + noticias de familia, y `/app/family/notices/page.tsx` solo con anuncios generales. Verificar que cada rol ve el contenido correcto.
- [x] 3.5 Mover `/app/family-feed/page.tsx` a `/app/family/feed/page.tsx` y actualizar para que use el rol "family" y el feed filtrado. Verificar que family-feed muestra publicaciones solo de los hijos vinculados.
- [x] 3.6 Crear `/app/family/day-summary/page.tsx` (nueva ruta) con placeholder para el resumen diario. Verificar que la ruta sea accesible solo para familias.
- [x] 3.7 Mover `/app/my-account/page.tsx` a ambos roles (`/app/staff/my-account/page.tsx` y `/app/family/my-account/page.tsx`) manteniendo el mismo contenido. Verificar que ambas rutas funcionen.

## 4. Implementar detección de rol en proxy.ts

- [ ] 4.1 Actualizar `proxy.ts` para leer el rol del usuario desde la sesión de Supabase (después de `supabase.auth.getUser()`, consultar `users.role`). Verificar que el rol se obtiene correctamente.
- [ ] 4.2 Implementar redirección desde `/` según el rol: staff/admin → `/staff/feed`, parent → `/family/feed`, no autenticado → `/login`. Verificar que la redirección funciona para cada caso.
- [ ] 4.3 Implementar protección de rutas `/staff/*`: si el usuario tiene rol "parent", redirigir a `/family/feed`. Verificar que un parent no puede acceder a rutas de staff.
- [ ] 4.4 Implementar protección de rutas `/family/*`: si el usuario tiene rol "staff" o "admin", redirigir a `/staff/feed`. Verificar que un staff no puede acceder a rutas de familia.

## 5. Actualizar layout raíz con contexto de rol

- [ ] 5.1 Actualizar `/app/layout.tsx` para leer el rol del usuario desde la sesión de Supabase. Verificar que el rol se lee correctamente.
- [ ] 5.2 Pasar el rol como prop a `<Sidebar role={role} />` en el layout. Verificar que el sidebar recibe el rol correcto.
- [ ] 5.3 Pasar el rol como prop a `<MobileNav role={role} />` en el layout. Verificar que el mobile nav recibe el rol correcto.
- [ ] 5.4 Verificar que el layout renderiza el contenido de la ruta activa dentro de `<main>` correctamente para ambas rutas de staff y family.

## 6. Eliminar rutas obsoletas

- [ ] 6.1 Eliminar directorio `/app/family-feed/` y verificar que ya no existe
- [ ] 6.2 Eliminar `/app/kids/` (la versión sin prefijo de rol) y verificar que ya no existe
- [ ] 6.3 Eliminar `/app/notices/` (la versión sin prefijo de rol) y verificar que ya no existe
- [ ] 6.4 Reemplazar `/app/page.tsx` con un redirect simple a `/staff/feed` o `/family/feed` según el rol (o delegar al proxy). Verificar que `/` redirige correctamente.

## 7. Pruebas de integración

- [ ] 7.1 Probar flujo completo de staff: login como staff → redirect a `/staff/feed` → navegar a `/staff/kids` → ver todos los niños → ver sidebar con opciones de staff → verificar que puede publicar
- [ ] 7.2 Probar flujo completo de familia: login como parent → redirect a `/family/feed` → navegar a `/family/kids` → ver solo sus hijos → ver sidebar con opciones de family → verificar que NO puede publicar
- [ ] 7.3 Probar protección de rutas: intentar acceder a `/staff/*` como parent (debe redirigir a `/family/*`) y viceversa
- [ ] 7.4 Probar mobile nav: verificar que la navegación móvil muestra las opciones correctas según el rol en dispositivos móviles
- [ ] 7.5 Probar que los filtros de feed familiar funcionan: familia con múltiples hijos puede filtrar por hijo específico o ver "Todos"

## Workflow follow-up

- Archivar el change después de que la implementación sea revisada y aprobada
- Verificar que las rutas obsoletas fueron eliminadas correctamente
- Actualizar la documentación del proyecto si es necesario
