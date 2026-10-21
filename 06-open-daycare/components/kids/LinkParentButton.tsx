"use client";

import { useState } from "react";

import { PlusIcon } from "../icons";
import { LinkParentModal } from "./LinkParentModal";

/** Fila "Vincular otro padre" (client): abre el modal LinkParentModal.
 *  El listado de padres vive en el server component ParentsSection. */
export function LinkParentButton({
  childId,
  childName,
}: {
  childId: string;
  childName: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full cursor-pointer items-center gap-3 pt-[10px] text-left"
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full border-[1.5px] border-dashed border-add-dashed text-photo-icon">
          <PlusIcon width={18} height={18} stroke="currentColor" />
        </span>
        <span className="text-[14.5px] font-extrabold text-coral-deep">
          Vincular otro padre
        </span>
      </button>

      <LinkParentModal
        open={open}
        onClose={() => setOpen(false)}
        childId={childId}
        childName={childName}
      />
    </>
  );
}
