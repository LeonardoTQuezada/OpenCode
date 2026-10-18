// Sección "Padres vinculados" del perfil del niño (SPEC 11): lista real desde
// parent_children + invitaciones pendientes, con el botón que abre el modal
// "Vincular padre". Réplica de `references/pantallas/perfil-nino.dc.html`.

import { getParentsByChild, type ParentEntry } from "@/app/_actions/invitations";
import { avatarPaletteFor } from "@/lib/kids";
import { Avatar } from "../avatar";
import { LinkParentButton } from "./LinkParentButton";

const RELATIONSHIP_LABEL: Record<ParentEntry["relationship"], string> = {
  father: "Papá",
  mother: "Mamá",
  guardian: "Tutor/a",
};

/** Subtítulo por fila: "Mamá · activa" / "Papá · invitación enviada". */
function subtitleFor(parent: ParentEntry): string {
  const label = RELATIONSHIP_LABEL[parent.relationship];
  if (parent.status === "pending") return `${label} · invitación enviada`;
  return parent.relationship === "mother" ? `${label} · activa` : `${label} · activo`;
}

export async function ParentsSection({
  childId,
  childName,
}: {
  childId: string;
  childName: string;
}) {
  const parents = await getParentsByChild(childId);

  return (
    <div className="rounded-2xl border border-card-border bg-card px-[18px] py-4">
      <div className="mb-[14px] text-[12.5px] font-extrabold tracking-[0.8px] text-label">
        PADRES VINCULADOS
      </div>

      {parents.length === 0 ? (
        <p className="text-[14px] leading-[1.5] text-muted">
          Todavía no hay padres vinculados.
        </p>
      ) : (
        <ul className="flex flex-col gap-[14px]">
          {parents.map((parent) => {
            const isActive = parent.status === "active";
            const palette = avatarPaletteFor(parent.id);
            return (
              <li key={`${parent.status}-${parent.id}`} className="flex items-center gap-3">
                <Avatar
                  label={parent.fullName.charAt(0).toUpperCase()}
                  size={40}
                  bg={isActive ? palette.bg : "bg-parent-blue"}
                  ink={isActive ? palette.ink : "text-white"}
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[14.5px] font-extrabold text-ink">
                    {parent.fullName}
                  </div>
                  <div className="text-[12.5px] text-muted">{subtitleFor(parent)}</div>
                </div>
                {isActive ? (
                  <span className="flex-none rounded-full bg-status-active-bg px-[9px] py-1 text-[10.5px] font-extrabold text-status-active">
                    {parent.relationship === "mother" ? "ACTIVA" : "ACTIVO"}
                  </span>
                ) : (
                  <span className="flex-none rounded-full bg-status-pending-bg px-[9px] py-1 text-[10.5px] font-extrabold text-status-pending">
                    PENDIENTE
                  </span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <LinkParentButton childId={childId} childName={childName} />
    </div>
  );
}
