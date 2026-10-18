import Link from "next/link";

import type { Child } from "@/app/_actions/children";
import {
  ageLabelFromIso,
  avatarPaletteFor,
  formatDateIso,
  formatMonthYearIso,
} from "@/lib/kids";
import { AlertTriangleIcon, ArrowLeftIcon, SunIcon } from "./icons";
import { Avatar } from "./avatar";
import { ParentsSection } from "./kids/ParentsSection";

const DETAIL_ROWS: { label: string; value: string }[] = [
  { label: "Fecha de nacimiento", value: "birthDate" },
  { label: "Sala", value: "room" },
  { label: "Ingreso", value: "joinedAt" },
];

/** Ficha completa de un niño: columna principal + columna de 300px.
 *  Recibe el child real de Supabase y el nombre de su sala (SPEC 10).
 *  Los padres vinculados salen de ParentsSection (SPEC 11). */
export function ChildProfileView({ child, roomName }: { child: Child; roomName: string }) {
  const palette = avatarPaletteFor(child.id);
  const age = ageLabelFromIso(child.birth_date);

  const allergiesText = child.allergy_tags.filter(Boolean).join(", ");
  const notesText = child.medical_notes?.trim() ?? "";
  const alertText = [allergiesText, notesText].filter(Boolean).join(" — ");

  const details: Record<string, string> = {
    birthDate: formatDateIso(child.birth_date),
    room: roomName,
    joinedAt: formatMonthYearIso(child.enrolled_at),
  };

  return (
    <>
      {/* Volver al listado */}
      <Link
        href="/kids"
        className="mb-5 inline-flex items-center gap-[7px] text-[14px] font-bold text-faint"
      >
        <ArrowLeftIcon width={18} height={18} />
        Volver a Niños
      </Link>

      <div className="flex flex-wrap items-start gap-[26px]">
        {/* Columna principal */}
        <div className="flex min-w-[300px] flex-1 flex-col gap-[18px]">
          {/* Cabecera. En móvil (<640px) "Editar" pasa a su propia fila
               porque con el avatar de 84px no queda ancho para el nombre. */}
          <div className="flex flex-wrap items-center gap-[18px]">
            <Avatar
              label={child.full_name.charAt(0).toUpperCase()}
              size={84}
              bg={palette.bg}
              ink={palette.ink}
            />
            <div className="min-w-0 flex-[1_1_180px]">
              <h1 className="font-display text-[28px] font-semibold leading-[1.2] text-ink">
                {child.full_name}
              </h1>
              <p className="mt-[3px] text-[15px] text-faint">
                {`${age} · Sala ${roomName}`}
              </p>
            </div>
            {/* Inerte hasta su propia spec (editar/eliminar niños). */}
            <span className="ml-auto shrink-0 rounded-[12px] border-[1.5px] border-card-border bg-card px-4 py-[9px] text-[14px] font-bold text-nav">
              Editar
            </span>
          </div>

          {/* Alergias y notas */}
          <div className="flex gap-[14px] rounded-2xl bg-alert-bg px-[18px] py-4">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-[11px] bg-alert-icon-bg">
              <AlertTriangleIcon width={22} height={22} />
            </span>
            <div>
              <div className="mb-0.5 text-[15px] font-extrabold text-alert-title">
                Alergias y notas
              </div>
              <div className="text-[14.5px] leading-[1.5] text-alert-body">
                {alertText || "Sin alergias ni notas médicas registradas."}
              </div>
            </div>
          </div>

          {/* Datos */}
          <div className="overflow-hidden rounded-2xl border border-card-border bg-card">
            {DETAIL_ROWS.map(({ label, value }, index) => (
              <div
                key={label}
                className={`flex justify-between px-[18px] py-[15px] ${
                  index < DETAIL_ROWS.length - 1 ? "border-b border-card-divider" : ""
                }`}
              >
                <span className="text-[14.5px] text-faint">{label}</span>
                <span className="text-[14.5px] font-extrabold text-ink">
                  {details[value]}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Columna lateral */}
        <div className="flex w-full flex-none flex-col gap-[14px] md:w-[300px]">
          <Link
            href="/day-summary"
            className="flex w-full items-center justify-center gap-[9px] rounded-[14px] bg-ink px-[13px] py-[13px] text-[15px] font-extrabold text-white"
          >
            <SunIcon width={18} height={18} />
            Resumen del día
          </Link>

          <ParentsSection childId={child.id} childName={child.full_name} />
        </div>
      </div>
    </>
  );
}
