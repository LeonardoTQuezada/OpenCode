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
  avatarBg: string;
  avatarInk: string;
  parentLabel: string;
  tag?: { label: string; kind: KidTagKind };
};

// Los 8 niños, en el mismo orden y con los mismos textos que el mockup.
export const KIDS: Kid[] = [
  {
    slug: "mateo-fernandez",
    name: "Mateo Fernández",
    initial: "M",
    age: "3 años",
    room: "Soles",
    avatarBg: "bg-kid-blue",
    avatarInk: "text-kid-blue-ink",
    parentLabel: "2 padres vinculados",
    tag: { label: "MANÍ", kind: "allergy" },
  },
  {
    slug: "sofia-mendez",
    name: "Sofía Méndez",
    initial: "S",
    age: "2 años",
    room: "Soles",
    avatarBg: "bg-kid-pink",
    avatarInk: "text-kid-pink-ink",
    parentLabel: "1 padre vinculado",
  },
  {
    slug: "benjamin-ruiz",
    name: "Benjamín Ruiz",
    initial: "B",
    age: "3 años",
    room: "Soles",
    avatarBg: "bg-kid-green",
    avatarInk: "text-kid-green-ink",
    parentLabel: "2 padres vinculados",
  },
  {
    slug: "valentina-soto",
    name: "Valentina Soto",
    initial: "V",
    age: "2 años",
    room: "Soles",
    avatarBg: "bg-kid-yellow",
    avatarInk: "text-kid-yellow-ink",
    parentLabel: "sin padres vinculados",
    tag: { label: "VINCULAR", kind: "link" },
  },
  {
    slug: "tomas-diaz",
    name: "Tomás Díaz",
    initial: "T",
    age: "3 años",
    room: "Soles",
    avatarBg: "bg-kid-purple",
    avatarInk: "text-kid-purple-ink",
    parentLabel: "1 padre vinculado",
    tag: { label: "LACTOSA", kind: "allergy" },
  },
  {
    slug: "emma-castro",
    name: "Emma Castro",
    initial: "E",
    age: "2 años",
    room: "Soles",
    avatarBg: "bg-kid-pink",
    avatarInk: "text-kid-pink-ink",
    parentLabel: "1 padre vinculado",
  },
  {
    slug: "lucas-romero",
    name: "Lucas Romero",
    initial: "L",
    age: "3 años",
    room: "Soles",
    avatarBg: "bg-kid-blue",
    avatarInk: "text-kid-blue-ink",
    parentLabel: "1 padre vinculado",
  },
  {
    slug: "olivia-vega",
    name: "Olivia Vega",
    initial: "O",
    age: "2 años",
    room: "Soles",
    avatarBg: "bg-kid-green",
    avatarInk: "text-kid-green-ink",
    parentLabel: "1 padre vinculado",
  },
];

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

  if (months < 12) return `${Math.max(months, 0)} meses`;

  const years = Math.floor(months / 12);
  return years === 1 ? "1 año" : `${years} años`;
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
    parentLabel: "sin padres vinculados",
  };

  if (allergies) kid.allergies = allergies;
  if (medicalNotes) kid.medicalNotes = medicalNotes;
  if (firstAllergy) kid.tag = { label: firstAllergy.toUpperCase(), kind: "allergy" };

  return kid;
}
