import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";

/** Avisos del staff — ruta `/staff/notices`.
 *  Muestra noticias internas del equipo + noticias de familia. */
export default function StaffNoticesPage() {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar role="staff" active="notices" />
      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-y-auto">
        <MobileNav role="staff" active="notices" />
        <main className="mx-auto w-full max-w-[880px] px-10 pb-20 pt-[34px]">
          <h1 className="font-display text-[30px] font-semibold leading-[1.2] text-ink">
            Avisos
          </h1>
          <p className="mt-2 text-sm text-muted">
            Noticias internas del equipo y anuncios de familia
          </p>
        </main>
      </div>
    </div>
  );
}
