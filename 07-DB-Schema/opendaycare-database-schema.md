# OpenDayCare — Esquema de base de datos

Diccionario de tablas para PostgreSQL. Tipos en notación Postgres.
Convención: PK `id` tipo `uuid` (default `gen_random_uuid()`), y `created_at` / `updated_at` tipo `timestamptz`.

**Convención de idioma:** todo lo que se persiste en la base de datos va en **inglés** (enums, tags, códigos). Las etiquetas visibles al usuario se traducen en la capa de UI (español).

---

## ENUMs usados

| Enum                | Valores                                                           |
| ------------------- | ----------------------------------------------------------------- |
| `user_role`         | `staff`, `parent`, `admin`                                        |
| `user_status`       | `pending`, `active`                                               |
| `relationship_type` | `father`, `mother`, `guardian`                                    |
| `invitation_status` | `pending`, `accepted`, `expired`, `cancelled`                     |
| `post_type`         | `meal`, `nap`, `activity`, `achievement`, `photo`, `announcement` |
| `child_status`      | `active`, `archived`                                              |

### Etiquetas UI (español) — no se guardan en DB

| Enum                | Valor DB       | Etiqueta UI |
| ------------------- | -------------- | ----------- |
| `relationship_type` | `father`       | Padre       |
| `relationship_type` | `mother`       | Madre       |
| `relationship_type` | `guardian`     | Tutor       |
| `post_type`         | `meal`         | Comida      |
| `post_type`         | `nap`          | Siesta      |
| `post_type`         | `activity`     | Actividad   |
| `post_type`         | `achievement`  | Logro       |
| `post_type`         | `photo`        | Foto        |
| `post_type`         | `announcement` | Anuncio     |

---

## 1. `daycares`

La guardería como entidad raíz.

| Campo        | Tipo          | Notas                       |
| ------------ | ------------- | --------------------------- |
| `id`         | `uuid` PK     |                             |
| `name`       | `text`        | Ej. "Guardería Sala Soles". |
| `created_at` | `timestamptz` |                             |

---

## 2. `users`

Perfil de aplicación vinculado a **Supabase Auth**. Padres y staff comparten tabla, diferenciados por `role`. La autenticación (email, contraseña, confirmación) vive en `auth.users`; esta tabla solo guarda datos de dominio.

| Campo                       | Tipo                     | Notas                                                                    |
| --------------------------- | ------------------------ | ------------------------------------------------------------------------ |
| `id`                        | `uuid` PK                | FK → `auth.users(id)` ON DELETE CASCADE. Mismo UUID que Supabase Auth.   |
| `daycare_id`                | `uuid` FK → `daycares`   |                                                                          |
| `role`                      | `user_role`              | `staff` / `parent` / `admin`.                                            |
| `status`                    | `user_status`            | Default `active`. El estado previo al signup se modela en `invitations`. |
| `full_name`                 | `text`                   |                                                                          |
| `avatar_url`                | `text`                   | Nullable.                                                                |
| `notify_on_post`            | `boolean` default `true` | Avisos cuando publican.                                                  |
| `daily_summary_enabled`     | `boolean` default `true` | Resumen diario (19:00).                                                  |
| `created_at` / `updated_at` | `timestamptz`            |                                                                          |

> **Implementación Supabase:** crear la fila con un trigger `AFTER INSERT` en `auth.users` (función `SECURITY DEFINER`). Pasar `daycare_id`, `role` y `full_name` vía `raw_user_meta_data` en el signup. Activar RLS en esta tabla. No duplicar `email` ni `password_hash` — Supabase ya los gestiona en `auth.users`.

---

## 3. `rooms` (salas)

Salas de la guardería (Soles, etc.).

| Campo        | Tipo                   | Notas        |
| ------------ | ---------------------- | ------------ |
| `id`         | `uuid` PK              |              |
| `daycare_id` | `uuid` FK → `daycares` |              |
| `name`       | `text`                 | Ej. "Soles". |
| `created_at` | `timestamptz`          |              |

---

## 4. `children` (niños)

Niños inscritos en la guardería.

| Campo                       | Tipo                     | Notas                                            |
| --------------------------- | ------------------------ | ------------------------------------------------ |
| `id`                        | `uuid` PK                |                                                  |
| `room_id`                   | `uuid` FK → `rooms`      | Nullable.                                        |
| `full_name`                 | `text`                   |                                                  |
| `birth_date`                | `date`                   | Fecha de nacimiento.                             |
| `enrolled_at`               | `date`                   | Fecha de ingreso a la guardería.                 |
| `medical_notes`             | `text`                   | Alergias y notas médicas (texto libre).          |
| `allergy_tags`              | `text[]`                 | Etiquetas en inglés, ej. `{peanut}`. _Ver nota._ |
| `photo_consent`             | `boolean` default `true` | Consentimiento de fotos. _Ver nota._             |
| `status`                    | `child_status`           | `active` / `archived` (borrado lógico).          |
| `created_at` / `updated_at` | `timestamptz`            |                                                  |

> **Nota `allergy_tags`:** Array de Postgres por simplicidad. Valores en inglés (`peanut`, `lactose`, `gluten`, etc.); la UI traduce a MANÍ, LACTOSA, etc. Si quieres normalizar, sácalo a una tabla `allergies` + `child_allergies`.

---

## 5. `parent_children` (vínculo padre ↔ niño)

Tabla intermedia. Un padre puede tener varios hijos y un niño varios tutores.

| Campo          | Tipo                   | Notas                             |
| -------------- | ---------------------- | --------------------------------- |
| `id`           | `uuid` PK              |                                   |
| `parent_id`    | `uuid` FK → `users`    |                                   |
| `child_id`     | `uuid` FK → `children` |                                   |
| `relationship` | `relationship_type`    | Parentesco del tutor con el niño. |
| `created_at`   | `timestamptz`          |                                   |
|                |                        | UNIQUE (`parent_id`, `child_id`). |

---

## 6. `invitations` (invitaciones)

El staff genera un código para vincular a un padre con un niño.

| Campo          | Tipo                   | Notas                                             |
| -------------- | ---------------------- | ------------------------------------------------- |
| `id`           | `uuid` PK              |                                                   |
| `child_id`     | `uuid` FK → `children` | A qué niño se vincula.                            |
| `invited_by`   | `uuid` FK → `users`    | Staff que invita.                                 |
| `full_name`    | `text`                 | Nombre del padre/tutor.                           |
| `email`        | `text`                 |                                                   |
| `relationship` | `relationship_type`    |                                                   |
| `code`         | `text` UNIQUE          | Código corto, ej. `7K4P9`.                        |
| `status`       | `invitation_status`    | `pending` / `accepted` / `expired` / `cancelled`. |
| `expires_at`   | `timestamptz`          |                                                   |
| `accepted_at`  | `timestamptz`          | Nullable.                                         |
| `created_at`   | `timestamptz`          |                                                   |

---

## 7. `posts` (publicaciones)

Una publicación puede etiquetar a varios niños (`post_children`) o ser un anuncio general.

| Campo                       | Tipo                | Notas                                                                   |
| --------------------------- | ------------------- | ----------------------------------------------------------------------- |
| `id`                        | `uuid` PK           |                                                                         |
| `author_id`                 | `uuid` FK → `users` | Staff que publica.                                                      |
| `room_id`                   | `uuid` FK → `rooms` | Nullable — para anuncios de sala.                                       |
| `type`                      | `post_type`         | `meal` / `nap` / `activity` / `achievement` / `photo` / `announcement`. |
| `title`                     | `text`              | Nullable (ej. "Anuncio general").                                       |
| `body`                      | `text`              | Descripción.                                                            |
| `published_at`              | `timestamptz`       |                                                                         |
| `created_at` / `updated_at` | `timestamptz`       |                                                                         |

---

## 8. `post_children` (niños etiquetados en la publicación)

Tabla intermedia. Es la clave para filtrar el feed del padre.

| Campo      | Tipo                   | Notas                                 |
| ---------- | ---------------------- | ------------------------------------- |
| `post_id`  | `uuid` FK → `posts`    |                                       |
| `child_id` | `uuid` FK → `children` |                                       |
|            |                        | PK compuesta (`post_id`, `child_id`). |

> El feed del padre = posts con un `child_id` de sus hijos **+** posts de tipo `announcement` de su sala. Esto es lo que resuelve el `GET /posts` filtrado por rol.

---

## 9. `post_photos` (fotos de la publicación)

Fotos adjuntas a una publicación, con soporte para vista a pantalla completa.

| Campo              | Tipo                | Notas                                              |
| ------------------ | ------------------- | -------------------------------------------------- |
| `id`               | `uuid` PK           |                                                    |
| `post_id`          | `uuid` FK → `posts` |                                                    |
| `url`              | `text`              | URL del archivo subido.                            |
| `width` / `height` | `int`               | Nullable — útil para la vista a pantalla completa. |
| `position`         | `int`               | Orden de la foto en la publicación.                |
| `created_at`       | `timestamptz`       |                                                    |

---

## 10. `reactions` (reacciones)

Reacciones de los padres a publicaciones (ej. "Me encanta").

| Campo        | Tipo                | Notas                                                     |
| ------------ | ------------------- | --------------------------------------------------------- |
| `id`         | `uuid` PK           |                                                           |
| `post_id`    | `uuid` FK → `posts` |                                                           |
| `user_id`    | `uuid` FK → `users` | Padre que reacciona.                                      |
| `type`       | `text`              | Ej. `love`.                                               |
| `created_at` | `timestamptz`       |                                                           |
|              |                     | UNIQUE (`post_id`, `user_id`) — una reacción por usuario. |

---

## 11. `comments` (comentarios)

Comentarios en publicaciones.

| Campo                       | Tipo                | Notas          |
| --------------------------- | ------------------- | -------------- |
| `id`                        | `uuid` PK           |                |
| `post_id`                   | `uuid` FK → `posts` |                |
| `author_id`                 | `uuid` FK → `users` | Padre o staff. |
| `body`                      | `text`              |                |
| `created_at` / `updated_at` | `timestamptz`       |                |

---

## 12. `daily_summaries` (resumen del día)

Un registro por niño por día.

| Campo                       | Tipo                   | Notas                                  |
| --------------------------- | ---------------------- | -------------------------------------- |
| `id`                        | `uuid` PK              |                                        |
| `child_id`                  | `uuid` FK → `children` |                                        |
| `date`                      | `date`                 |                                        |
| `meals_count`               | `int`                  | Comidas.                               |
| `sleep_minutes`             | `int`                  | Sueño en minutos (ej. 90 = 1h30).      |
| `activities_count`          | `int`                  | Actividades.                           |
| `mood`                      | `text`                 | Ánimo, ej. "Contenta y participativa". |
| `highlight`                 | `text`                 | "Lo más lindo de hoy".                 |
| `created_at` / `updated_at` | `timestamptz`          |                                        |
|                             |                        | UNIQUE (`child_id`, `date`).           |

> Se puede guardar o **calcularlo** agregando los `posts` del día. Para una clase, la tabla guardada es más fácil de demostrar.

---

## 13. `devices` _(opcional — push notifications)_

Tokens de dispositivos para notificaciones push, opcional.

| Campo        | Tipo                | Notas                      |
| ------------ | ------------------- | -------------------------- |
| `id`         | `uuid` PK           |                            |
| `user_id`    | `uuid` FK → `users` |                            |
| `token`      | `text`              | Token del dispositivo.     |
| `platform`   | `text`              | `ios` / `android` / `web`. |
| `created_at` | `timestamptz`       |                            |

---

## Mapa de relaciones (resumen)

```
daycares 1─┬─< rooms 1──< children
           └─< users

users  >──< children     (vía parent_children, con parentesco)
users  1──< posts        (author)
posts  >──< children     (vía post_children — etiquetado)
posts  1──< post_photos
posts  1──< reactions >── users
posts  1──< comments  >── users
children 1──< daily_summaries
children 1──< invitations
```

**Las tres tablas intermedias (muchos-a-muchos)** son el corazón del modelo

- `parent_children` → quién es familia de quién.
- `post_children` → a qué niños pertenece cada publicación (driver del feed del padre).
- (y `invitations` como puente del flujo de onboarding).
