import { MobileNav } from "@/components/mobile-nav";
import { Sidebar } from "@/components/sidebar";

/** Placeholder de `/login`: la autenticación llega en una spec futura.
 *  No pertenece al nav, así que el sidebar queda sin ítem activo. */
export default function LoginPage() {
  return (
    <div className="flex min-h-screen bg-cream">
      <Sidebar active={null} />
      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:overflow-y-auto">
        <MobileNav active={null} />
        <main className="mx-auto w-full max-w-[760px] px-10 pb-20 pt-[34px]">
          <h1 className="font-display text-[30px] font-semibold leading-[1.2] text-ink">
            Iniciar sesión
          </h1>
        </main>
      </div>
    </div>
  );
}
