const ANSI = {
  cyan: "\x1b[36m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  red: "\x1b[31m",
} as const;

export type ColorName = keyof typeof ANSI;

const RESET = "\x1b[0m";

/**
 * Indica si se deben emitir códigos ANSI. Se desactiva con NO_COLOR y
 * se fuerza con FORCE_COLOR; por defecto solo se activa en un TTY real.
 */
export function useColor(): boolean {
  if (process.env.NO_COLOR !== undefined && process.env.NO_COLOR !== "") {
    return false;
  }
  if (process.env.FORCE_COLOR !== undefined && process.env.FORCE_COLOR !== "0") {
    return true;
  }
  return process.stdout.isTTY === true;
}

/** Envuelve texto con el código ANSI del color dado, sin verificar soporte. */
export function paint(text: string, name: ColorName): string {
  return `${ANSI[name]}${text}${RESET}`;
}

/** Aplica el color solo si la terminal lo soporta. */
function color(text: string, name: ColorName): string {
  return useColor() ? paint(text, name) : text;
}

export const cyan = (text: string): string => color(text, "cyan");
export const yellow = (text: string): string => color(text, "yellow");
export const green = (text: string): string => color(text, "green");
export const red = (text: string): string => color(text, "red");