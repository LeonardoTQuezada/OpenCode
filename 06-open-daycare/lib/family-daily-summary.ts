// Helpers para el resumen diario familiar (SPEC 03): consulta de daily_summaries
// para los hijos vinculados al padre. Solo servidor.

import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";

export type DailySummary = {
  id: string;
  child_id: string;
  date: string;
  meals_count: number;
  sleep_minutes: number;
  activities_count: number;
  mood: string | null;
  highlight: string | null;
  created_at: string;
};

/** Obtiene los resúmenes diarios de los hijos vinculados al padre para una fecha específica.
 *  Si no se especifica fecha, usa la fecha actual. */
export async function getDailySummariesForParent(
  parentId: string,
  date?: string,
): Promise<DailySummary[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Obtener IDs de hijos vinculados
  const { data: links, error: linkError } = await supabase
    .from("parent_children")
    .select("child_id")
    .eq("parent_id", parentId);

  if (linkError) {
    throw new Error(`No se pudieron cargar los hijos: ${linkError.message}`);
  }

  const childIds = (links ?? []).map((l) => l.child_id);
  if (childIds.length === 0) return [];

  // Consultar resúmenes diarios para esos children
  const queryDate = date ?? new Date().toISOString().slice(0, 10);
  
  const { data, error } = await supabase
    .from("daily_summaries")
    .select("id, child_id, date, meals_count, sleep_minutes, activities_count, mood, highlight, created_at")
    .in("child_id", childIds)
    .eq("date", queryDate)
    .order("child_id");

  if (error) {
    throw new Error(`No se pudieron cargar los resúmenes: ${error.message}`);
  }

  return (data ?? []) as DailySummary[];
}

/** Obtiene los resúmenes de los últimos N días para los hijos del padre. */
export async function getRecentDailySummariesForParent(
  parentId: string,
  days: number = 7,
): Promise<DailySummary[]> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  // Obtener IDs de hijos vinculados
  const { data: links, error: linkError } = await supabase
    .from("parent_children")
    .select("child_id")
    .eq("parent_id", parentId);

  if (linkError) {
    throw new Error(`No se pudieron cargar los hijos: ${linkError.message}`);
  }

  const childIds = (links ?? []).map((l) => l.child_id);
  if (childIds.length === 0) return [];

  // Calcular fecha de inicio (hace N días)
  const now = new Date();
  const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days + 1);
  
  const { data, error } = await supabase
    .from("daily_summaries")
    .select("id, child_id, date, meals_count, sleep_minutes, activities_count, mood, highlight, created_at")
    .in("child_id", childIds)
    .gte("date", startDate.toISOString().slice(0, 10))
    .lte("date", now.toISOString().slice(0, 10))
    .order("date", { ascending: false })
    .order("child_id");

  if (error) {
    throw new Error(`No se pudieron cargar los resúmenes: ${error.message}`);
  }

  return (data ?? []) as DailySummary[];
}
