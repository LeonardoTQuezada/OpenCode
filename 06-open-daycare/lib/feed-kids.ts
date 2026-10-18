// Acceso a los datos del feed: los chips del modal "Nueva publicación"
// salen de los children reales de la guardería (SPEC 10). Solo servidor.

import { cookies } from "next/headers";

import type { Child } from "@/app/_actions/children";
import type { Kid } from "@/lib/kids";
import { ageLabelFromIso, avatarPaletteFor } from "@/lib/kids";
import { createClient } from "@/utils/supabase/server";
import { getSessionDaycareId } from "@/utils/supabase/profile";

/** Children activos de la guardería del usuario (vacío sin sesión). */
export async function getSessionChildren(): Promise<Child[]> {
  const daycareId = await getSessionDaycareId();
  if (!daycareId) return [];

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { data, error } = await supabase
    .from("children")
    .select(
      "id, room_id, full_name, birth_date, enrolled_at, medical_notes, allergy_tags, photo_consent, status, created_at, updated_at",
    )
    .eq("status", "active")
    .order("full_name");

  if (error) throw new Error(`No se pudieron cargar los niños: ${error.message}`);

  return (data ?? []) as Child[];
}

/** Adapta un Child real al shape Kid que consumen los chips del feed. */
export function childToKidChip(child: Child): Kid {
  const palette = avatarPaletteFor(child.id);
  return {
    slug: child.id,
    name: child.full_name,
    initial: child.full_name.charAt(0).toUpperCase(),
    age: ageLabelFromIso(child.birth_date),
    room: "",
    avatarBg: palette.bg,
    avatarInk: palette.ink,
  };
}
