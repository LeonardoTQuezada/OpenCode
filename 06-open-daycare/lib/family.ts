// Vínculos familiares por niño. Sin API: se leen y escriben en
// data/family.json desde las Server Actions (SPEC 05).

import type { ParentLink } from "./kids";

// Parentesco que se puede elegir en el modal "Vincular padre".
export type Relation = "Mamá" | "Papá" | "Tutor/a";

// Una invitación enviada. `code` y `sentAt` son null en los padres semilla,
// que llegaron antes de que existiera el flujo de invitación.
export type FamilyEntry = {
  name: string;
  email: string;
  relation: Relation;
  status: "ACTIVA" | "PENDIENTE";
  code: string | null; // "7K4P9"
  sentAt: string | null; // "2026-10-07"
};

// Clave: Kid.slug. Cada niño tiene su propia lista de padres y tutores.
export type FamilyData = Record<string, FamilyEntry[]>;

// Alfabeto del código de invitación: A-Z y 0-9 sin O, 0, I ni 1 para que
// no se confundan al leerlos en voz alta o copiarlos a mano.
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

// Paletas de avatar de los padres, en rotación por índice. Las dos primeras
// reproducen los colores de Lucía y Diego del mockup.
const PARENT_PALETTES = [
  "bg-kid-purple",
  "bg-parent-blue",
  "bg-kid-pink",
  "bg-kid-green",
  "bg-kid-yellow",
];

// "7K4P9" — 5 caracteres, una nueva cada vez que se abre el modal.
export function generateInviteCode(): string {
  let code = "";
  for (let i = 0; i < 5; i += 1) {
    code += CODE_ALPHABET.charAt(Math.floor(Math.random() * CODE_ALPHABET.length));
  }
  return code;
}

// 0 → "sin padres vinculados", 1 → "1 padre vinculado", n → "n padres vinculados".
export function parentLabel(count: number): string {
  if (count === 0) return "sin padres vinculados";
  if (count === 1) return "1 padre vinculado";
  return `${count} padres vinculados`;
}

// Convierte las entradas guardadas en el modelo que ya consume la tarjeta
// "Padres vinculados": initial, role y avatarBg se derivan, no se persisten.
export function toParentLinks(entries: FamilyEntry[]): ParentLink[] {
  return entries.map((entry, index) => ({
    name: entry.name,
    initial: entry.name.charAt(0).toUpperCase(),
    role: `${entry.relation} · ${entry.status === "ACTIVA" ? "activa" : "invitación enviada"}`,
    status: entry.status,
    avatarBg: PARENT_PALETTES[index % PARENT_PALETTES.length],
  }));
}
