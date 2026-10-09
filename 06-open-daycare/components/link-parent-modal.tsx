"use client";

// Modal "Vincular padre" (SPEC 05): invita a un padre o tutor del niño con
// nombre, email y parentesco. El código se genera al abrir y la invitación
// se escribe en data/family.json a través de FamilyProvider.

import { useEffect, useState, type FormEvent } from "react";

import { generateInviteCode, type Relation } from "@/lib/family";
import { CheckIcon, CloseIcon, InfoIcon, SendIcon } from "./icons";
import { useFamily } from "./family-provider";

type FieldKey = "name" | "email" | "relation";

type FieldErrors = Partial<Record<FieldKey, string>>;

const EMPTY_VALUES = { name: "", email: "", relation: "" as Relation | "" };

const RELATIONS: Relation[] = ["Mamá", "Papá", "Tutor/a"];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+$/;

const labelClass = "mb-2 block text-[12px] font-extrabold tracking-[.7px] text-faint";

const inputClass =
  "w-full rounded-[14px] border-[1.5px] border-input-border bg-white px-4 py-[13px] text-[15px] text-ink outline-none placeholder:text-placeholder focus:border-input-focus";

const errorClass = "mt-2 text-[13.5px] font-bold text-coral-deep";

const submitClass =
  "flex w-full cursor-pointer items-center justify-center gap-[9px] rounded-[14px] bg-gradient-to-b from-coral-start to-coral-end px-[14px] py-[14px] text-[15.5px] font-extrabold text-white shadow-[0_10px_22px_-8px_rgb(238_129_100/0.7)] transition disabled:cursor-not-allowed disabled:opacity-70";

export function LinkParentModal({
  open,
  onClose,
  kidSlug,
  kidName,
}: {
  open: boolean;
  onClose: () => void;
  kidSlug: string;
  kidName: string;
}) {
  const { linkParent } = useFamily();
  // El padre lo renderiza solo mientras open es true: cada apertura monta una
  // instancia nueva, así el formulario nace limpio y el código se genera otra vez.
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [code] = useState(() => generateInviteCode());
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

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

  /** Actualiza un campo y limpia su error si había uno. */
  const setField = (field: FieldKey, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const next: FieldErrors = {};
    if (!values.name.trim()) next.name = "Ingresá el nombre del padre o madre.";
    if (!values.email.trim()) next.email = "Ingresá tu email.";
    else if (!EMAIL_PATTERN.test(values.email.trim())) next.email = "Ingresá un email válido.";
    if (!values.relation) next.relation = "Elegí un parentesco.";
    setErrors(next);
    if (next.name || next.email || next.relation) return;

    setPending(true);
    const result = await linkParent({
      kidSlug,
      name: values.name,
      email: values.email,
      relation: values.relation as Relation,
      code,
    });
    setPending(false);

    if (!result.ok) {
      setErrors((prev) => ({ ...prev, [result.field]: result.message }));
      return;
    }

    setSentTo(result.data.email);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-3 md:items-center md:p-6">
      {/* Fondo oscuro: clic fuera cierra sin enviar */}
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
        {/* Header: Vincular padre · a {kidName} · cerrar */}
        <div className="flex items-center justify-between border-b border-card-border px-[26px] py-5">
          <div className="min-w-0">
            <div
              id="link-parent-title"
              className="font-display text-[18px] font-semibold text-ink"
            >
              Vincular padre
            </div>
            <div className="text-[13px] text-muted">a {kidName}</div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar el modal"
            className="flex size-[34px] shrink-0 cursor-pointer items-center justify-center rounded-[10px] bg-card-divider text-faint"
          >
            <CloseIcon width={18} height={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} noValidate className="px-[26px] py-[22px]">
          {sentTo ? (
            /* Pantalla de éxito: confirma el envío y solo cierra */
            <div className="flex flex-col items-center py-4 text-center">
              <span className="mb-4 flex size-14 items-center justify-center rounded-full bg-status-active-bg text-status-active">
                <CheckIcon width={28} height={28} />
              </span>
              <h2 className="font-display text-[20px] font-semibold text-ink">
                Invitación enviada
              </h2>
              <p className="mt-2 text-[14.5px] leading-[1.5] text-body">
                Le enviamos un código a {sentTo} para que active su cuenta.
              </p>
              <button type="button" onClick={onClose} className={`${submitClass} mt-6`}>
                Listo
              </button>
            </div>
          ) : (
            <>
              {/* Banner informativo del mockup */}
              <div className="mb-5 flex gap-[11px] rounded-[14px] bg-link-info-bg px-4 py-[13px]">
                <InfoIcon
                  width={20}
                  height={20}
                  className="mt-px shrink-0 text-link-info-icon"
                />
                <span className="text-[13.5px] leading-[1.45] text-link-info-ink">
                  Le enviaremos un correo con un código para que active su cuenta. Solo verá
                  el feed de Mateo.
                </span>
              </div>

              <div className="mb-[18px]">
                <label htmlFor="link-parent-name" className={labelClass}>
                  NOMBRE DEL PADRE/MADRE
                </label>
                <input
                  id="link-parent-name"
                  value={values.name}
                  onChange={(event) => setField("name", event.target.value)}
                  placeholder="Ej. Diego Fernández"
                  aria-invalid={Boolean(errors.name)}
                  className={inputClass}
                />
                {errors.name && (
                  <p role="alert" className={errorClass}>
                    {errors.name}
                  </p>
                )}
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
                  aria-invalid={Boolean(errors.email)}
                  className={inputClass}
                />
                {errors.email && (
                  <p role="alert" className={errorClass}>
                    {errors.email}
                  </p>
                )}
              </div>

              <fieldset className="mb-5 border-0 p-0">
                <legend className={labelClass}>PARENTESCO</legend>
                <div className="flex gap-[9px]">
                  {RELATIONS.map((relation) => {
                    const active = values.relation === relation;
                    return (
                      <button
                        key={relation}
                        type="button"
                        onClick={() => setField("relation", relation)}
                        aria-pressed={active}
                        className={`flex-1 cursor-pointer rounded-full border-[1.5px] px-3 py-[11px] text-[14px] font-extrabold transition ${
                          active
                            ? "border-link-pill-active-border bg-link-pill-active-bg text-link-pill-active-ink"
                            : "border-link-pill-border bg-link-pill-bg text-link-pill-ink"
                        }`}
                      >
                        {relation}
                      </button>
                    );
                  })}
                </div>
                {errors.relation && (
                  <p role="alert" className={errorClass}>
                    {errors.relation}
                  </p>
                )}
              </fieldset>

              {/* Código de invitación: generado al abrir, caduca en 7 días */}
              <div className="mb-5 rounded-[16px] border-[1.5px] border-dashed border-link-code-border bg-consent-bg p-[18px] text-center">
                <div className="mb-2 text-[12px] font-extrabold tracking-[.7px] text-link-code-label">
                  CÓDIGO DE INVITACIÓN
                </div>
                <div className="font-display text-[34px] font-semibold tracking-[7px] text-consent-ink">
                  {code}
                </div>
                <div className="mt-1.5 text-[13px] text-link-code-label">Vence en 7 días</div>
              </div>

              <button type="submit" disabled={pending} className={submitClass}>
                <SendIcon width={19} height={19} />
                {pending ? "Enviando…" : "Enviar invitación"}
              </button>
            </>
          )}
        </form>
      </div>
    </div>
  );
}
