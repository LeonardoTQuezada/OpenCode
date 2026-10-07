import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";
import { KidsScreen } from "@/components/kids-screen";

/** Listado de niños de la sala — ruta `/kids`.
 *  El header, la lista y el modal "Agregar niño" viven en `KidsScreen`
 *  porque manejan estado (SPEC 04). */
export default function KidsPage() {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar active="kids" />
      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-y-auto">
        <MobileNav active="kids" />
        <main className="mx-auto w-full max-w-[880px] px-10 pb-20 pt-[34px]">
          <KidsScreen />
        </main>
      </div>
    </div>
  );
}
