import { SunIcon } from "@/components/icons";

/** Pantalla pública de login (SPEC 03). Réplica de
 *  `references/pantallas/login.dc.html` sin el selector de rol
 *  (decisión de spec: no existe Personal/Familia) y sin autenticación:
 *  el botón "Iniciar sesión" navega al feed con un simple enlace. */
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

          <div className="mb-2 text-[12px] font-bold tracking-[.7px] text-faint">
            EMAIL
          </div>
          <input
            type="email"
            defaultValue="caro@opendaycare.com"
            className="mb-[18px] w-full rounded-[14px] border-[1.5px] border-input-border bg-white px-4 py-[14px] text-[15px] text-ink outline-none focus:border-input-focus"
          />

          <div className="mb-2 text-[12px] font-bold tracking-[.7px] text-faint">
            CONTRASEÑA
          </div>
          <input
            type="password"
            placeholder="••••••••"
            className="mb-2.5 w-full rounded-[14px] border-[1.5px] border-input-border bg-white px-4 py-[14px] text-[15px] text-ink outline-none placeholder:text-placeholder focus:border-input-focus"
          />

          <div className="mb-5 text-right">
            <a
              href="/forgot-password"
              className="cursor-pointer text-[13.5px] font-bold text-coral-deep"
            >
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <a
            href="/"
            className="block w-full cursor-pointer rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] p-[15px] text-center text-[16px] font-extrabold text-white shadow-login"
          >
            Iniciar sesión
          </a>

          <p className="mt-6 mb-0 text-center text-[14.5px] text-faint">
            ¿Te invitó la guardería?{" "}
            <a
              href="/activate-account"
              className="font-extrabold text-coral-deep"
            >
              Activá tu cuenta
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
