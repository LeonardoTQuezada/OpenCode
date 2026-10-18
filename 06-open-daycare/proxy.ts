import { createClient } from "@/utils/supabase/proxy";
import { type NextRequest, NextResponse } from "next/server";

// Next.js 16: la convención `middleware.ts` fue renombrada a `proxy.ts`.
// Refresca la sesión de Supabase antes de que corran los Server Components
// y protege las rutas (SPEC 09): todo lo que no sea pública exige sesión.

// Rutas públicas exactas: no requieren sesión; con sesión, redirigen a /.
const PUBLIC_ROUTES = ["/login", "/activate-account", "/forgot-password"];

export async function proxy(request: NextRequest) {
  const { supabase, supabaseResponse } = createClient(request);

  // IMPORTANTE: no ejecutar código entre createServerClient y
  // supabase.auth.getClaims(). Si se omite getClaims(), los usuarios
  // pueden quedar deslogueados aleatoriamente al renderizar en el server.
  // Check optimista: lee de cookies sin llamada extra a la BD.
  const { data: claims } = await supabase.auth.getClaims();

  const pathname = request.nextUrl.pathname;
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const hasSession = claims !== null;

  // Sin sesión en ruta protegida → /login; con sesión en pública → /.
  if ((!hasSession && !isPublicRoute) || (hasSession && isPublicRoute)) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = hasSession ? "/" : "/login";
    redirectUrl.search = "";
    const redirectResponse = NextResponse.redirect(redirectUrl);

    // Conservar las cookies de supabaseResponse: getClaims() pudo haber
    // refrescado el token y esos Set-Cookie viajan en esta respuesta.
    for (const cookie of supabaseResponse.cookies.getAll()) {
      redirectResponse.cookies.set(cookie);
    }

    return redirectResponse;
  }

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
