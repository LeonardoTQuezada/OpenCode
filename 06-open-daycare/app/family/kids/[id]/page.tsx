import Link from "next/link";
import { cookies } from "next/headers";

import { getChildById } from "@/app/_actions/children";
import { ChildProfileView } from "@/components/child-profile";
import { isChildLinkedToParent } from "@/lib/family-feed";
import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/utils/supabase/server";

// Sin esto, next build prerenderiza la página con datos del build.
export const dynamic = "force-dynamic";

/** Perfil de un hijo — ruta `/family/kids/[id]`.
 *  Server component: verifica que el niño pertenece al padre antes de mostrarlo.
 *  Admin puede ver cualquier niño. */
export default async function FamilyChildProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <p className="text-sm text-muted">No autenticado</p>
      </div>
    );
  }

  // Obtener rol del usuario
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const userRole = profile?.role;

  // Admin puede ver cualquier niño, parent solo sus hijos vinculados
  if (userRole === "parent") {
    const isLinked = await isChildLinkedToParent(user.id, id);
    
    if (!isLinked) {
      return (
        <div className="flex min-h-screen bg-cream">
          <Sidebar role="family" active="kids" />
          <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-y-auto">
            <MobileNav role="family" active="kids" />
            <main className="mx-auto w-full max-w-[820px] px-10 pb-20 pt-[34px]">
              <div className="rounded-2xl border border-card-border bg-card p-6 shadow-card">
                <h1 className="font-display text-[20px] font-semibold text-ink">
                  Acceso no autorizado
                </h1>
                <p className="mt-2 text-[15px] text-muted">
                  No tienes permiso para ver el perfil de este niño. Solo puedes ver a tus hijos vinculados.
                </p>
                <Link
                  href="/family/kids"
                  className="mt-4 inline-flex items-center gap-[7px] text-[14px] font-bold text-coral-strong"
                >
                  Volver a Mis Hijos
                </Link>
              </div>
            </main>
          </div>
        </div>
      );
    }
  }

  const child = await getChildById(id);

  let roomName = "";
  if (child) {
    const { data: room } = await supabase
      .from("rooms")
      .select("name")
      .eq("id", child.room_id)
      .maybeSingle();
    roomName = room?.name ?? "";
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar role="family" active="kids" />
      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-y-auto">
        <MobileNav role="family" active="kids" />
        <main className="mx-auto w-full max-w-[820px] px-10 pb-20 pt-[34px]">
          {child ? (
            <ChildProfileView child={child} roomName={roomName} role="family" />
          ) : (
            <div>
              <p className="text-[15px] text-muted">Niño no encontrado.</p>
              <Link
                href="/family/kids"
                className="mt-3 inline-flex items-center gap-[7px] text-[14px] font-bold text-coral-strong"
              >
                Volver a Mis Hijos
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
