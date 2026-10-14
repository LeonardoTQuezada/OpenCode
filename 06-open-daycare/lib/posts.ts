// Tipos y helpers de las publicaciones del feed. El estado vive en memoria
// (posts-provider) y se pierde al recargar (SPEC 06). Módulo puro, sin React,
// para que la migración futura a base de datos toque solo esta capa.

import type { Kid } from "./kids";

export type PostType =
  | "COMIDA"
  | "SIESTA"
  | "ACTIVIDAD"
  | "LOGRO"
  | "ÁNIMO"
  | "FOTO"
  | "ANUNCIO";

export type PostPhoto = {
  /** Object URL de la foto elegida. Ausente = placeholder del mockup. */
  src?: string;
  /** "Foto · pintando con témperas" solo en los posts semilla. */
  label: string;
  /** Altura de la caja, 200. */
  height: number;
};

export type Post = {
  id: string;
  type: PostType;
  /** Clases Tailwind del pill: `bg-*` derivada del token @theme. */
  badgeBg: string;
  /** Clase Tailwind `text-*` derivada del token @theme. */
  badgeText: string;
  /** Clase Tailwind `bg-*` del avatar. */
  avatarBg: string;
  /** Clase Tailwind `text-*` de la letra del avatar. */
  avatarInk: string;
  /** Letra para el avatar del niño, o vacío para el ícono de anuncio. */
  avatarLabel: string;
  title: string; // "Mateo" / "Varios niños" / "Toda la sala"
  time: string; // "14:20 · publicado por vos"
  audience: string; // "Para: familia de Mateo"
  body: string;
  photos: PostPhoto[];
  likes: number;
  comments: number;
};

export type Audience =
  | { kind: "room" } // "Toda la sala"
  | { kind: "kids"; slugs: string[] }; // selección múltiple, sin "room"

export type NewPostInput = {
  audience: Audience;
  type: PostType;
  body: string;
  photos: PostPhoto[];
};

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

/** Avatar: megáfono de anuncio para "Toda la sala", avatar del primer niño. */
export function postAvatar(
  audience: Audience,
  kids: Kid[],
): { bg: string; ink: string; label: string; useMegaphone: boolean } {
  const room = { bg: "bg-badge-anuncio-bg", ink: "text-badge-anuncio", label: "" };

  if (audience.kind === "room") return { ...room, useMegaphone: true };

  const kid = kidBySlug(kids, audience.slugs[0]);
  if (!kid) return { ...room, useMegaphone: true };

  return { bg: kid.avatarBg, ink: kid.avatarInk, label: kid.initial, useMegaphone: false };
}

function clock(now: Date): string {
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return `${hours}:${minutes}`;
}

export function createPost(input: NewPostInput, kids: Kid[], now: Date): Post {
  const avatar = postAvatar(input.audience, kids);
  const badge = badgeClasses(input.type);

  return {
    id: crypto.randomUUID(),
    type: input.type,
    badgeBg: badge.bg,
    badgeText: badge.text,
    avatarBg: avatar.bg,
    avatarInk: avatar.ink,
    avatarLabel: avatar.label,
    title: postTitle(input.audience, kids),
    time: `${clock(now)} · publicado por vos`,
    audience: audienceLabel(input.audience, kids),
    body: input.body.trim(),
    photos: input.photos,
    likes: 0,
    comments: 0,
  };
}

/** Los 3 posts del mockup del feed (SPEC 01). */
export const SEED_POSTS: Post[] = [
  {
    id: "logro-orinal-mateo",
    type: "LOGRO",
    badgeBg: "bg-badge-logro-bg",
    badgeText: "text-badge-logro",
    avatarBg: "bg-avatar-m-bg",
    avatarInk: "text-avatar-m",
    avatarLabel: "M",
    title: "Mateo",
    time: "14:20 · publicado por vos",
    audience: "Para: familia de Mateo",
    body: "¡Usó el orinal solito por primera vez! Estaba feliz de contárselo a todos. Un gran paso.",
    photos: [],
    likes: 3,
    comments: 1,
  },
  {
    id: "actividad-temperas",
    type: "ACTIVIDAD",
    badgeBg: "bg-badge-actividad-bg",
    badgeText: "text-badge-actividad",
    avatarBg: "bg-avatar-m-bg",
    avatarInk: "text-avatar-m",
    avatarLabel: "M",
    title: "Mateo",
    time: "09:40 · publicado por vos",
    audience: "Para: familia de Mateo",
    body: "Pintamos con témperas esta mañana. Mateo eligió el azul para todo y se concentró un montón mezclando colores.",
    photos: [{ label: "Foto · pintando con témperas", height: 200 }],
    likes: 5,
    comments: 2,
  },
  {
    id: "anuncio-parque",
    type: "ANUNCIO",
    badgeBg: "bg-badge-anuncio-bg",
    badgeText: "text-badge-anuncio",
    avatarBg: "bg-badge-anuncio-bg",
    avatarInk: "text-badge-anuncio",
    avatarLabel: "",
    title: "Anuncio general",
    time: "07:50 · publicado por vos",
    audience: "Para: toda la sala",
    body: "El viernes salimos al parque por la mañana. Recuerden mandar gorra y una botellita de agua.",
    photos: [],
    likes: 8,
    comments: 0,
  },
];
