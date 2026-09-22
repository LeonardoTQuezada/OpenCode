import type { GeoCity, StoredCity } from "../types/City.ts";
import type { Unit } from "../types/Settings.ts";

/** Símbolo de la unidad de temperatura. */
export function unitSymbol(unit: Unit): string {
  return unit === "fahrenheit" ? "°F" : "°C";
}

/** Formatea una temperatura a 1 decimal con su símbolo. Ej: "11.3 °C". */
export function formatTemperature(value: number, unit: Unit): string {
  const rounded = Math.round(value * 10) / 10;
  return `${rounded} ${unitSymbol(unit)}`;
}

/** Etiqueta legible de una ciudad: "Madrid, Comunidad de Madrid, España". */
export function cityLabel(city: GeoCity | StoredCity): string {
  const parts = [city.name, city.admin1, city.country].filter(
    (part): part is string => Boolean(part),
  );
  return parts.join(", ");
}

/** Convierte una lista de strings en una lista numerada de 1..N. */
export function formatNumberedList(items: string[]): string {
  return items.map((item, i) => `  ${i + 1}. ${item}`).join("\n");
}

/** Códigos WMO de condición del tiempo traducidos al español. */
const WMO_WEATHER_CODES: Record<number, string> = {
  0: "Despejado",
  1: "Mayormente despejado",
  2: "Parcialmente nublado",
  3: "Nublado",
  45: "Niebla",
  48: "Niebla con cencellada",
  51: "Llovizna ligera",
  53: "Llovizna moderada",
  55: "Llovizna intensa",
  56: "Llovizna congelante ligera",
  57: "Llovizna congelante intensa",
  61: "Lluvia ligera",
  63: "Lluvia moderada",
  65: "Lluvia intensa",
  66: "Lluvia congelante ligera",
  67: "Lluvia congelante intensa",
  71: "Nieve ligera",
  73: "Nieve moderada",
  75: "Nieve intensa",
  77: "Granos de nieve",
  80: "Chubascos ligeros",
  81: "Chubascos moderados",
  82: "Chubascos violentos",
  85: "Chubascos de nieve ligeros",
  86: "Chubascos de nieve intensos",
  95: "Tormenta",
  96: "Tormenta con granizo ligero",
  99: "Tormenta con granizo intenso",
};

/** Etiqueta en español del código WMO. Ej: 2 -> "Parcialmente nublado". */
export function weatherCodeLabel(code: number): string {
  return WMO_WEATHER_CODES[code] ?? `Código ${code}`;
}