"use client";

import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

import {
  activateInvitation,
  validateInvitationCode,
  type ValidatedInvitationInfo,
} from "@/app/_actions/invitations";
import { avatarPaletteFor } from "@/lib/kids";
import { Avatar } from "./avatar";
import { CheckIcon } from "./icons";

/** Estado de carga de la invitación al abrir /activate-account. */
type LoadState =
  | { status: "loading" }
  | { status: "invalid" }
  | { status: "ready"; invitation: ValidatedInvitationInfo };

const inputClass =
  "w-full rounded-[14px] border-[1.5px] border-input-border bg-white px-4 py-[14px] text-[15px] text-ink outline-none focus:border-input-focus";

/** Formulario de activación de cuenta (SPEC 11): lee el código del query
 *  string, lo valida contra la BD, pre-llena los datos de la invitación y
 *  crea la cuenta con activateInvitation. Réplica visual de
 *  `references/pantallas/activar-cuenta.dc.html`. */
export function ActivateForm() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code")?.trim() ?? "";

  const [state, setState] = useState<LoadState>({ status: "loading" });
  const [password, setPassword] = useState("");
  const [consent, setConsent] = useState(true);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Valida el código al montar (la RPC funciona sin sesión). Sin código no
  // hay nada que pedir: el estado "invalid" se deriva en el render de abajo
  // (evita setState síncrono en el effect, regla react-hooks/set-state-in-effect).
  useEffect(() => {
    if (!code) return;
    let cancelled = false;

    validateInvitationCode(code)
      .then((invitation) => {
        if (cancelled) return;
        setState(
          invitation ? { status: "ready", invitation } : { status: "invalid" },
        );
      })
      .catch(() => {
        if (cancelled) return;
        setState({ status: "invalid" });
      });

    return () => {
      cancelled = true;
    };
  }, [code]);

  // Sin código en la query string la pantalla es "inválida" aunque el state
  // siga en su valor inicial de loading.
  const viewState: LoadState = code ? state : { status: "invalid" };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (viewState.status !== "ready" || isSubmitting) return;

    if (password.length < 6) {
      setPasswordError("Usá al menos 6 caracteres.");
      return;
    }

    const { invitation } = viewState;
    setIsSubmitting(true);
    setPasswordError(null);
    setSubmitError(null);
    try {
      await activateInvitation({
        code,
        email: invitation.email,
        password,
        fullName: invitation.fullName,
      });
      // Hard refresh (decisión de SPEC 11): la sesión nueva creada por
      // signUp debe verse en el server render de /. Un router.push haría
      // una navegación suave con riesgo de RSC cacheada sin la sesión.
      // eslint-disable-next-line @next/next/no-location-assign-relative-destination
      window.location.assign("/");
    } catch (err) {
      setSubmitError(
        err instanceof Error
          ? err.message
          : "No se pudo activar la cuenta. Intenta de nuevo.",
      );
      setIsSubmitting(false);
    }
  };

  if (viewState.status === "loading") {
    return (
      <p className="rounded-[16px] border-[1.5px] border-input-border bg-white px-4 py-[18px] text-center text-[15px] text-faint">
        Validando tu invitación…
      </p>
    );
  }

  if (viewState.status === "invalid") {
    return (
      <div className="rounded-[16px] border-[1.5px] border-input-border bg-white px-4 py-[18px] text-center">
        <p role="alert" className="text-[15px] font-bold leading-[1.5] text-coral-deep">
          Este código de invitación es inválido o venció.
        </p>
        <p className="mt-2 text-[14px] leading-[1.5] text-faint">
          Pedile uno nuevo a la guardería o{" "}
          <Link href="/login" className="font-extrabold text-coral-deep">
            iniciá sesión
          </Link>
          .
        </p>
      </div>
    );
  }

  const { invitation } = viewState;
  const palette = avatarPaletteFor(invitation.childId);

  return (
    <>
      {/* Tarjeta de invitación con datos reales */}
      <div className="mb-[22px] flex items-center gap-[14px] rounded-[16px] border-[1.5px] border-input-border bg-white px-4 py-[14px]">
        <Avatar
          size={44}
          label={invitation.childName.charAt(0).toUpperCase()}
          bg={palette.bg}
          ink={palette.ink}
        />
        <div>
          <div className="text-[13px] text-faint">Te invitaron a seguir a</div>
          <div className="font-display text-[17px] font-semibold text-ink">
            {invitation.childName} · Sala {invitation.roomName}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} noValidate>
        <div className="mb-[18px]">
          <div className="mb-2 text-[12px] font-bold tracking-[.7px] text-faint">
            CÓDIGO DE INVITACIÓN
          </div>
          <input
            value={code}
            readOnly
            aria-readonly="true"
            className={`${inputClass} font-display text-[18px] font-bold tracking-[3px]`}
          />
        </div>

        <div className="mb-[18px]">
          <div className="mb-2 text-[12px] font-bold tracking-[.7px] text-faint">
            EMAIL
          </div>
          <input
            type="email"
            value={invitation.email}
            readOnly
            aria-readonly="true"
            className={`${inputClass} bg-page text-nav`}
          />
        </div>

        <div className="mb-[18px]">
          <div className="mb-2 text-[12px] font-bold tracking-[.7px] text-faint">
            CREAR CONTRASEÑA
          </div>
          <input
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setPasswordError(null);
            }}
            autoComplete="new-password"
            className={inputClass}
          />
          {passwordError && (
            <p role="alert" className="mt-2 text-[13.5px] font-bold text-coral-deep">
              {passwordError}
            </p>
          )}
        </div>

        <label className="mb-6 flex cursor-pointer items-start gap-3 rounded-[14px] bg-consent-bg px-4 py-[14px]">
          <input
            type="checkbox"
            checked={consent}
            onChange={(event) => setConsent(event.target.checked)}
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

        {submitError && (
          <p role="alert" className="mb-4 text-[13.5px] font-bold text-coral-deep">
            {submitError}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="block w-full cursor-pointer rounded-[15px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] p-[15px] text-center text-[16px] font-extrabold text-white shadow-login disabled:cursor-wait disabled:opacity-70"
        >
          {isSubmitting ? "Activando..." : "Activar mi cuenta"}
        </button>

        <p className="mt-[22px] mb-0 text-center text-[14.5px] text-faint">
          ¿Ya tenés cuenta?{" "}
          <Link href="/login" className="font-extrabold text-coral-deep">
            Iniciar sesión
          </Link>
        </p>
      </form>
    </>
  );
}
