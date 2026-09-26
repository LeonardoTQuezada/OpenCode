// Datos mock de los niños de la sala. Sin persistencia ni API:
// son constantes de presentación para las pantallas de SPEC 02.

export type KidTagKind = "allergy" | "link";

export type Kid = {
  slug: string;
  name: string;
  initial: string;
  age: string;
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
    avatarBg: "bg-kid-pink",
    avatarInk: "text-kid-pink-ink",
    parentLabel: "1 padre vinculado",
  },
  {
    slug: "benjamin-ruiz",
    name: "Benjamín Ruiz",
    initial: "B",
    age: "3 años",
    avatarBg: "bg-kid-green",
    avatarInk: "text-kid-green-ink",
    parentLabel: "2 padres vinculados",
  },
  {
    slug: "valentina-soto",
    name: "Valentina Soto",
    initial: "V",
    age: "2 años",
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
    avatarBg: "bg-kid-pink",
    avatarInk: "text-kid-pink-ink",
    parentLabel: "1 padre vinculado",
  },
  {
    slug: "lucas-romero",
    name: "Lucas Romero",
    initial: "L",
    age: "3 años",
    avatarBg: "bg-kid-blue",
    avatarInk: "text-kid-blue-ink",
    parentLabel: "1 padre vinculado",
  },
  {
    slug: "olivia-vega",
    name: "Olivia Vega",
    initial: "O",
    age: "2 años",
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
