# family-dashboard Specification

## Purpose

Interfaz y funcionalidades específicas para las familias (padres/tutores) de la guardería. Permite a las familias ver actualizaciones sobre sus hijos vinculados, acceder a anuncios generales de la guardería, consultar el resumen diario, y gestionar su cuenta. Las familias tienen acceso de solo lectura a la información de sus propios hijos.

## Requirements

### Requirement: Feed filtrado por hijos vinculados
El sistema DEBE mostrar a las familias un feed con las publicaciones dirigidas exclusivamente a sus hijos vinculados vía la tabla `parent_children`. El feed NO DEBE mostrar publicaciones de otros niños. El feed DEBE incluir un saludo personalizado y filtros por hijo.

#### Scenario: Familia ve solo publicaciones de sus hijos
- **WHEN** un usuario con rol parent accede a `/family/feed`
- **THEN** el sistema muestra solo las publicaciones dirigidas a sus hijos vinculados y los anuncios generales de la sala

#### Scenario: Feed muestra saludo personalizado
- **WHEN** la familia accede al feed
- **THEN** el sistema muestra un header con "TU FAMILIA", saludo "Hola, [nombre]", y subtítulo "Así va el día de hoy"

#### Scenario: Familia puede filtrar por hijo específico
- **WHEN** la familia tiene múltiples hijos vinculados
- **THEN** el sistema muestra pills de filtro (uno por hijo + "Todos") para filtrar el feed

### Requirement: Vista de solo sus hijos
El sistema DEBE permitir a las familias ver una lista con únicamente sus hijos vinculados. NO DEBEN ver información de otros niños. Cada hijo DEBE mostrar su perfil básico con foto, nombre, y sala.

#### Scenario: Familia ve lista filtrada de hijos
- **WHEN** un usuario con rol parent accede a `/family/kids`
- **THEN** el sistema muestra solo los hijos vinculados a ese padre vía `parent_children`

#### Scenario: Familia accede a perfil de su hijo
- **WHEN** la familia hace clic en uno de sus hijos
- **THEN** el sistema navega a `/family/kids/[id]` mostrando perfil del hijo, historial de publicaciones dirigidas a ese niño, y notas relevantes

#### Scenario: Familia NO puede ver perfil de otros niños
- **WHEN** la familia intenta navegar a `/family/kids/[id]` de un niño que NO es su hijo
- **THEN** el sistema muestra un error o redirige a la lista de sus hijos

### Requirement: Anuncios generales y eventos
El sistema DEBE mostrar a las familias una sección de noticias con los anuncios generales de la guardería, eventos programados, y comunicaciones oficiales. Las familias NO DEBEN ver las noticias internas del staff.

#### Scenario: Familia ve anuncios generales
- **WHEN** un usuario con rol parent accede a `/family/notices`
- **THEN** el sistema muestra los anuncios generales, eventos de la guardería, y comunicaciones oficiales

#### Scenario: Familia NO ve noticias internas del staff
- **WHEN** la familia está en la sección de noticias
- **THEN** el sistema NO muestra mensajes internos del equipo, tareas pendientes, ni protocolos del staff

### Requirement: Resumen diario exclusivo
El sistema DEBE proporcionar una ruta `/family/day-summary` exclusiva para familias, donde puedan consultar un resumen consolidado del día de sus hijos (comidas, siestas, actividades, logros).

#### Scenario: Familia accede a resumen diario
- **WHEN** un usuario con rol parent accede a `/family/day-summary`
- **THEN** el sistema muestra un resumen consolidado del día para cada uno de sus hijos vinculados

#### Scenario: Staff NO puede acceder a resumen diario de familia
- **WHEN** un usuario con rol staff intenta navegar a `/family/day-summary`
- **THEN** el sistema redirige al usuario a `/staff/feed` (su ruta correspondiente)

### Requirement: Navegación específica de familia
El sistema DEBE mostrar una navegación lateral (sidebar) y móvil (mobile nav) con las opciones específicas de la familia: Feed, Resumen del día, y Mi cuenta. El sidebar NO DEBE mostrar el botón "Nueva publicación" ni las opciones de Niños o Avisos (en el sentido de gestión).

#### Scenario: Sidebar de familia muestra opciones correctas
- **WHEN** un usuario con rol parent está autenticado
- **THEN** el sidebar muestra los ítems: Feed, Resumen del día, Mi cuenta (sin botón "Nueva publicación")

#### Scenario: Mobile nav de familia muestra opciones correctas
- **WHEN** un usuario con rol parent accede desde dispositivo móvil
- **THEN** la navegación móvil muestra los mismos ítems que el sidebar: Feed, Resumen del día, Mi cuenta

### Requirement: Acceso restringido a rutas de familia
El sistema DEBE restringir el acceso a las rutas `/family/*` exclusivamente a usuarios con rol `parent`. Los usuarios con rol `staff` o `admin` NO DEBEN poder acceder a estas rutas (excepto para verificación de que la familia puede ver sus datos).

#### Scenario: Usuario staff intenta acceder a ruta de familia
- **WHEN** un usuario con rol staff intenta navegar a `/family/feed`
- **THEN** el sistema redirige al usuario a `/staff/feed` (su ruta correspondiente)

#### Scenario: Usuario no autenticado intenta acceder a ruta de familia
- **WHEN** un usuario no autenticado intenta navegar a `/family/kids`
- **THEN** el sistema redirige al usuario a `/login`

### Requirement: Reacciones a publicaciones
El sistema DEBE permitir a las familias reaccionar a las publicaciones de sus hijos (por ejemplo, con corazones). Las reacciones DEBEN almacenarse en la tabla `reactions` y ser visibles para el staff.

#### Scenario: Familia reacciona a publicación de su hijo
- **WHEN** la familia hace clic en el botón de reacción (corazón) en una publicación de su hijo
- **THEN** el sistema registra la reacción en la tabla `reactions` con `post_id`, `user_id`, y `type` (ej. "love")

#### Scenario: Familia NO puede reaccionar a publicaciones de otros niños
- **WHEN** la familia intenta reaccionar a una publicación que NO es de sus hijos
- **THEN** el sistema bloquea la acción (RLS a nivel de base de datos)
