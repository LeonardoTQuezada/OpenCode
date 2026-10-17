// Server Actions de autenticación (SPEC 09): login real contra Supabase Auth
// y cierre de sesión. Se usan desde <LoginForm /> (cliente) y el sidebar.

"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";

export type LoginResult =
  | { ok: true }
  | { ok: false; message: string };

/**
 * Autentica email + contraseña contra Supabase Auth.
 * Vacíos → mensaje de validación; credenciales rechazadas → mensaje genérico
 * (no distingue usuario inexistente de password mal, por seguridad).
 * Éxito → redirect("/") (lanza NEXT_REDIRECT, no retorna).
 */
export async function loginAction(formData: FormData): Promise<LoginResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email) return { ok: false, message: "Ingresá tu email." };
  if (!password) return { ok: false, message: "Ingresá tu contraseña." };

  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    // 400 / invalid_credentials = email o contraseña incorrectos;
    // cualquier otro error (red, rate limit, etc.) muestra mensaje genérico.
    const isInvalidCredentials =
      error.status === 400 || ("code" in error && error.code === "invalid_credentials");
    return {
      ok: false,
      message: isInvalidCredentials
        ? "Email o contraseña incorrectos."
        : "No se pudo iniciar sesión. Intentá de nuevo.",
    };
  }

  redirect("/");
}

/**
 * Cierra la sesión en Supabase Auth y vuelve a /login.
 * El signOut() borra las cookies de sesión vía setAll del cliente server.
 */
export async function logoutAction(): Promise<never> {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  await supabase.auth.signOut();

  redirect("/login");
}
