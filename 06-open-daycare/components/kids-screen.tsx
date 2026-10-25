"use client";

import { useState } from "react";
import { createChild } from "@/app/_actions/children";
import type { RoomGroup } from "./kids-list";
import { AddChildModal, type NewChildInput } from "./add-child-modal";
import { KidsList } from "./kids-list";
import { PlusIcon } from "./icons";

type Role = "staff" | "family";

/** "12/03/2022" → "2022-03-12" (el modal maneja dd/mm/aaaa, la BD ISO). */
function toIsoDate(value: string): string {
  const [day, month, year] = value.split("/");
  return `${year}-${month}-${day}`;
}

/** Pantalla de niños con su modal "Agregar niño" (SPEC 04 + SPEC 10).
 *  La lista y las salas salen de datos reales por prop; el modal da de alta
 *  el niño con createChild y revalidatePath refresca el listado. */
export function KidsScreen({ groups, role }: { groups: RoomGroup[]; role: Role }) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  /** Alta real: el modal ya validó en cliente; createChild revalida /kids. */
  const handleCreate = (input: NewChildInput) => {
    void createChild({
      roomId: input.roomId,
      fullName: input.fullName,
      birthDate: toIsoDate(input.birthDate),
      medicalNotes: input.medicalNotes ?? null,
      allergyTags: input.allergies
        ? input.allergies.split(",").map((tag) => tag.trim()).filter(Boolean)
        : [],
    })
      .then(() => setIsModalOpen(false))
      .catch((error) => console.error(error));
  };

  return (
    <>
      {/* Header */}
      <div className="mb-[22px] flex items-end justify-between gap-4">
        <div>
          <div className="mb-1 text-[12.5px] font-extrabold leading-[1.36] tracking-[0.8px] text-coral-strong">
            GESTIÓN
          </div>
          <h1 className="font-display text-[30px] font-semibold leading-[1.2] text-ink">
            Niños
          </h1>
        </div>
        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          aria-haspopup="dialog"
          className="flex cursor-pointer items-center gap-2 rounded-[14px] bg-[linear-gradient(180deg,#F4977E,#EE8164)] px-[18px] py-[11px] text-[14.5px] font-extrabold leading-[1.36] text-white shadow-button"
        >
          <PlusIcon width={17} height={17} />
          Agregar niño
        </button>
      </div>

      {/* Buscador + encabezados + grilla */}
      <KidsList groups={groups} role={role} />

      {/* Modal de alta de niño (salas reales de la guardería) */}
      <AddChildModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
        rooms={groups.map((group) => group.room)}
      />
    </>
  );
}
