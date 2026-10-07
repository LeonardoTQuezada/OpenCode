"use client";

// Estado compartido de /kids y /kids/mateo (SPEC 05). Vive en el layout para
// que sobreviva a la navegación entre las dos rutas; la fuente de verdad es
// data/*.json y el provider solo replica en memoria lo que ya se guardó.

import { createContext, useContext, useState, type ReactNode } from "react";

import {
  addKidAction,
  linkParentAction,
  type ActionResult,
  type AddKidInput,
  type LinkParentInput,
} from "@/app/kids/actions";
import type { FamilyData, FamilyEntry } from "@/lib/family";
import type { Kid } from "@/lib/kids";

type FamilyContextValue = {
  kids: Kid[];
  family: FamilyData;
  /** Padres ya vinculados a un niño (vacío si no tiene entradas). */
  parentsOf: (kidSlug: string) => FamilyEntry[];
  /** Escribe data/family.json y agrega la entrada al estado local. */
  linkParent: (input: LinkParentInput) => Promise<ActionResult<FamilyEntry>>;
  /** Escribe data/kids.json y agrega el niño al estado local. */
  addKid: (input: AddKidInput) => Promise<ActionResult<Kid>>;
};

const FamilyContext = createContext<FamilyContextValue | null>(null);

export function FamilyProvider({
  initialKids,
  initialFamily,
  children,
}: {
  initialKids: Kid[];
  initialFamily: FamilyData;
  children: ReactNode;
}) {
  const [kids, setKids] = useState<Kid[]>(initialKids);
  const [family, setFamily] = useState<FamilyData>(initialFamily);

  function parentsOf(kidSlug: string): FamilyEntry[] {
    return family[kidSlug] ?? [];
  }

  async function linkParent(input: LinkParentInput): Promise<ActionResult<FamilyEntry>> {
    const result = await linkParentAction(input);
    if (result.ok) {
      setFamily((prev) => ({
        ...prev,
        [input.kidSlug]: [...(prev[input.kidSlug] ?? []), result.data],
      }));
    }
    return result;
  }

  async function addKid(input: AddKidInput): Promise<ActionResult<Kid>> {
    const result = await addKidAction(input);
    if (result.ok) setKids((prev) => [...prev, result.data]);
    return result;
  }

  return (
    <FamilyContext.Provider value={{ kids, family, parentsOf, linkParent, addKid }}>
      {children}
    </FamilyContext.Provider>
  );
}

/** Hook del contexto: falla con un error claro si se usa fuera del layout. */
export function useFamily(): FamilyContextValue {
  const context = useContext(FamilyContext);
  if (!context) {
    throw new Error("useFamily se usa fuera de <FamilyProvider> (app/kids/layout.tsx).");
  }
  return context;
}
