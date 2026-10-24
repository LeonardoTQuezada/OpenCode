import Link from "next/link";
import { cookies } from "next/headers";

import { getChildById } from "@/app/_actions/children";
import { ChildProfileView } from "@/components/child-profile";
import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/utils/supabase/server";

// Sin esto, next build prerenderiza la página con datos del build.
export const dynamic = "force-dynamic";

/** Perfil de un hijo — ruta `/family/kids/[id]`.
 *  Server component: verifica que el niño pertenece al padre antes de mostrarlo. */
export default async function FamilyChildProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const child = await getChildById(id);

  // TODO: Verificar que el child está vinculado al usuario actual vía parent_children
  // Por ahora es un placeholder

  let roomName = "";
  if (child) {
    const cookieStore = await cookies();
    const supabase = createClient(cookieStore);
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
            <ChildProfileView child={child} roomName={roomName} />
          ) : (
            <div>
              <p className="text-[15px] text-muted">Niño no encontrado o no tienes permiso para verlo.</p>
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
