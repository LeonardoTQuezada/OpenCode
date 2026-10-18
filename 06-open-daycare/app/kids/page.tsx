import { cookies } from "next/headers";

import { getAllChildren } from "@/app/_actions/children";
import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";
import { KidsScreen } from "@/components/kids-screen";
import { createClient } from "@/utils/supabase/server";

// Sin esto, next build prerenderiza la página con datos del build.
export const dynamic = "force-dynamic";

/** Listado de niños de la sala — ruta `/kids` (SPEC 10).
 *  Server component: lee el usuario autenticado, su guardería y los
 *  children agrupados por sala desde Supabase. */
export default async function KidsPage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let groups: Awaited<ReturnType<typeof getAllChildren>> = [];
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("daycare_id")
      .eq("id", user.id)
      .maybeSingle();

    if (profile?.daycare_id) {
      groups = await getAllChildren(profile.daycare_id);
    }
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar active="kids" />
      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-y-auto">
        <MobileNav active="kids" />
        <main className="mx-auto w-full max-w-[880px] px-10 pb-20 pt-[34px]">
          <KidsScreen groups={groups} />
        </main>
      </div>
    </div>
  );
}
