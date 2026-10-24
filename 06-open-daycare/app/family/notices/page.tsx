import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";

/** Anuncios generales — ruta `/family/notices`.
 *  Muestra solo anuncios generales, eventos y comunicaciones oficiales. */
export default function FamilyNoticesPage() {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar role="family" active="notices" />
      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-y-auto">
        <MobileNav role="family" active="notices" />
        <main className="mx-auto w-full max-w-[880px] px-10 pb-20 pt-[34px]">
          <h1 className="font-display text-[30px] font-semibold leading-[1.2] text-ink">
            Anuncios
          </h1>
          <p className="mt-2 text-sm text-muted">
            Anuncios generales de la guardería, eventos y comunicaciones oficiales
          </p>
        </main>
      </div>
    </div>
  );
}
