import Link from "next/link";
import { cookies } from "next/headers";

import { getChildById } from "@/app/_actions/children";
import { ChildProfileView } from "@/components/child-profile";
import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/utils/supabase/server";

// Sin esto, next build prerenderiza la página con datos del build.
export const dynamic = "force-dynamic";

/** Perfil de un niño — ruta `/kids/[id]` (SPEC 10).
 *  Server component: lee el child por ID desde Supabase y su sala. */
export default async function ChildProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const child = await getChildById(id);

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
      <Sidebar active="kids" />
      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-y-auto">
        <MobileNav active="kids" />
        <main className="mx-auto w-full max-w-[820px] px-10 pb-20 pt-[34px]">
          {child ? (
            <ChildProfileView child={child} roomName={roomName} />
          ) : (
            <div>
              <p className="text-[15px] text-muted">Niño no encontrado.</p>
              <Link
                href="/kids"
                className="mt-3 inline-flex items-center gap-[7px] text-[14px] font-bold text-coral-strong"
              >
                Volver a Niños
              </Link>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
