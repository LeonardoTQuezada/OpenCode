import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";

/** Resumen diario — ruta `/family/day-summary`.
 *  Exclusivo para familias: resumen consolidado del día de sus hijos. */
export default function FamilyDaySummaryPage() {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar role="family" active="kids" />
      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-y-auto">
        <MobileNav role="family" active="kids" />
        <main className="mx-auto w-full max-w-[760px] px-10 pb-20 pt-[34px]">
          <h1 className="font-display text-[30px] font-semibold leading-[1.2] text-ink">
            Resumen del Día
          </h1>
          <p className="mt-2 text-sm text-muted">
            Placeholder - se implementará el resumen diario consolidado
          </p>
        </main>
      </div>
    </div>
  );
}
