"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { INVITATION } from "@/lib/invitation";
import { CheckIcon } from "./icons";

/** Errores de validación por campo de la activación de cuenta. */
type FieldErrors = {
  code?: string;
  email?: string;
  password?: string;
};

/** Contraseña inicial del mockup; no forma parte de la invitación. */
const PASSWORD_DEFAULT = "contraseña";

const inputClass =
  "w-full rounded-[14px] border-[1.5px] border-input-border bg-white px-4 py-[14px] text-[15px] text-ink outline-none focus:border-input-focus";

/** Formulario de activación de cuenta (SPEC 03). Réplica de
 *  `references/pantallas/activar-cuenta.dc.html` con validación por campo:
 *  solo navega a `/family-feed` cuando todo es válido. */
export function ActivateForm() {
  const router = useRouter();
  const [values, setValues] = useState({
    code: INVITATION.code,
    email: INVITATION.email,
    password: PASSWORD_DEFAULT,
  });
  const [consent, setConsent] = useState(true);
  const [errors, setErrors] = useState<FieldErrors>({});

  /** Actualiza un campo y limpia su error si había uno. */
  const setField = (field: keyof typeof values, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) =>
      prev[field] ? { ...prev, [field]: undefined } : prev,
    );
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const next: FieldErrors = {};
    if (!values.code.trim()) next.code = "Ingresá el código de invitación.";
    if (!values.email.trim()) next.email = "Ingresá tu email.";
    else if (!values.email.includes("@"))
      next.email = "Ingresá un email válido.";
    if (values.password.length < 6) next.password = "Usá al menos 6 caracteres.";
    setErrors(next);
    if (!next.code && !next.email && !next.password) {
      router.push("/family-feed");
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="mb-[18px]">
        <div className="mb-2 text-[12px] font-bold tracking-[.7px] text-faint">
          CÓDIGO DE INVITACIÓN
        </div>
        <input
          value={values.code}
          onChange={(e) => setField("code", e.target.value)}
          className={`${inputClass} font-display text-[18px] font-bold tracking-[3px]`}
        />
        {errors.code && (
          <p role="alert" className="mt-2 text-[13.5px] font-bold text-coral-deep">
            {errors.code}
          </p>
        )}
      </div>

      <div className="mb-[18px]">
        <div className="mb-2 text-[12px] font-bold tracking-[.7px] text-faint">
          EMAIL
        </div>
        <input
          type="email"
          value={values.email}
          onChange={(e) => setField("email", e.target.value)}
          className={inputClass}
        />
        {errors.email && (
          <p role="alert" className="mt-2 text-[13.5px] font-bold text-coral-deep">
            {errors.email}
          </p>
        )}
      </div>

      <div className="mb-[18px]">
        <div className="mb-2 text-[12px] font-bold tracking-[.7px] text-faint">
          CREAR CONTRASEÑA
        </div>
        <input
          type="password"
          value={values.password}
          onChange={(e) => setField("password", e.target.value)}
          className={inputClass}
        />
        {errors.password && (
          <p role="alert" className="mt-2 text-[13.5px] font-bold text-coral-deep">
            {errors.password}
          </p>
        )}
      </div>

      <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-[14px] bg-consent-bg px-4 py-[14px]">
        <input
          type="checkbox"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
          className="peer sr-only"
        />
        <span
          className={`mt-px flex size-6 shrink-0 items-center justify-center rounded-[8px] border-[1.5px] peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-input-focus ${
            consent ? "border-consent bg-consent" : "border-input-border bg-white"
          }`}
        >
          {consent && <CheckIcon width={15} height={15} />}
        </span>
        <span className="text-[14px] leading-[1.45] text-consent-ink">
          Autorizo a la guardería a tomar y compartir fotos de mi hijo dentro de
          la app.
        </span>
      </label>

      <button
        type="submit"
        className="block w-full cursor-pointer rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] p-[15px] text-center text-[16px] font-extrabold text-white shadow-login"
      >
        Activar mi cuenta
      </button>

      <p className="mt-[22px] mb-0 text-center text-[14.5px] text-faint">
        ¿Ya tenés cuenta?{" "}
        <a href="/login" className="font-extrabold text-coral-deep">
          Iniciar sesión
        </a>
      </p>
    </form>
  );
}
