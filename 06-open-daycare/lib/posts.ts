// Tipos y helpers de las publicaciones del feed. Los posts viven en la BD
// (SPEC 13: lectura en lib/feed-posts.ts, escritura en la Server Action
// app/_actions/posts.ts); este módulo queda como capa pura de tipos,
// mapeos UI↔BD, límites de fotos y clases Tailwind, sin React.

import type { Kid } from "./kids";

export type PostType =
  | "COMIDA"
  | "SIESTA"
  | "ACTIVIDAD"
  | "LOGRO"
  | "ÁNIMO"
  | "FOTO"
  | "ANUNCIO";

export type Audience =
  | { kind: "room" } // "Toda la sala"
  | { kind: "kids"; slugs: string[] }; // selección múltiple, sin "room"

/** Orden y rótulos de las 7 pastillas del bloque TIPO (mockup). */
export const POST_TYPE_OPTIONS: { type: PostType; label: string }[] = [
  { type: "COMIDA", label: "Comida" },
  { type: "SIESTA", label: "Siesta" },
  { type: "ACTIVIDAD", label: "Actividad" },
  { type: "LOGRO", label: "Logro" },
  { type: "ÁNIMO", label: "Ánimo" },
  { type: "FOTO", label: "Foto" },
  { type: "ANUNCIO", label: "Anuncio" },
];

/** Valores del enum `post_type` de la BD (migración 009). */
export type DbPostType =
  | "meal"
  | "nap"
  | "activity"
  | "achievement"
  | "mood"
  | "photo"
  | "announcement";

/** Mapa UI → BD del enum post_type (SPEC 12). 'mood' = Ánimo. */
export const BD_TYPE_BY_UI: Record<PostType, DbPostType> = {
  COMIDA: "meal",
  SIESTA: "nap",
  ACTIVIDAD: "activity",
  LOGRO: "achievement",
  ÁNIMO: "mood",
  FOTO: "photo",
  ANUNCIO: "announcement",
};

/** Mapa inverso BD → UI, para leer posts de la BD. */
export const UI_TYPE_BY_BD: Record<DbPostType, PostType> = {
  meal: "COMIDA",
  nap: "SIESTA",
  activity: "ACTIVIDAD",
  achievement: "LOGRO",
  mood: "ÁNIMO",
  photo: "FOTO",
  announcement: "ANUNCIO",
};

/** Máximo de fotos por publicación (validado en cliente y en la action). */
export const MAX_PHOTOS = 10;

/** Peso máximo por foto: 5 MB (validado en cliente y en la action). */
export const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/** Formatos aceptados para las fotos (cliente y action). */
export const PHOTO_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

/** Clases Tailwind del badge por tipo. Literales, no se pueden armar con
 *  template: Tailwind no detectaría las clases construidas en runtime. */
const BADGE_CLASSES: Record<PostType, { bg: string; text: string }> = {
  COMIDA: { bg: "bg-badge-comida-bg", text: "text-badge-comida" },
  SIESTA: { bg: "bg-badge-siesta-bg", text: "text-badge-siesta" },
  ACTIVIDAD: { bg: "bg-badge-actividad-bg", text: "text-badge-actividad" },
  LOGRO: { bg: "bg-badge-logro-bg", text: "text-badge-logro" },
  ÁNIMO: { bg: "bg-badge-animo-bg", text: "text-badge-animo" },
  FOTO: { bg: "bg-badge-foto-bg", text: "text-badge-foto" },
  ANUNCIO: { bg: "bg-badge-anuncio-bg", text: "text-badge-anuncio" },
};

/** Clases de la pastilla de TIPO del modal (colores sólidos del mockup). */
const TIPO_CLASSES: Record<PostType, { bg: string; text: string }> = {
  COMIDA: { bg: "bg-tipo-comida-bg", text: "text-tipo-comida-ink" },
  SIESTA: { bg: "bg-tipo-siesta-bg", text: "text-tipo-siesta-ink" },
  ACTIVIDAD: { bg: "bg-tipo-actividad-bg", text: "text-tipo-actividad-ink" },
  LOGRO: { bg: "bg-tipo-logro-bg", text: "text-tipo-logro-ink" },
  ÁNIMO: { bg: "bg-tipo-animo-bg", text: "text-tipo-animo-ink" },
  FOTO: { bg: "bg-tipo-foto-bg", text: "text-tipo-foto-ink" },
  ANUNCIO: { bg: "bg-tipo-anuncio-bg", text: "text-tipo-anuncio-ink" },
};

export function badgeClasses(type: PostType): { bg: string; text: string } {
  return BADGE_CLASSES[type];
}

export function tipoClasses(type: PostType): { bg: string; text: string } {
  return TIPO_CLASSES[type];
}

function kidBySlug(kids: Kid[], slug: string): Kid | undefined {
  return kids.find((kid) => kid.slug === slug);
}

function firstName(kid: Kid): string {
  return kid.name.split(" ")[0];
}

function firstNames(slugs: string[], kids: Kid[]): string[] {
  return slugs
    .map((slug) => kidBySlug(kids, slug))
    .filter((kid): kid is Kid => Boolean(kid))
    .map(firstName);
}

/** "Para: toda la sala" / "Para: familia de Mateo" / "…Mateo, Sofía y Benjamín". */
export function audienceLabel(audience: Audience, kids: Kid[]): string {
  if (audience.kind === "room") return "Para: toda la sala";
  return `Para: familia de ${firstNames(audience.slugs, kids).join(", ")}`;
}

/** "Toda la sala" / "Mateo" / "Varios niños". */
export function postTitle(audience: Audience, kids: Kid[]): string {
  if (audience.kind === "room") return "Toda la sala";
  const names = firstNames(audience.slugs, kids);
  if (names.length === 0) return "";
  if (names.length === 1) return names[0];
  return "Varios niños";
}
