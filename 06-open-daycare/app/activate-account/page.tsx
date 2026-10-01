import { ActivateForm } from "@/components/activate-form";
import { Avatar } from "@/components/avatar";
import { SunIcon } from "@/components/icons";
import { INVITATION } from "@/lib/invitation";

/** Pantalla de activación de cuenta (SPEC 03). Réplica de
 *  `references/pantallas/activar-cuenta.dc.html`; la validación vive en
 *  `ActivateForm`. */
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

        {/* Tarjeta de invitación */}
        <div className="mb-[22px] flex items-center gap-[14px] rounded-[16px] border-[1.5px] border-input-border bg-white px-4 py-[14px]">
          <Avatar
            size={44}
            label={INVITATION.kidInitial}
            bg={INVITATION.avatarBg}
            ink={INVITATION.avatarInk}
          />
          <div>
            <div className="text-[13px] text-faint">
              Te invitaron a seguir a
            </div>
            <div className="font-display text-[17px] font-semibold text-ink">
              {INVITATION.roomLabel}
            </div>
          </div>
        </div>

        <ActivateForm />
      </div>
    </div>
  );
}
