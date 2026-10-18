"use client";

import { useState } from "react";
import type { RoomGroup } from "./kids-list";
import { AddChildModal, type NewChildInput } from "./add-child-modal";
import { useFamily } from "./family-provider";
import { KidsList } from "./kids-list";
import { PlusIcon } from "./icons";

/** Pantalla de niños con su modal "Agregar niño" (SPEC 04).
 *  La lista sale de datos reales por prop (SPEC 10); el modal todavía
 *  persiste vía addKid del provider hasta que el Paso 5 lo conecte a
 *  createChild de Supabase. */
export function KidsScreen({ groups }: { groups: RoomGroup[] }) {
  const { addKid } = useFamily();
  const [isModalOpen, setIsModalOpen] = useState(false);

  /** Persiste el niño nuevo; el modal ya validó en cliente y la acción
   *  revalida en servidor antes de escribir el JSON. */
  const handleCreate = (input: NewChildInput) => {
    void addKid(input).then((result) => {
      if (!result.ok) console.error(result.message);
    });
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
      <KidsList groups={groups} />

      {/* Modal de alta de niño */}
      <AddChildModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
      />
    </>
  );
}
