import type { GeoCity, StoredCity, Unit } from "../types/index.ts";

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