import { cyan } from "../utils/colors.ts";

export const SEPARATOR = "════════════════════════════════════════";

export const OPTIONS = {
  DEFAULT_WEATHER: "1",
  ALL_WEATHER: "2",
  SEARCH_ADD: "3",
  REMOVE: "4",
  SET_DEFAULT: "5",
  FORECAST: "6",
  SETTINGS: "8",
  EXIT: "9",
} as const;

export const VALID_OPTIONS = new Set<string>(Object.values(OPTIONS));

/**
 * Renderiza el menú principal. El (N) de la opción 2 es el número de
 * ciudades guardadas. El formato sigue el ejemplo del README.
 */
export function renderMenu(cityCount: number): string {
  const content = `${SEPARATOR}
         WEATHER CLI
${SEPARATOR}
  1. Clima de ciudad default
  2. Clima de todas las ciudades (${cityCount})
  3. Buscar y agregar ciudad
  4. Eliminar ciudad
  5. Establecer ciudad default
  6. Pronóstico 7 días
  8. Ajustes (°C)
  9. Salir
${SEPARATOR}
  Selecciona una opción: `;
  return cyan(content);
}