/**
 * Datos mock de la invitación que muestra la pantalla `/activate-account`.
 * Textos idénticos a `references/pantallas/activar-cuenta.dc.html`.
 * Sin persistencia ni API: son constantes hardcodeadas (SPEC 03).
 */
export type Invitation = {
  code: string; // "7K4P9"
  email: string; // "lucia.fernandez@gmail.com"
  kidName: string; // "Mateo"
  kidInitial: string; // "M"
  roomLabel: string; // "Mateo · Sala Soles"
  avatarBg: string; // clase Tailwind, ej. "bg-kid-blue"
  avatarInk: string; // clase Tailwind, ej. "text-kid-blue-ink"
};

export const INVITATION: Invitation = {
  code: "7K4P9",
  email: "lucia.fernandez@gmail.com",
  kidName: "Mateo",
  kidInitial: "M",
  roomLabel: "Mateo · Sala Soles",
  avatarBg: "bg-kid-blue",
  avatarInk: "text-kid-blue-ink",
};
