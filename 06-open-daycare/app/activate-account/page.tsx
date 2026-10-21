import { Suspense } from "react";

import { ActivateForm } from "@/components/activate-form";
import { SunIcon } from "@/components/icons";

/** Pantalla de activación de cuenta (SPEC 11 → flujo real). La tarjeta de
 *  invitación y el formulario viven en ActivateForm, que lee el código del
 *  query string (useSearchParams requiere Suspense en el server component). */
export default function ActivateAccountPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-page p-10">
      <div className="w-full max-w-[440px]">
        <div className="mb-[22px] flex size-[58px] items-center justify-center rounded-[18px] bg-[linear-gradient(155deg,#F8C3A8,#F2937A)] shadow-[0_12px_26px_-10px_rgb(238_129_100_/_0.65)]">
          <SunIcon width={30} height={30} />
        </div>

        <h1 className="mb-2 font-display text-[32px] font-semibold leading-[1.15] text-ink">
          Bienvenida a OpenDayCare
        </h1>
        <p className="mb-[26px] text-[15.5px] leading-[1.55] text-faint">
          Te invitaron a seguir el día de tu hijo. Creá tu contraseña para
          activar la cuenta.
        </p>

        <Suspense
          fallback={
            <p className="rounded-[16px] border-[1.5px] border-input-border bg-white px-4 py-[18px] text-center text-[15px] text-faint">
              Cargando…
            </p>
          }
        >
          <ActivateForm />
        </Suspense>
      </div>
    </div>
  );
}
