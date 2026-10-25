// Helpers para el feed familiar (SPEC 03): consulta de posts filtrados por
// hijos vinculados vía parent_children. Solo servidor.

import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";

/** Obtiene los IDs de los hijos vinculados al padre autenticado vía parent_children. */
export async function getLinkedChildrenIds(parentId: string): Promise<string[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("parent_children")
    .select("child_id")
    .eq("parent_id", parentId);

  if (error) {
    throw new Error(`No se pudieron cargar los hijos vinculados: ${error.message}`);
  }

  return (data ?? []).map((row) => row.child_id);
}

/** Verifica si un child está vinculado al padre autenticado. */
export async function isChildLinkedToParent(
  parentId: string,
  childId: string,
): Promise<boolean> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("parent_children")
    .select("child_id")
    .eq("parent_id", parentId)
    .eq("child_id", childId)
    .maybeSingle();

  if (error) {
    throw new Error(`No se pudo verificar el vínculo: ${error.message}`);
  }

  return data !== null;
}
