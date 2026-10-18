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

/** Fila combinada para ParentsSection: padres activos (parent_children) y
 *  pendientes (invitations pending, aún sin fila en parent_children). */
export type ParentEntry = {
  /** parent_children.id si está activo; invitation.id si está pendiente. */
  id: string;
  fullName: string;
  email: string | null;
  relationship: "father" | "mother" | "guardian";
  status: "active" | "pending";
  avatarUrl: string | null;
};

/** Padres de un niño: vínculos activos (con datos de users) + invitaciones
 *  pendientes. RLS limita a usuarios de la misma guardería. */
export async function getParentsByChild(
  childId: string,
): Promise<ParentEntry[]> {
  const supabase = await getClient();

  const [linksResult, invitesResult] = await Promise.all([
    supabase
      .from("parent_children")
      .select(
        "id, relationship, parent:users!parent_children_parent_id_fkey ( full_name, avatar_url )",
      )
      .eq("child_id", childId),
    supabase
      .from("invitations")
      .select("id, full_name, email, relationship")
      .eq("child_id", childId)
      .eq("status", "pending"),
  ]);

  if (linksResult.error) {
    throw new Error(
      `No se pudieron cargar los padres: ${linksResult.error.message}`,
    );
  }
  if (invitesResult.error) {
    throw new Error(
      `No se pudieron cargar las invitaciones: ${invitesResult.error.message}`,
    );
  }

  type LinkRow = {
    id: string;
    relationship: ParentEntry["relationship"];
    // Muchos-a-uno: PostgREST devuelve objeto; el tipado sin Database puede
    // inferir array, así que se normaliza abajo.
    parent:
      | { full_name: string; avatar_url: string | null }
      | Array<{ full_name: string; avatar_url: string | null }>
      | null;
  };
  type InviteRow = {
    id: string;
    full_name: string;
    email: string;
    relationship: ParentEntry["relationship"];
  };

  const linkRows = (linksResult.data ?? []) as unknown as LinkRow[];
  const inviteRows = (invitesResult.data ?? []) as InviteRow[];

  const active: ParentEntry[] = linkRows.map((row) => {
    const parent = Array.isArray(row.parent)
      ? (row.parent[0] ?? null)
      : row.parent;
    return {
      id: row.id,
      fullName: parent?.full_name ?? "(sin nombre)",
      email: null,
      relationship: row.relationship,
      status: "active" as const,
      avatarUrl: parent?.avatar_url ?? null,
    };
  });

  const pending: ParentEntry[] = inviteRows.map((row) => ({
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    relationship: row.relationship,
    status: "pending" as const,
    avatarUrl: null,
  }));

  return [...active, ...pending];
}

export type ActivateInvitationInput = {
  code: string;
  email: string;
  password: string;
  fullName: string;
};

/** Respuesta de la RPC validate_invitation (jsonb). */
type ValidatedInvitation = {
  id: string;
  status: "pending";
  email: string;
  full_name: string;
  relationship: "father" | "mother" | "guardian";
  expires_at: string;
  child_id: string;
  child_name: string;
  room_name: string;
  daycare_id: string;
  invited_by_name: string;
};

/** Activa una invitación: valida el código (RPC pre-auth), crea el usuario en
 *  Supabase Auth (el trigger handle_new_user crea la fila users con rol
 *  parent), inserta el vínculo en parent_children y marca la invitación como
 *  accepted. Lanza Error con mensaje visible si algo falla. */
export async function activateInvitation(
  input: ActivateInvitationInput,
): Promise<void> {
  const supabase = await getClient();

  // 1. Validar el código contra la BD (funciona sin sesión: RPC SECURITY DEFINER).
  const { data, error: rpcError } = await supabase.rpc("validate_invitation", {
    p_code: input.code,
  });
  if (rpcError) {
    throw new Error(`No se pudo validar el código: ${rpcError.message}`);
  }

  const invitation = data as ValidatedInvitation | null;
  if (!invitation) {
    throw new Error(
      "El código de invitación es inválido o está vencido. Pide uno nuevo a la guardería.",
    );
  }

  const email = input.email.trim().toLowerCase();
  if (email !== invitation.email) {
    throw new Error("El email no coincide con la invitación.");
  }

  const fullName = input.fullName.trim().replace(/\s+/g, " ");
  if (!fullName) {
    throw new Error("El nombre es obligatorio.");
  }
  if (input.password.length < 6) {
    throw new Error("La contraseña debe tener al menos 6 caracteres.");
  }

  // 2. Crear la cuenta. El metadata role/daycare_id/full_name alimenta al
  //    trigger handle_new_user (SPEC 08), que crea la fila en users.
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email,
    password: input.password,
    options: {
      data: {
        role: "parent",
        daycare_id: invitation.daycare_id,
        full_name: fullName,
      },
    },
  });

  if (signUpError) {
    throw new Error(`No se pudo crear la cuenta: ${signUpError.message}`);
  }
  const newUser = signUpData.user;
  if (!newUser) {
    throw new Error("No se pudo crear la cuenta.");
  }

  // Sin sesión no se puede escribir con RLS (p. ej. si el proyecto exige
  // confirmar email antes de crear la sesión).
  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session) {
    throw new Error(
      "La cuenta se creó pero no se pudo iniciar sesión. Revisa tu email para confirmarla e inicia sesión desde /login.",
    );
  }

  // 3. Vínculo parent_children (como el padre recién creado; RLS lo permite).
  const { error: linkError } = await supabase.from("parent_children").insert({
    parent_id: newUser.id,
    child_id: invitation.child_id,
    relationship: invitation.relationship,
  });
  if (linkError) {
    throw new Error(`No se pudo vincular con el niño: ${linkError.message}`);
  }

  // 4. Marcar la invitación como accepted (polición invitations_parent_accept).
  const { error: acceptError } = await supabase
    .from("invitations")
    .update({
      status: "accepted",
      accepted_at: new Date().toISOString(),
    })
    .eq("id", invitation.id)
    .eq("status", "pending");

  if (acceptError) {
    throw new Error(
      `No se pudo actualizar la invitación: ${acceptError.message}`,
    );
  }

  // Refresca la raíz para que la sesión nueva vea su feed.
  revalidatePath("/");
}
