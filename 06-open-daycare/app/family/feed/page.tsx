import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";

/** Feed familiar — ruta `/family/feed` (SPEC 03).
 *  Muestra publicaciones filtradas por hijos vinculados. */
export default function FamilyFeedPage() {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar role="family" active="feed" />
      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-y-auto">
        <MobileNav role="family" active="feed" />
        <main className="mx-auto w-full max-w-[760px] px-10 pb-20 pt-[34px]">
          <h1 className="font-display text-[30px] font-semibold leading-[1.2] text-ink">
            Feed familiar
          </h1>
          <p className="mt-2 text-sm text-muted">
            Placeholder - se implementará el feed filtrado por hijos vinculados
          </p>
        </main>
      </div>
    </div>
  );
}
