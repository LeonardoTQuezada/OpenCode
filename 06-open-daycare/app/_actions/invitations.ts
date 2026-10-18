// Server Actions de invitaciones (SPEC 11): creación de invitaciones para
// vincular padres. La autorización la resuelve RLS (staff/admin), más una
// verificación explícita de rol para devolver un error claro en el modal.

"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";
import { generateUniqueCode } from "@/lib/invitation-code";
import { sendInvitationEmail } from "@/lib/email";

export interface Invitation {
  id: string;
  child_id: string;
  invited_by: string;
  full_name: string;
  email: string;
  relationship: "father" | "mother" | "guardian";
  code: string;
  status: "pending" | "accepted" | "expired" | "cancelled";
  expires_at: string;
  accepted_at: string | null;
  created_at: string;
}

export type CreateInvitationInput = {
  childId: string;
  fullName: string;
  email: string;
  relationship: "father" | "mother" | "guardian";
};

export type CreateInvitationResult = {
  code: string;
  expiresAt: string;
  /** false si la invitación se creó pero el email no salió (compartir código a mano). */
  emailSent: boolean;
};

/** Vigencia de la invitación: 7 días (diseño "Vence en 7 días"). */
const INVITATION_TTL_DAYS = 7;

/** Crea el cliente server de Supabase con las cookies de la sesión actual. */
async function getClient() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

/** Crea una invitación para vincular un padre a un niño:
 *  valida rol staff/admin, genera código único, inserta en `invitations`
 *  con expiración de 7 días y envía el email con Resend.
 *  Lanza Error con mensaje visible en el modal si algo falla. */
export async function createInvitation(
  input: CreateInvitationInput,
): Promise<CreateInvitationResult> {
  const supabase = await getClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    throw new Error("Debes iniciar sesión para crear una invitación.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("role, full_name")
    .eq("id", user.id)
    .maybeSingle();

  if (profileError || !profile) {
    throw new Error("No se pudo cargar tu perfil de usuario.");
  }
  if (profile.role !== "staff" && profile.role !== "admin") {
    throw new Error("Solo el staff puede crear invitaciones.");
  }

  const fullName = input.fullName.trim().replace(/\s+/g, " ");
  const email = input.email.trim().toLowerCase();
  if (!fullName || !email) {
    throw new Error("El nombre y el email del padre son obligatorios.");
  }

  // El child debe existir y ser visible (RLS: misma guardería); da error claro.
  const { data: child } = await supabase
    .from("children")
    .select("id, full_name")
    .eq("id", input.childId)
    .maybeSingle();
  if (!child) {
    throw new Error("No se encontró el niño indicado.");
  }

  const code = await generateUniqueCode(supabase);
  const expiresAt = new Date(
    Date.now() + INVITATION_TTL_DAYS * 24 * 60 * 60 * 1000,
  ).toISOString();

  const { error: insertError } = await supabase.from("invitations").insert({
    child_id: input.childId,
    invited_by: user.id,
    full_name: fullName,
    email,
    relationship: input.relationship,
    code,
    expires_at: expiresAt,
  });

  if (insertError) {
    throw new Error(`No se pudo crear la invitación: ${insertError.message}`);
  }

  // El email es best-effort: si falla, la invitación ya existe y el modal
  // muestra el código para compartirlo manualmente (decisión de la spec).
  let emailSent = true;
  try {
    await sendInvitationEmail({
      email,
      childName: child.full_name,
      inviterName: profile.full_name,
      code,
    });
  } catch {
    emailSent = false;
  }

  // Refresca la página del niño para que ParentsSection muestre el pendiente.
  revalidatePath("/kids/[id]", "page");

  return { code, expiresAt, emailSent };
}
