import { ChildProfileView } from "@/components/child-profile";
import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";
import { MATEO } from "@/lib/kids";

/** Perfil de Mateo — ruta `/kids/mateo`. */
export default function ChildProfilePage() {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar active="kids" />
      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-y-auto">
        <MobileNav active="kids" />
        <main className="mx-auto w-full max-w-[820px] px-10 pb-20 pt-[34px]">
          <ChildProfileView profile={MATEO} />
        </main>
      </div>
    </div>
  );
}
