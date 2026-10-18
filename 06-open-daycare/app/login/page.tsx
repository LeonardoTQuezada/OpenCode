import { SunIcon } from "@/components/icons";
import { LoginForm } from "@/components/login-form";

/** Pantalla pública de login (SPEC 03 + SPEC 09). Réplica de
 *  `references/pantallas/login.dc.html` sin el selector de rol
 *  (decisión de spec: no existe Personal/Familia); el formulario
 *  autentica de verdad contra Supabase Auth. */
export default function LoginPage() {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-page md:grid-cols-[1.05fr_1fr]">
      {/* Panel de marca: oculto por debajo de 768px */}
      <div className="relative hidden flex-col justify-between overflow-hidden bg-[linear-gradient(155deg,#F6A98E_0%,#F2937A_45%,#EC7E62_100%)] p-[56px_60px] text-white md:flex">
        <div className="absolute top-[-140px] right-[-120px] size-[420px] rounded-full bg-white/[.12]" />
        <div className="absolute bottom-[-110px] left-[-80px] size-[300px] rounded-full bg-white/[.10]" />

        <div className="relative flex items-center gap-[13px]">
          <div className="flex size-[46px] items-center justify-center rounded-[14px] bg-white/[.22]">
            <SunIcon width={26} height={26} />
          </div>
          <span className="font-display text-[21px] font-semibold tracking-[.5px]">
            OpenDayCare
          </span>
        </div>

        <div className="relative">
          <h1 className="mb-[18px] font-display text-[42px] font-semibold leading-[1.12]">
            El día de cada niño,
            <br />
            compartido con su familia.
          </h1>
          <p className="m-0 max-w-[430px] text-[17px] leading-[1.6] text-white/[.92]">
            Publicá momentos, gestioná las salas y mantené a las familias
            cerca, desde un solo lugar.
          </p>
        </div>

        <div className="relative text-[14px] text-white/[.9]">
          🌿 Guardería Sala Soles
        </div>
      </div>

      {/* Formulario */}
      <div className="flex items-center justify-center p-10">
        <div className="w-full max-w-[392px]">
          <h2 className="mb-[6px] font-display text-[30px] font-semibold text-ink">
            Iniciar sesión
          </h2>
          <p className="mb-[28px] text-[15px] text-faint">
            Ingresá para ver el día de hoy.
          </p>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}
