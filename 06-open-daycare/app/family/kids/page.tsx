import Link from "next/link";
import { cookies } from "next/headers";

import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";
import { createClient } from "@/utils/supabase/server";

// Sin esto, next build prerenderiza la página con datos del build.
export const dynamic = "force-dynamic";

type LinkedChild = {
  id: string;
  full_name: string;
  birth_date: string;
  photo_url: string | null;
  rooms: { name: string | null }[] | null;
};

/** Listado de hijos — ruta `/family/kids`.
 *  Parent: solo hijos vinculados vía parent_children.
 *  Admin: todos los niños de la guardería. */
export default async function FamilyKidsPage() {
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
  let childrenList: LinkedChild[] = [];

  if (userRole === "admin") {
    // Admin: obtener todos los niños
    const { data: children, error: childrenError } = await supabase
      .from("children")
      .select(`
        id,
        full_name,
        birth_date,
        photo_url,
        rooms (name)
      `)
      .eq("status", "active")
      .order("full_name");

    if (childrenError) {
      throw new Error(`No se pudieron cargar los niños: ${childrenError.message}`);
    }

    childrenList = (children ?? []) as LinkedChild[];
  } else {
    // Parent: obtener solo hijos vinculados
    const { data: links, error: linkError } = await supabase
      .from("parent_children")
      .select("child_id")
      .eq("parent_id", user.id);

    if (linkError) {
      throw new Error(`No se pudieron cargar los hijos: ${linkError.message}`);
    }

    const childIds = (links ?? []).map((l) => l.child_id);

    if (childIds.length > 0) {
      const { data: children, error: childrenError } = await supabase
        .from("children")
        .select(`
          id,
          full_name,
          birth_date,
          photo_url,
          rooms (name)
        `)
        .in("id", childIds)
        .order("full_name");

      if (childrenError) {
        throw new Error(`No se pudieron cargar los hijos: ${childrenError.message}`);
      }

      childrenList = (children ?? []) as LinkedChild[];
    }
  }

  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar role="family" active="kids" />
      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-y-auto">
        <MobileNav role="family" active="kids" />
        <main className="mx-auto w-full max-w-[880px] px-10 pb-20 pt-[34px]">
          <h1 className="font-display text-[30px] font-semibold leading-[1.2] text-ink">
            {userRole === "admin" ? "Todos los Niños" : "Mis Hijos"}
          </h1>
          <p className="mt-2 text-sm text-muted">
            {childrenList.length} {childrenList.length === 1 ? "niño" : "niños"}
          </p>

          {childrenList.length === 0 ? (
            <div className="rounded-2xl border border-card-border bg-card p-6 text-center shadow-card">
              <p className="text-[15px] text-muted">
                {userRole === "admin"
                  ? "No hay niños registrados en la guardería."
                  : "Aún no tienes hijos vinculados. Contacta a la guardería para vincular a tus hijos."}
              </p>
            </div>
          ) : (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {childrenList.map((child) => {
                const roomName = child.rooms?.[0]?.name;
                return (
                  <Link
                    key={child.id}
                    href={`/family/kids/${child.id}`}
                    className="group rounded-2xl border border-card-border bg-card p-4 shadow-card transition-shadow hover:shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-14 shrink-0 items-center justify-center rounded-full bg-avatar font-display text-lg font-semibold text-white">
                        {child.full_name.trim().charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-display text-base font-semibold text-ink">
                          {child.full_name}
                        </p>
                        {roomName && (
                          <p className="text-xs text-muted">Sala {roomName}</p>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
