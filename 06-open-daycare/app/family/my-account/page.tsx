import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";

/** Mi cuenta — ruta `/family/my-account`. */
export default function FamilyMyAccountPage() {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar role="family" active="account" />
      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-y-auto">
        <MobileNav role="family" active="account" />
        <main className="mx-auto w-full max-w-[760px] px-10 pb-20 pt-[34px]">
          <h1 className="font-display text-[30px] font-semibold leading-[1.2] text-ink">
            Mi cuenta
          </h1>
        </main>
      </div>
    </div>
  );
}
