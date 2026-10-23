---
description: Audita la seguridad de la BD (RLS/roles/funciones) contra fugas de datos entre niños y padres y crea migraciones correctivas sin aplicarlas.
agent: db-security-auditor
---

Audita la seguridad de la base de datos en: `$ARGUMENTS` (vacío → esquema completo).

Aplica el flujo completo del agente db-security-auditor:

1. Carga las skills `supabase` y `supabase-postgres-best-practices` antes de juzgar nada (checklists de seguridad: RLS, `SECURITY DEFINER`, `auth.role()` deprecado, BOLA/IDOR).
2. Consulta docs actuales de Supabase vía `supabase_search_docs` (RLS policies, custom claims, exposed tables, `security_invoker`) — nunca solo datos de entrenamiento.
3. Inventario de solo lectura con `execute_sql`: tablas con RLS/FORCE (`pg_class`), todas las políticas (`pg_policies` con `roles`, `cmd`, `qual`, `with_check`), funciones `SECURITY DEFINER` + quién tiene `EXECUTE`, views sin `security_invoker`, grants a `anon`/`authenticated`, y políticas de `storage.objects` (fotos de niños).
4. Ejecuta `get_advisors` tipo `security` y fusiona con tus hallazgos.
5. Evalúa la **matriz de aislamiento**: `parent` solo ve hijos de su `parent_children` (nunca `medical_notes`/`allergy_tags`/fotos de otros niños ni enlaces de otros padres); `staff`/`admin` solo su `daycare_id`; `anon` nada personal; busca fugas padre↔padre, padre↔staff, entre guarderías, códigos de invitación enumerables y escalada por `raw_user_meta_data` en el trigger de signup.
6. Aplica el checklist de anti-patrones (12 checks, cada hallazgo con severidad y escenario de fuga concreto).
7. Si `execute_sql` acepta múltiples sentencias, prueba el leak en runtime con `begin; set local role authenticated; ...; rollback;` (siempre rollback, jamás escrituras); si no, análisis estático y dilo en el reporte.
8. Por cada fuga confirmada escribe `supabase/migrations/NNN_<descripcion>.sql` idempotente (siguiente número libre, identifiers en inglés, comentarios en español). **NO la apliques** — eso lo hace db-migrator.
9. Termina con el reporte: matriz de aislamiento PASS/FAIL, hallazgos por severidad con tabla + escenario de fuga + archivo de migración creado, fuentes de docs citadas, y el siguiente paso exacto para aplicar las migraciones con db-migrator.
