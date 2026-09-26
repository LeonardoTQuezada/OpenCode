import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";

/** Placeholder de `/my-account`: la pantalla de cuenta llega en una spec futura. */
export default function MyAccountPage() {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar active="account" />
      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-y-auto">
        <MobileNav active="account" />
        <main className="mx-auto w-full max-w-[760px] px-10 pb-20 pt-[34px]">
          <h1 className="font-display text-[30px] font-semibold leading-[1.2] text-ink">
            Mi cuenta
          </h1>
        </main>
      </div>
    </div>
  );
}
