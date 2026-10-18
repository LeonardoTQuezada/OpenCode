// Generación de códigos de invitación (SPEC 11): 5 caracteres alfanuméricos
// uppercase sin caracteres confusos (0/O, 1/I). generateUniqueCode verifica
// unicidad contra la tabla invitations y reintenta si hay colisión.

import type { SupabaseClient } from "@supabase/supabase-js";

// Alfabeto de 32 caracteres (sin confusos): 32^5 ≈ 33M combinaciones.
// 256 % 32 == 0, por lo que byte % ALPHABET.length no tiene sesgo.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 5;
const MAX_ATTEMPTS = 5;

/** Genera un código aleatorio de 5 caracteres (no verifica unicidad). */
export function generateInvitationCode(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(CODE_LENGTH));
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return code;
}

/** Genera un código que todavía no exista en invitations.
 *  Reintenta ante colisión (improbable) y lanza si no logra uno único. */
export async function generateUniqueCode(
  supabase: SupabaseClient,
): Promise<string> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const code = generateInvitationCode();

    const { data, error } = await supabase
      .from("invitations")
      .select("id")
      .eq("code", code)
      .maybeSingle();

    if (error) {
      throw new Error(`No se pudo verificar el código: ${error.message}`);
    }

    if (data === null) return code;
  }

  throw new Error(
    "No se pudo generar un código de invitación único. Intenta de nuevo.",
  );
}
