// Datos mock de los niños de la sala. Sin persistencia ni API:
// son constantes de presentación para las pantallas de SPEC 02 y SPEC 04.

export type KidTagKind = "allergy" | "link";

export type Room = {
  id: string; // "soles"
  name: string; // "Soles"
};

// Las 6 salas mock que ofrece el select del modal "Agregar niño" (SPEC 04).
export const ROOMS: Room[] = [
  { id: "soles", name: "Soles" },
  { id: "lunas", name: "Lunas" },
  { id: "estrellas", name: "Estrellas" },
  { id: "nubes", name: "Nubes" },
  { id: "mariposas", name: "Mariposas" },
  { id: "cielo", name: "Cielo" },
];

export type Kid = {
  slug: string;
  name: string;
  initial: string;
  age: string;
  room: string; // nombre de la sala, ej. "Soles"
  allergies?: string; // texto libre del modal, ej. "Maní, Lactosa"
  medicalNotes?: string; // texto libre del modal
  birthDate?: string; // "12 mar 2022" — solo en los perfiles con ficha propia
  joinedAt?: string; // "feb 2025" — idem
  avatarBg: string;
  avatarInk: string;
  // Sin parentLabel: el texto de padres se deriva del conteo en
  // data/family.json con parentLabel() de lib/family.ts (SPEC 05).
  tag?: { label: string; kind: KidTagKind };
};

export type ParentLink = {
  name: string;
  initial: string;
  role: string;
  status: "ACTIVA" | "PENDIENTE";
  avatarBg: string;
};

export type ChildProfile = {
  name: string;
  initial: string;
  ageRoom: string;
  birthDate: string;
  room: string;
  joinedAt: string;
  allergies: string;
  parents: ParentLink[];
};

// Perfil de Mateo: es el único con pantalla propia (/kids/mateo) en esta spec.
export const MATEO: ChildProfile = {
  name: "Mateo Fernández",
  initial: "M",
  ageRoom: "3 años · Sala Soles",
  birthDate: "12 mar 2022",
  room: "Soles",
  joinedAt: "feb 2025",
  allergies: "Alergia al maní. Evitar frutos secos. Lleva inhalador en la mochila.",
  parents: [
    {
      name: "Lucía Fernández",
      initial: "L",
      role: "Mamá · activa",
      status: "ACTIVA",
      avatarBg: "bg-kid-purple",
    },
    {
      name: "Diego Fernández",
      initial: "D",
      role: "Papá · invitación enviada",
      status: "PENDIENTE",
      avatarBg: "bg-parent-blue",
    },
  ],
};

// ---------------------------------------------------------------------------
// Helpers del modal "Agregar niño" (SPEC 04)
// ---------------------------------------------------------------------------

// Paletas de avatar en rotación para los niños nuevos.
const AVATAR_PALETTES: { bg: string; ink: string }[] = [
  { bg: "bg-kid-blue", ink: "text-kid-blue-ink" },
  { bg: "bg-kid-pink", ink: "text-kid-pink-ink" },
  { bg: "bg-kid-green", ink: "text-kid-green-ink" },
  { bg: "bg-kid-yellow", ink: "text-kid-yellow-ink" },
  { bg: "bg-kid-purple", ink: "text-kid-purple-ink" },
];

// Convierte "12/03/2022" en Date. Devuelve null si el formato no coincide
// o si la fecha no existe (31/02, 45/13, etc.).
export function parseBirthDate(value: string): Date | null {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

// "12/03/2022" → "3 años"; con singular "1 año"; menos de un año → "5 meses".
export function ageLabel(birthDate: string): string {
  const birth = parseBirthDate(birthDate);
  if (!birth) return "";

  const today = new Date();
  let months =
    (today.getFullYear() - birth.getFullYear()) * 12 + (today.getMonth() - birth.getMonth());
  if (today.getDate() < birth.getDate()) months -= 1;

  if (months < 12) {
    const safeMonths = Math.max(months, 0);
    return `${safeMonths} ${safeMonths === 1 ? "mes" : "meses"}`;
  }

  const years = Math.floor(months / 12);
  return years === 1 ? "1 año" : `${years} años`;
}

// Edad máxima que acepta la guardería.
export const MAX_AGE_YEARS = 6;

// Valida la fecha de nacimiento y devuelve el mensaje de error o undefined.
// Vive en lib/ para que la comparta el modal "Agregar niño" (SPEC 04) y la
// Server Action addKidAction (SPEC 05).
export function validateBirthDate(value: string): string | undefined {
  if (!value.trim()) return "Ingresá la fecha de nacimiento.";

  const birth = parseBirthDate(value);
  if (!birth) return "Usá una fecha válida en formato dd/mm/aaaa.";

  const today = new Date();
  const startOfToday = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (birth.getTime() > startOfToday.getTime()) return "La fecha no puede ser futura.";

  const oldestAllowed = new Date(
    today.getFullYear() - MAX_AGE_YEARS,
    today.getMonth(),
    today.getDate(),
  );
  if (birth.getTime() < oldestAllowed.getTime()) {
    return `El niño debe tener máximo ${MAX_AGE_YEARS} años.`;
  }

  return undefined;
}

// "Martina López" → "martina-lopez"; si ya existe → "martina-lopez-2".
export function slugify(name: string, taken: string[]): string {
  const base =
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "nino";

  let slug = base;
  let counter = 2;
  while (taken.includes(slug)) {
    slug = `${base}-${counter}`;
    counter += 1;
  }

  return slug;
}

// Construye el Kid nuevo a partir del formulario validado (SPEC 04).
export function createKid(
  input: {
    fullName: string;
    birthDate: string; // "dd/mm/aaaa"
    roomId: string;
    allergies?: string;
    medicalNotes?: string;
  },
  existing: Kid[],
): Kid {
  const name = input.fullName.trim().replace(/\s+/g, " ");
  const palette = AVATAR_PALETTES[existing.length % AVATAR_PALETTES.length];
  const allergies = input.allergies?.trim() ?? "";
  const medicalNotes = input.medicalNotes?.trim() ?? "";
  const firstAllergy = allergies.split(",")[0]?.trim() ?? "";

  const kid: Kid = {
    slug: slugify(name, existing.map((entry) => entry.slug)),
    name,
    initial: name.charAt(0).toUpperCase(),
    age: ageLabel(input.birthDate),
    room: ROOMS.find((room) => room.id === input.roomId)?.name ?? "",
    avatarBg: palette.bg,
    avatarInk: palette.ink,
  };

  if (allergies) kid.allergies = allergies;
  if (medicalNotes) kid.medicalNotes = medicalNotes;
  if (firstAllergy) kid.tag = { label: firstAllergy.toUpperCase(), kind: "allergy" };

  return kid;
}
