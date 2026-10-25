# staff-dashboard Specification

## Purpose

Interfaz y funcionalidades específicas para el staff de la guardería. Permite al staff gestionar la sala, publicar actualizaciones sobre los niños, administrar noticias internas del equipo y ver toda la información relevante de la guardería. El staff tiene permisos completos de lectura y escritura sobre los datos de la sala.

## Requirements

### Requirement: Feed completo de la sala
El sistema DEBE mostrar al staff un feed con todas las publicaciones de la sala, incluyendo publicaciones dirigidas a niños específicos y anuncios generales. El feed DEBE mostrar el nombre del niño, la maestra que publicó, y el tipo de publicación.

#### Scenario: Staff ve todas las publicaciones de la sala
- **WHEN** un usuario con rol staff accede a `/staff/feed`
- **THEN** el sistema muestra todas las publicaciones de la sala ordenadas por fecha, incluyendo publicaciones individuales por niño y anuncios generales

#### Scenario: Staff puede publicar actualizaciones
- **WHEN** el staff hace clic en "Nueva publicación" desde el feed
- **THEN** el sistema abre el modal de creación de publicación donde puede seleccionar tipo, niño(s) objetivo, y contenido

#### Scenario: Staff puede editar sus publicaciones
- **WHEN** el staff ve una publicación que él creó
- **THEN** el sistema muestra un botón "Editar" junto a la publicación

### Requirement: Gestión completa de niños
El sistema DEBE permitir al staff ver la lista completa de todos los niños inscritos en la guardería, acceder al perfil detallado de cada niño, y gestionar los vínculos con sus padres/tutores.

#### Scenario: Staff ve lista completa de niños
- **WHEN** un usuario con rol staff accede a `/staff/kids`
- **THEN** el sistema muestra todos los niños activos de la guardería con su nombre, foto, sala, y estado

#### Scenario: Staff accede a perfil detallado de niño
- **WHEN** el staff hace clic en un niño de la lista
- **THEN** el sistema navega a `/staff/kids/[id]` mostrando perfil completo, historial de publicaciones, notas médicas, alergias, y lista de padres vinculados

#### Scenario: Staff puede vincular padres a niños
- **WHEN** el staff está en el perfil de un niño y hace clic en "Vincular padre"
- **THEN** el sistema abre el modal para crear invitación con datos del padre, email, parentesco, y genera código de activación

### Requirement: Noticias internas y de familia
El sistema DEBE mostrar al staff una sección de noticias que incluya tanto las noticias internas del equipo (mensajes, tareas pendientes, protocolos) como todas las noticias dirigidas a las familias (anuncios generales, eventos, comunicaciones oficiales).

#### Scenario: Staff ve noticias internas
- **WHEN** un usuario con rol staff accede a `/staff/notices`
- **THEN** el sistema muestra las noticias internas del equipo, incluyendo mensajes, tareas pendientes, y protocolos

#### Scenario: Staff también ve noticias de familia
- **WHEN** el staff está en la sección de noticias
- **THEN** el sistema también muestra los anuncios generales, eventos de la guardería, y comunicaciones oficiales que ven las familias

### Requirement: Navegación específica de staff
El sistema DEBE mostrar una navegación lateral (sidebar) y móvil (mobile nav) con las opciones específicas del staff: Feed, Niños, Avisos, y Mi cuenta. El botón "Nueva publicación" DEBE estar visible en la navegación del staff.

#### Scenario: Sidebar de staff muestra opciones correctas
- **WHEN** un usuario con rol staff está autenticado
- **THEN** el sidebar muestra los ítems: Feed, Niños, Avisos, Mi cuenta, y el botón "Nueva publicación"

#### Scenario: Mobile nav de staff muestra opciones correctas
- **WHEN** un usuario con rol staff accede desde dispositivo móvil
- **THEN** la navegación móvil muestra los mismos ítems que el sidebar: Feed, Niños, Avisos, Mi cuenta

### Requirement: Acceso restringido a rutas de staff
El sistema DEBE restringir el acceso a las rutas `/staff/*` exclusivamente a usuarios con rol `staff` o `admin`. Los usuarios con rol `parent` NO DEBEN poder acceder a estas rutas.

#### Scenario: Usuario parent intenta acceder a ruta de staff
- **WHEN** un usuario con rol parent intenta navegar a `/staff/feed`
- **THEN** el sistema redirige al usuario a `/family/feed` (su ruta correspondiente)

#### Scenario: Usuario no autenticado intenta acceder a ruta de staff
- **WHEN** un usuario no autenticado intenta navegar a `/staff/kids`
- **THEN** el sistema redirige al usuario a `/login`
