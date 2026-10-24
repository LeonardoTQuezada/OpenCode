import { cookies } from "next/headers";

import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/utils/supabase/server";

// Sin esto, next build prerenderiza la página con datos del build.
export const dynamic = "force-dynamic";

/** Listado de hijos vinculados al padre — ruta `/family/kids`.
 *  Server component: lee los hijos del usuario autenticado vía parent_children. */
export default async function FamilyKidsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // TODO: Implementar consulta de hijos vinculados vía parent_children
  // Por ahora es un placeholder

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar role="family" active="kids" />
      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-y-auto">
        <MobileNav role="family" active="kids" />
        <main className="mx-auto w-full max-w-[880px] px-10 pb-20 pt-[34px]">
          <h1 className="font-display text-[30px] font-semibold leading-[1.2] text-ink">
            Mis Hijos
          </h1>
          <p className="mt-2 text-sm text-muted">
            Placeholder - se implementará el filtrado por hijos vinculados
          </p>
        </main>
      </div>
    </div>
  );
}
