# Design

## Context

Actualmente la aplicación tiene una estructura de rutas plana donde todas las páginas (`/`, `/kids`, `/notices`, `/family-feed`) comparten la misma interfaz sin diferenciación por rol. Los mockups de referencia muestran claramente dos experiencias distintas (staff y familia), pero la implementación actual no las separa.

La base de datos ya tiene el campo `role` en la tabla `users` con valores `staff`, `parent`, `admin`, y las políticas RLS de Supabase ya aíslan los datos correctamente. El siguiente paso es implementar la separación a nivel de rutas y UI.

## Goals / Non-Goals

**Goals:**
- Separar completamente las rutas de staff y familia en directorios distintos (`/app/staff/` y `/app/family/`)
- Implementar redirección automática basada en rol desde la ruta raíz `/`
- Crear un layout único que pase el contexto de rol a componentes compartidos
- Actualizar componentes compartidos (`Sidebar`, `MobileNav`, `FeedScreen`, `PostCard`) para ser role-aware
- Mantener el aislamiento de datos a nivel de RLS (Supabase) como capa de seguridad adicional
- Eliminar rutas obsoletas que quedan reemplazadas

**Non-Goals:**
- No implementar nuevas funcionalidades de negocio (solo reorganizar las existentes)
- No modificar las políticas RLS de Supabase (ya funcionan correctamente)
- No cambiar el esquema de base de datos
- No implementar autenticación adicional (ya existe con Supabase Auth)

## Decisions

### 1. Estructura de rutas: directorios separados por rol

**Decisión**: Crear directorios `/app/staff/` y `/app/family/` con rutas específicas para cada rol.

**Razonamiento**:
- **Alternativa considerada**: Route groups con layouts separados `(staff)/` y `(family)/`. Descartada porque añade complejidad innecesaria y no aporta beneficios sobre directorios simples.
- **Alternativa considerada**: Mismas rutas con UI condicional. Descartada porque dificulta la protección de rutas y hace el código más confuso.
- **Ventajas de directorios separados**: 
  - Protección de rutas clara y explícita
  - Código más organizado y mantenible
  - Fácil de entender para nuevos desarrolladores
  - Permite layouts específicos por rol si se necesitan en el futuro

### 2. Layout único con contexto de rol

**Decisión**: Un solo layout raíz (`/app/layout.tsx`) que lee el rol de la sesión y lo pasa como prop a componentes compartidos.

**Razonamiento**:
- **Alternativa considerada**: Layouts separados para staff y familia. Descartada porque duplicaría código innecesariamente (sidebar, mobile nav, estructura base).
- **Ventajas de layout único**:
  - Menos duplicación de código
  - Más fácil de mantener (cambios en un solo lugar)
  - Componentes compartidos son más reutilizables
  - El rol se pasa como prop, manteniendo los componentes puros y testeables

### 3. Detección de rol en proxy.ts

**Decisión**: Usar `proxy.ts` (Next.js 16 reemplazó `middleware.ts` por `proxy.ts`) para detectar el rol y redirigir.

**Razonamiento**:
- Next.js 16 deprecó `middleware.ts` en favor de `proxy.ts`
- El proxy ya existe en el proyecto (`/proxy.ts`) y maneja la refresh de sesión
- Es el lugar correcto para interceptar requests y redirigir basado en rol
- **Alternativa considerada**: Detectar rol en cada página. Descartada porque sería repetitivo y propenso a errores.

### 4. Componentes role-aware con props

**Decisión**: Componentes compartidos (`Sidebar`, `MobileNav`, `FeedScreen`, `PostCard`) aceptan un prop `role` y renderizan condicionalmente.

**Razonamiento**:
- **Alternativa considerada**: Variantes separadas (`<StaffPostCard />` y `<FamilyPostCard />`). Descartada porque duplicaría mucho código.
- **Ventajas de props**:
  - Menos código duplicado
  - Componentes más flexibles y reutilizables
  - Fácil de extender si se añaden más roles en el futuro
  - TypeScript asegura que el prop se pase correctamente

### 5. Autorización en dos capas

**Decisión**: Verificación de rol en proxy.ts (redirección) + verificación en cada página (server-side) + RLS en base de datos.

**Razonamiento**:
- **Capa 1 (proxy.ts)**: Redirección automática para mejorar UX (usuario no ve páginas que no puede acceder)
- **Capa 2 (páginas)**: Verificación server-side en cada página para seguridad adicional (por si alguien bypassa el proxy)
- **Capa 3 (RLS)**: Aislamiento de datos a nivel de base de datos (última línea de defensa)
- **Defensa en profundidad**: Si una capa falla, las otras siguen protegiendo

### 6. Eliminación de rutas obsoletas

**Decisión**: Eliminar completamente las rutas obsoletas (`/family-feed`, `/kids` sin prefijo, `/notices` sin prefijo) en lugar de mantenerlas con redirects.

**Razonamiento**:
- **Alternativa considerada**: Mantener rutas viejas con redirects. Descartada porque añade complejidad y confusión.
- **Ventajas de eliminación**:
  - Estructura más limpia
  - Menos código que mantener
  - URLs más claras y predecibles
  - Breaking change, pero es necesario para la claridad del sistema

## Risks / Trade-offs

### Risk: Breaking change en URLs

**Riesgo**: Las URLs cambian de `/kids` a `/staff/kids` o `/family/kids`. Usuarios con bookmarks necesitarán actualizar.

**Mitigación**: 
- El redirección automática desde `/` ayuda a mitigar el impacto
- Comunicar el cambio a los usuarios (si ya hay usuarios en producción)
- Como el proyecto aún está en desarrollo, el breaking change es aceptable

### Risk: Complejidad inicial en la migración

**Riesgo**: Mover todas las rutas y actualizar componentes puede ser propenso a errores.

**Mitigación**:
- Hacer la migración en pasos pequeños y verificables
- Usar TypeScript para asegurar que los props se pasen correctamente
- Probar cada ruta después de migrarla
- Mantener las rutas viejas funcionando hasta que las nuevas estén completas (optional)

### Risk: Duplicación de lógica de autorización

**Riesgo**: Verificar el rol en proxy.ts y en cada página puede llevar a duplicación.

**Mitigación**:
- Crear una utility function `getRoleFromSession()` que se use en ambos lugares
- Mantener la lógica de autorización centralizada en un solo módulo
- Documentar claramente las dos capas de verificación

### Risk: Componentes compartidos muy complejos

**Riesgo**: Los componentes con muchos condicionales por rol pueden volverse difíciles de mantener.

**Mitigación**:
- Mantener los condicionales simples (if role === "staff" vs "family")
- Extraer lógica específica de rol a componentes hijos si es necesario
- Usar TypeScript para asegurar que todos los casos estén cubiertos
- Documentar el comportamiento de cada componente según el rol

## Migration Plan

### Fase 1: Crear nueva estructura de rutas
1. Crear directorios `/app/staff/` y `/app/family/`
2. Crear páginas iniciales (placeholders) en cada directorio
3. Verificar que las nuevas rutas sean accesibles

### Fase 2: Mover contenido existente
1. Mover `/app/page.tsx` → `/app/staff/feed/page.tsx` (ajustar)
2. Mover `/app/kids/page.tsx` → `/app/staff/kids/page.tsx`
3. Mover `/app/notices/page.tsx` → ambos roles con contenido filtrado
4. Actualizar `/app/family-feed/page.tsx` → `/app/family/feed/page.tsx`
5. Crear `/app/family/day-summary/page.tsx` (nuevo)

### Fase 3: Actualizar componentes
1. Actualizar `Sidebar` para aceptar prop `role` y renderizar condicionalmente
2. Actualizar `MobileNav` para aceptar prop `role` y renderizar condicionalmente
3. Actualizar `FeedScreen` para aceptar prop `role` y ajustar header/comportamiento
4. Actualizar `PostCard` para aceptar prop `role` y mostrar/ocultar botones de editar
5. Actualizar `KidsScreen` para filtrar por rol

### Fase 4: Implementar proxy.ts con detección de rol
1. Actualizar `proxy.ts` para leer el rol de la sesión
2. Implementar redirección desde `/` según rol
3. Implementar protección de rutas `/staff/*` y `/family/*`
4. Probar redirecciones con diferentes roles

### Fase 5: Actualizar layout raíz
1. Actualizar `/app/layout.tsx` para leer el rol de la sesión
2. Pasar `role` como prop a `<Sidebar />` y `<MobileNav />`
3. Probar que el contexto de rol se propague correctamente

### Fase 6: Eliminar rutas obsoletas
1. Eliminar `/app/family-feed/`
2. Eliminar `/app/kids/` (reemplazado por `/staff/kids` y `/family/kids`)
3. Eliminar `/app/notices/` (reemplazado por `/staff/notices` y `/family/notices`)
4. Reemplazar `/app/page.tsx` con redirect simple

### Rollback Strategy
Si algo falla durante la migración:
- Git permite revertir cambios fácilmente
- Las rutas viejas pueden restaurarse rápidamente
- No hay cambios en base de datos, solo en código
- El rollback es tan simple como `git revert` o `git checkout` anterior

## Open Questions

(No hay preguntas abiertas críticas - todas las decisiones principales están resueltas)
