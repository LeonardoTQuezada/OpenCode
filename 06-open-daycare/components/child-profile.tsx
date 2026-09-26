import Link from "next/link";
import type { ChildProfile } from "@/lib/kids";
import { AlertTriangleIcon, ArrowLeftIcon, PlusIcon, SunIcon } from "./icons";
import { Avatar } from "./avatar";

/** Badge de estado del padre (ACTIVA / PENDIENTE). */
const STATUS_STYLES: Record<ChildProfile["parents"][number]["status"], string> = {
  ACTIVA: "bg-status-active-bg text-status-active",
  PENDIENTE: "bg-status-pending-bg text-status-pending",
};

/** Claves del perfil que se muestran como fila etiqueta/valor. */
type DetailKey = "birthDate" | "room" | "joinedAt";

const DETAIL_ROWS: { label: string; value: DetailKey }[] = [
  { label: "Fecha de nacimiento", value: "birthDate" },
  { label: "Sala", value: "room" },
  { label: "Ingreso", value: "joinedAt" },
];

/** Ficha completa de un niño: columna principal + columna de 300px. */
export function ChildProfileView({ profile }: { profile: ChildProfile }) {
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
              label={profile.initial}
              size={84}
              bg="bg-kid-blue"
              ink="text-kid-blue-ink"
            />
            <div className="min-w-0 flex-[1_1_180px]">
              <h1 className="font-display text-[28px] font-semibold leading-[1.2] text-ink">
                {profile.name}
              </h1>
              <p className="mt-[3px] text-[15px] text-faint">{profile.ageRoom}</p>
            </div>
            <Link
              href="/add-child"
              className="ml-auto shrink-0 rounded-[12px] border-[1.5px] border-card-border bg-card px-4 py-[9px] text-[14px] font-bold text-nav"
            >
              Editar
            </Link>
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
                {profile.allergies}
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
                  {profile[value]}
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

          <div className="rounded-2xl border border-card-border bg-card px-[18px] py-4">
            <div className="mb-[14px] text-[12.5px] font-extrabold tracking-[0.8px] text-label">
              PADRES VINCULADOS
            </div>

            <div className="flex flex-col gap-[14px]">
              {profile.parents.map((parent) => (
                <div key={parent.name} className="flex items-center gap-3">
                  <Avatar label={parent.initial} size={40} bg={parent.avatarBg} ink="text-white" />
                  <div className="min-w-0 flex-1">
                    <div className="text-[14.5px] font-extrabold text-ink">{parent.name}</div>
                    <div className="text-[12.5px] text-muted">{parent.role}</div>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-[9px] py-1 text-[10.5px] font-extrabold leading-[1.36] ${STATUS_STYLES[parent.status]}`}
                  >
                    {parent.status}
                  </span>
                </div>
              ))}

              <Link
                href="/link-parent"
                className="flex items-center gap-3 pt-2"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-[1.5px] border-dashed border-add-dashed text-photo-icon">
                  <PlusIcon width={18} height={18} stroke="currentColor" />
                </span>
                <span className="text-[14.5px] font-extrabold text-coral-deep">
                  Vincular otro padre
                </span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
