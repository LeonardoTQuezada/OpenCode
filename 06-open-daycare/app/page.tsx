import { redirect } from "next/navigation";
import { cookies } from "next/headers";

import { createClient } from "@/utils/supabase/server";

/** Ruta raíz `/`: delega al proxy para redirigir según el rol.
 *  Si no hay sesión, redirige a /login. */
export default async function HomePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const role = profile?.role;
  redirect(role === "parent" ? "/family/feed" : "/staff/feed");
}
