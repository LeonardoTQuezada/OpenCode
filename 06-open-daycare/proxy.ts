import { createClient } from "@/utils/supabase/proxy";
import { type NextRequest } from "next/server";

// Next.js 16: la convención `middleware.ts` fue renombrada a `proxy.ts`.
// Refresca la sesión de Supabase antes de que corran los Server Components.
export async function proxy(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);

  // IMPORTANTE: no ejecutar código entre createServerClient y
  // supabase.auth.getClaims(). Si se omite getClaims(), los usuarios
  // pueden quedar deslogueados aleatoriamente al renderizar en el server.
  await supabase.auth.getClaims();

  // IMPORTANTE: devolver supabaseResponse tal cual. Si se crea una nueva
  // respuesta con NextResponse.next() hay que copiar sus cookies, o el
  // navegador y el server se desincronizan y se termina la sesión.
  return supabaseResponse;
}

export const config = {
  matcher: [
    // Excluimos assets estáticos y rutas con extensión para no ejecutar
    // lógica de auth en ellos.
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)",
  ],
};
