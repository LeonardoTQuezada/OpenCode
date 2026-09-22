/** Unidades de temperatura soportadas por la app. */
export type Unit = "celsius" | "fahrenheit";

/** Contenido del archivo settings.json. */
export interface Settings {
  unit: Unit;
}