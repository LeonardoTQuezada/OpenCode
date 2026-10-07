"use client";

import { useState } from "react";
import { AddChildModal, type NewChildInput } from "./add-child-modal";
import { useFamily } from "./family-provider";
import { KidsList } from "./kids-list";
import { PlusIcon } from "./icons";

/** Pantalla de niños con su modal "Agregar niño" (SPEC 04).
 *  Los niños ya no son un useState local: salen del provider, que los lee de
 *  data/kids.json y los persiste con addKidAction (SPEC 05). */
export function KidsScreen() {
  const { kids, addKid } = useFamily();
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

      {/* Buscador + encabezado + grilla */}
      <KidsList kids={kids} />

      {/* Modal de alta de niño */}
      <AddChildModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleCreate}
      />
    </>
  );
}
