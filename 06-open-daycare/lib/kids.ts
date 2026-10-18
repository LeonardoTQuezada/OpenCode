// Tipos y helpers de los niños. Los datos reales viven en Supabase
// (tabla `children`, SPEC 10); `Kid` es el shape adaptado que consumen
// los chips y el composer del feed (SPEC 06) hasta que el feed migre.

export type Kid = {
  /** Id real del child (usado como slug/chip key). */
  slug: string;
  name: string;
  initial: string;
  age: string;
  room: string; // nombre de la sala, ej. "Soles"
  avatarBg: string;
  avatarInk: string;
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

/** Paleta estable por id: el mismo id siempre eligiendo la misma (SPEC 10). */
export function avatarPaletteFor(id: string): { bg: string; ink: string } {
  const hash = [...id].reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return AVATAR_PALETTES[hash % AVATAR_PALETTES.length];
}

const ES_MONTHS = [
  "ene", "feb", "mar", "abr", "may", "jun",
  "jul", "ago", "sep", "oct", "nov", "dic",
];

/** "2022-03-12" → "12 mar 2022"; vacío o inválido → "". */
export function formatDateIso(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return "";
  const [, year, month, day] = match;
  return `${Number(day)} ${ES_MONTHS[Number(month) - 1]} ${year}`;
}

/** "2025-02-01" → "feb 2025"; vacío o inválido → "". */
export function formatMonthYearIso(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return "";
  const [, year, month] = match;
  return `${ES_MONTHS[Number(month) - 1]} ${year}`;
}

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
// La comparte el modal "Agregar niño" (SPEC 04) con su validación de servidor.
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

// Edad a partir de una fecha ISO ("2022-03-12" → "3 años"). Parsea a mano
// para no depender del timezone de Date (SPEC 10).
export function ageLabelFromIso(iso: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!match) return "";
  return ageLabel(`${match[3]}/${match[2]}/${match[1]}`);
}
