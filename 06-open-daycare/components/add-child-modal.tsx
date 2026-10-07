"use client";

import { useEffect, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { ROOMS, parseBirthDate } from "@/lib/kids";
import { CalendarIcon, ChevronDownIcon } from "./icons";

/** Datos que el modal entrega al padre para construir el niño (SPEC 04). */
export type NewChildInput = {
  fullName: string;
  birthDate: string; // "dd/mm/aaaa"
  roomId: string;
  allergies?: string;
  medicalNotes?: string;
};

/** Valores iniciales del formulario (los 3 obligatorios nacen vacíos). */
const EMPTY_VALUES = {
  fullName: "",
  birthDate: "",
  roomId: "",
  allergies: "",
  medicalNotes: "",
};

type FormValues = typeof EMPTY_VALUES;

/** Errores de validación por campo del modal. */
type FieldErrors = Partial<Record<keyof FormValues, string>>;

/** Edad máxima que acepta la guardería. */
const MAX_AGE_YEARS = 6;

const labelClass = "mb-2 block text-[12px] font-extrabold tracking-[.7px] text-faint";

const inputClass =
  "w-full rounded-[14px] border-[1.5px] border-input-border bg-white px-4 py-[13px] text-[15px] text-ink outline-none placeholder:text-placeholder focus:border-input-focus";

/** Deja solo dígitos y coloca las barras sola: 12032022 → 12/03/2022. */
function maskDate(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 10);
  const day = digits.slice(0, 2);
  if (digits.length <= 2) return day;
  const month = digits.slice(2, 4);
  if (digits.length <= 4) return `${day}/${month}`;
  return `${day}/${month}/${digits.slice(4, 8)}`;
}

/** Valida la fecha de nacimiento y devuelve el mensaje de error o undefined. */
function validateBirthDate(value: string): string | undefined {
  if (!value.trim()) return "Ingresá la fecha de nacimiento.";

  const birth = parseBirthDate(value);
  if (!birth) return "Usá una fecha válida en formato dd/mm/aaaa.";

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (birth.getTime() > startOfToday.getTime()) return "La fecha no puede ser futura.";

  const oldestAllowed = new Date(
    today.getFullYear() - MAX_AGE_YEARS,
    today.getMonth(),
    today.getDate(),
  );
  if (birth.getTime() < oldestAllowed.getTime()) {
    return `El niño debe tener máximo ${MAX_AGE_YEARS} años.`;
  }

  return undefined;
}

/** Modal "Agregar niño": réplica de `references/pantallas/agregar-nino.dc.html`
 *  con validación por campo. Solo llama a `onSubmit` cuando todo es válido. */
export function AddChildModal({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (input: NewChildInput) => void;
}) {
  const [values, setValues] = useState(EMPTY_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const dateInputRef = useRef<HTMLInputElement>(null);

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
  const setField = (field: keyof FormValues, value: string) => {
    setValues((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  /** El date picker entrega "2022-03-12"; el campo visible vive en dd/mm/aaaa. */
  const handlePickedDate = (event: ChangeEvent<HTMLInputElement>) => {
    const iso = event.target.value;
    if (!iso) return;
    const [year, month, day] = iso.split("-");
    setField("birthDate", `${day}/${month}/${year}`);
  };

  /** Abre el calendario nativo junto al campo de fecha. */
  const openCalendar = () => {
    const input = dateInputRef.current;
    if (!input) return;
    try {
      input.showPicker();
    } catch {
      // Navegadores sin showPicker(): el input nativo sigue siendo utilizable.
      input.focus();
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const next: FieldErrors = {};
    if (!values.fullName.trim()) next.fullName = "Ingresá el nombre completo.";
    next.birthDate = validateBirthDate(values.birthDate);
    if (!values.roomId) next.roomId = "Elegí una sala.";
    setErrors(next);

    if (next.fullName || next.birthDate || next.roomId) return;

    onSubmit({
      fullName: values.fullName,
      birthDate: values.birthDate,
      roomId: values.roomId,
      allergies: values.allergies.trim() || undefined,
      medicalNotes: values.medicalNotes.trim() || undefined,
    });
    setValues(EMPTY_VALUES);
    setErrors({});
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto p-3 md:p-6">
      {/* Fondo oscuro: clic fuera cierra sin guardar */}
      <div
        aria-hidden="true"
        className="fixed inset-0 bg-modal-overlay"
        onClick={onClose}
      />

      {/* Card del mockup: 520px máximo, casi a pantalla completa en móvil */}
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-child-title"
        onSubmit={handleSubmit}
        noValidate
        className="relative z-10 w-full max-w-[520px] overflow-hidden rounded-[24px] border border-card-border bg-page shadow-modal"
      >
        {/* Header: Cancelar · Agregar niño · Guardar */}
        <div className="flex items-center justify-between border-b border-card-border px-[26px] py-5">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer text-[15px] font-bold text-faint"
          >
            Cancelar
          </button>
          <span
            id="add-child-title"
            className="font-display text-[18px] font-semibold text-ink"
          >
            Agregar niño
          </span>
          <button
            type="submit"
            className="cursor-pointer text-[15px] font-extrabold text-coral-strong"
          >
            Guardar
          </button>
        </div>

        {/* Body con los 5 campos del mockup */}
        <div className="px-[26px] py-6">
          <div className="mb-[18px]">
            <label htmlFor="add-child-name" className={labelClass}>
              NOMBRE COMPLETO
            </label>
            <input
              id="add-child-name"
              value={values.fullName}
              onChange={(event) => setField("fullName", event.target.value)}
              placeholder="Ej. Martina López"
              aria-invalid={Boolean(errors.fullName)}
              className={inputClass}
            />
            {errors.fullName && (
              <p role="alert" className="mt-2 text-[13.5px] font-bold text-coral-deep">
                {errors.fullName}
              </p>
            )}
          </div>

          {/* Fila: fecha (con máscara y calendario) + sala */}
          <div className="mb-[18px] flex flex-col gap-[14px] sm:flex-row">
            <div className="min-w-0 flex-1">
              <label htmlFor="add-child-birthdate" className={labelClass}>
                FECHA DE NACIMIENTO
              </label>
              <div className="relative">
                <input
                  id="add-child-birthdate"
                  value={values.birthDate}
                  onChange={(event) => setField("birthDate", maskDate(event.target.value))}
                  placeholder="dd/mm/aaaa"
                  inputMode="numeric"
                  aria-invalid={Boolean(errors.birthDate)}
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={openCalendar}
                  aria-label="Elegir la fecha con el calendario"
                  className="absolute inset-y-0 right-0 flex w-11 cursor-pointer items-center justify-center rounded-r-[13px] text-photo-icon"
                >
                  <CalendarIcon width={18} height={18} />
                </button>
                {/* Date picker nativo: invisible, solo lo abre el botón */}
                <input
                  ref={dateInputRef}
                  type="date"
                  tabIndex={-1}
                  aria-hidden="true"
                  onChange={handlePickedDate}
                  className="pointer-events-none absolute inset-y-0 right-0 w-11 opacity-0"
                />
              </div>
              {errors.birthDate && (
                <p role="alert" className="mt-2 text-[13.5px] font-bold text-coral-deep">
                  {errors.birthDate}
                </p>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <label htmlFor="add-child-room" className={labelClass}>
                SALA
              </label>
              <div className="relative">
                <select
                  id="add-child-room"
                  value={values.roomId}
                  onChange={(event) => setField("roomId", event.target.value)}
                  aria-invalid={Boolean(errors.roomId)}
                  className={`${inputClass} cursor-pointer appearance-none pr-10 font-bold`}
                >
                  <option value="">Elegí una sala</option>
                  {ROOMS.map((room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
                <ChevronDownIcon
                  width={16}
                  height={16}
                  className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-photo-icon"
                />
              </div>
              {errors.roomId && (
                <p role="alert" className="mt-2 text-[13.5px] font-bold text-coral-deep">
                  {errors.roomId}
                </p>
              )}
            </div>
          </div>

          <div className="mb-[18px]">
            <label htmlFor="add-child-allergies" className={labelClass}>
              ALERGIAS (ETIQUETAS)
            </label>
            <input
              id="add-child-allergies"
              value={values.allergies}
              onChange={(event) => setField("allergies", event.target.value)}
              placeholder="Ej. Maní, Lactosa"
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="add-child-notes" className={labelClass}>
              NOTAS MÉDICAS
            </label>
            <textarea
              id="add-child-notes"
              value={values.medicalNotes}
              onChange={(event) => setField("medicalNotes", event.target.value)}
              placeholder="Indicaciones, medicación, contactos…"
              className={`${inputClass} min-h-[90px] resize-y leading-[1.5]`}
            />
          </div>
        </div>
      </form>
    </div>
  );
}
