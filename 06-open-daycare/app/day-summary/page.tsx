import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";

/** Placeholder de `/day-summary`: el resumen llega en una spec futura. */
export default function DaySummaryPage() {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar active="kids" />
      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-y-auto">
        <MobileNav active="kids" />
        <main className="mx-auto w-full max-w-[880px] px-10 pb-20 pt-[34px]">
          <h1 className="font-display text-[30px] font-semibold leading-[1.2] text-ink">
            Resumen del día
          </h1>
        </main>
      </div>
    </div>
  );
}
