"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import {
  createInvitation,
  getInvitationCodePreview,
} from "@/app/_actions/invitations";
import { CloseIcon, InfoIcon, SendIcon } from "../icons";

type Relationship = "father" | "mother" | "guardian";

const RELATIONSHIPS: { value: Relationship; label: string }[] = [
  { value: "mother", label: "Mamá" },
  { value: "father", label: "Papá" },
  { value: "guardian", label: "Tutor/a" },
];

const EMPTY_VALUES = {
  fullName: "",
  email: "",
  relationship: "",
};

type FormValues = typeof EMPTY_VALUES;

const labelClass = "mb-2 block text-[12px] font-extrabold tracking-[.7px] text-faint";

const inputClass =
  "w-full rounded-[14px] border-[1.5px] border-input-border bg-white px-4 py-[13px] text-[15px] text-ink outline-none placeholder:text-placeholder focus:border-input-focus";

/** Validación básica de email en cliente (el server también valida). */
function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** Modal "Vincular padre": réplica de `references/pantallas/vincular-padre.dc.html`.
 *  Genera el código en el servidor vía createInvitation y muestra el estado
 *  "Invitación enviada" con el código (backup si el email falla). */
export function LinkParentModal({
  open,
  onClose,
  childId,
  childName,
}: {
  open: boolean;
  onClose: () => void;
  childId: string;
  childName: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<FormValues>(EMPTY_VALUES);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewCode, setPreviewCode] = useState<string | null>(null);
  const [result, setResult] = useState<{
    code: string;
    emailSent: boolean;
  } | null>(null);

  // Al abrir (false → true), arranca con el formulario limpio (mismo patrón
  // que AddChildModal: se ajusta en render, no en un effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setValues(EMPTY_VALUES);
      setFieldError(null);
      setError(null);
      setPreviewCode(null);
      setResult(null);
    }
  }

  // Pide un código preview al servidor al abrir (se confirma al enviar).
  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    getInvitationCodePreview()
      .then((code) => {
        if (!cancelled) setPreviewCode(code);
      })
      .catch(() => {
        if (!cancelled) setPreviewCode(null);
      });

    return () => {
      cancelled = true;
    };
  }, [open]);

  /** Esc cierra el modal y bloquea el scroll de la página de fondo. */
  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const setField = (field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setFieldError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    const fullName = values.fullName.trim();
    const email = values.email.trim().toLowerCase();
    if (!fullName) {
      setFieldError("Ingresá el nombre del padre o la madre.");
      return;
    }
    if (!isValidEmail(email)) {
      setFieldError("Ingresá un email válido.");
      return;
    }
    if (!values.relationship) {
      setFieldError("Elegí el parentesco.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createInvitation({
        childId,
        fullName,
        email,
        relationship: values.relationship as Relationship,
        code: previewCode ?? undefined,
      });
      setResult({ code: created.code, emailSent: created.emailSent });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo enviar la invitación. Intenta de nuevo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  /** Cierra el éxito y refresca el server render ( ParentsSection nueva ). */
  const handleDone = () => {
    setResult(null);
    onClose();
    router.refresh();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 md:p-6">
      {/* Fondo oscuro: clic fuera cierra */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-modal-overlay"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="link-parent-title"
        className="relative z-10 w-full max-w-[480px] overflow-hidden rounded-[24px] border border-card-border bg-page shadow-modal"
      >
        {/* Header: título + nombre del niño + cerrar */}
        <div className="flex items-center justify-between border-b border-card-border px-[26px] py-5">
          <div>
            <span
              id="link-parent-title"
              className="font-display text-[18px] font-semibold text-ink"
            >
              Vincular padre
            </span>
            <div className="text-[13px] text-muted">a {childName}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex size-[34px] cursor-pointer items-center justify-center rounded-[10px] bg-card-divider text-faint"
          >
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        {result ? (
          /* Éxito: "Invitación enviada" con el código como backup manual */
          <div className="px-[26px] py-6">
            <div className="mb-[18px] text-center">
              <div className="font-display text-[18px] font-semibold text-ink">
                Invitación enviada
              </div>
              <p className="mt-1 text-[14px] leading-[1.5] text-muted">
                {result.emailSent
                  ? `Le enviamos un email a ${values.email.trim().toLowerCase()} con el código para activar su cuenta.`
                  : "No pudimos enviar el email. Compartile el código de abajo por tu cuenta."}
              </p>
            </div>

            <div className="mb-[18px] rounded-[16px] border-[1.5px] border-dashed border-link-code-border bg-consent-bg px-[18px] py-[18px] text-center">
              <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-link-code-label">
                CÓDIGO DE INVITACIÓN
              </div>
              <div className="font-display text-[34px] font-semibold tracking-[7px] text-consent-ink">
                {result.code}
              </div>
              <div className="mt-1.5 text-[13px] text-link-code-label">
                Vence en 7 días
              </div>
            </div>

            <button
              type="button"
              onClick={handleDone}
              className="w-full cursor-pointer rounded-[14px] bg-ink px-[13px] py-[13px] text-[15px] font-extrabold text-white"
            >
              Listo
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="px-[26px] py-[22px]">
            {/* Banner informativo del mockup */}
            <div className="mb-5 flex gap-[11px] rounded-[14px] bg-link-info-bg px-4 py-[13px]">
              <InfoIcon width={20} height={20} className="mt-px shrink-0 text-link-info-icon" />
              <span className="text-[13.5px] leading-[1.45] text-link-info-ink">
                Le enviaremos un correo con un código para que active su cuenta.
                Solo verá el feed de {childName}.
              </span>
            </div>

            <div className="mb-[18px]">
              <label htmlFor="link-parent-name" className={labelClass}>
                NOMBRE DEL PADRE/MADRE
              </label>
              <input
                id="link-parent-name"
                value={values.fullName}
                onChange={(event) => setField("fullName", event.target.value)}
                placeholder="Ej. Diego Fernández"
                disabled={isSubmitting}
                className={inputClass}
              />
            </div>

            <div className="mb-[18px]">
              <label htmlFor="link-parent-email" className={labelClass}>
                EMAIL
              </label>
              <input
                id="link-parent-email"
                type="email"
                value={values.email}
                onChange={(event) => setField("email", event.target.value)}
                placeholder="correo@ejemplo.com"
                disabled={isSubmitting}
                className={inputClass}
              />
            </div>

            <div className="mb-5">
              <span className={labelClass}>PARENTESCO</span>
              <div className="flex gap-[9px]">
                {RELATIONSHIPS.map((option) => {
                  const active = values.relationship === option.value;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      disabled={isSubmitting}
                      aria-pressed={active}
                      onClick={() => setField("relationship", option.value)}
                      className={`flex-1 cursor-pointer rounded-full border-[1.5px] px-3 py-[11px] text-[14px] font-extrabold transition-colors ${
                        active
                          ? "border-link-pill-active-border bg-link-pill-active-bg text-link-pill-active-ink"
                          : "border-link-pill-border bg-link-pill-bg text-link-pill-ink"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Código preview generado en el servidor (se confirma al enviar) */}
            <div className="mb-5 rounded-[16px] border-[1.5px] border-dashed border-link-code-border bg-consent-bg px-[18px] py-[18px] text-center">
              <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-link-code-label">
                CÓDIGO DE INVITACIÓN
              </div>
              <div
                className={`font-display text-[34px] font-semibold tracking-[7px] text-consent-ink ${
                  previewCode ? "" : "opacity-50"
                }`}
              >
                {previewCode ?? "·····"}
              </div>
              <div className="mt-1.5 text-[13px] text-link-code-label">
                Vence en 7 días
              </div>
            </div>

            {(fieldError || error) && (
              <p role="alert" className="mb-4 text-[13.5px] font-bold text-coral-deep">
                {fieldError ?? error}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full cursor-pointer items-center justify-center gap-[9px] rounded-[14px] bg-gradient-to-b from-coral-start to-coral-end px-[13px] py-[14px] text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgb(238_129_100_/_0.7)] disabled:cursor-wait disabled:opacity-70"
            >
              <SendIcon width={19} height={19} />
              {isSubmitting ? "Enviando..." : "Enviar invitación"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
