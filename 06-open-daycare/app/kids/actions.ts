// Server Actions de /kids (SPEC 05): escriben los JSON de data/ y refrescan
// el router para que la UI muestre los datos recién guardados.

"use server";

import { refresh } from "next/cache";

import { readFamily, readKids, writeFamily, writeKids } from "@/lib/data";
import { generateInviteCode, type FamilyEntry, type Relation } from "@/lib/family";
import { createKid, validateBirthDate, type Kid } from "@/lib/kids";

/** Campos que pueden fallar la validación, para pintar el error debajo. */
export type ActionField =
  | "name"
  | "email"
  | "relation"
  | "fullName"
  | "birthDate"
  | "roomId";

export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; field: ActionField; message: string };

function fail<T>(field: ActionField, message: string): ActionResult<T> {
  return { ok: false, field, message };
}

export type LinkParentInput = {
  kidSlug: string;
  name: string;
  email: string;
  relation: Relation;
  /** Código generado al abrir el modal: es el que se muestra y el que se guarda. */
  code: string;
};

/**
 * Valida la invitación, la agrega como PENDIENTE en data/family.json y
 * refresca el router. El email se compara en minúsculas contra los padres
 * ya vinculados a ese niño.
 */
export async function linkParentAction(
  input: LinkParentInput,
): Promise<ActionResult<FamilyEntry>> {
  const name = input.name.trim().replace(/\s+/g, " ");
  const email = input.email.trim();

  if (!name) return fail("name", "Ingresá el nombre del padre o madre.");
  if (!email) return fail("email", "Ingresá tu email.");
  if (!/^[^\s@]+@[^\s@]+$/.test(email)) return fail("email", "Ingresá un email válido.");
  if (!input.relation) return fail("relation", "Elegí un parentesco.");

  const family = await readFamily();
  const entries = family[input.kidSlug] ?? [];
  const normalized = email.toLowerCase();

  if (entries.some((entry) => entry.email.toLowerCase() === normalized)) {
    return fail("email", "Ese email ya está vinculado a este niño.");
  }

  const entry: FamilyEntry = {
    name,
    email,
    relation: input.relation,
    status: "PENDIENTE",
    // Se guarda el código que vio el usuario en el modal; si llega malformado
    // (invocación directa de la acción) se genera uno nuevo.
    code: /^[A-Z2-9]{5}$/.test(input.code.trim()) ? input.code.trim() : generateInviteCode(),
    sentAt: new Date().toISOString().slice(0, 10),
  };

  family[input.kidSlug] = [...entries, entry];
  await writeFamily(family);
  refresh();

  return { ok: true, data: entry };
}

export type AddKidInput = {
  fullName: string;
  birthDate: string; // "dd/mm/aaaa"
  roomId: string;
  allergies?: string;
  medicalNotes?: string;
};

/**
 * Alta de niño desde el modal de SPEC 04: con lo validado escribe
 * data/kids.json. La edad y el rechazo de fechas futuras los cubre
 * validateBirthDate, el mismo que usa el modal.
 */
export async function addKidAction(input: AddKidInput): Promise<ActionResult<Kid>> {
  if (!input.fullName.trim()) return fail("fullName", "Ingresá el nombre completo.");

  const birthDateError = validateBirthDate(input.birthDate);
  if (birthDateError) return fail("birthDate", birthDateError);

  if (!input.roomId) return fail("roomId", "Elegí una sala.");

  const kids = await readKids();
  const kid = createKid(input, kids);

  await writeKids([...kids, kid]);
  refresh();

  return { ok: true, data: kid };
}
