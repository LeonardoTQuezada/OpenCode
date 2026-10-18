// Perfil del usuario de la sesión para la UI (sidebar, avatares).
// Server-side: usa el cliente de cookies de @supabase/ssr. Devuelve `null`
// cuando no hay sesión (p. ej. en /login) o si la fila `users` no existe.

import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";

export type UserProfile = {
  /** Nombre completo del usuario (o email como fallback). */
  fullName: string;
  /** Inicial para avatares (primera letra del nombre). */
  initials: string;
  /** Rol traducido a español: Administrador / Maestro / Familia. */
  roleLabel: string;
  /** Nombre corto de la guardería (p. ej. "Soles"), para la línea de rol. */
  daycareShort: string;
};

const ROLE_LABELS: Record<string, string> = {
  admin: "Administrador",
  staff: "Maestro",
  parent: "Familia",
};

/**
 * Lee el perfil del usuario autenticado (`public.users` + `daycares`).
 * La RLS `users_read_own_daycare` permite leer la propia fila.
 * Sin sesión → `null`.
 */
export async function getSessionProfile(): Promise<UserProfile | null> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data } = await supabase
    .from("users")
    .select("full_name, role, daycares(name)")
    .eq("id", user.id)
    .maybeSingle();

  // Sin fila en `users` (o sin join): fallback al email de auth.
  const fullName = data?.full_name || user.email || "—";
  const daycareName =
    data?.daycares && typeof data.daycares === "object"
      ? String((data.daycares as { name?: unknown }).name ?? "")
      : "";

  return {
    fullName,
    initials: fullName.trim().charAt(0).toUpperCase() || "?",
    roleLabel: data ? (ROLE_LABELS[data.role] ?? data.role) : "",
    // "Guardería Sala Soles" → "Soles" (como en el mockup "Maestra · Soles")
    daycareShort: daycareName.replace(/^(?:(?:Guardería|Sala)\s+)+/i, ""),
  };
}
