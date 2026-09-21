import type { Settings, WeatherResult } from "../types/index.ts";
import { cityLabel, unitSymbol } from "../utils/format.ts";
import { cyan, yellow } from "../utils/colors.ts";
import { SEPARATOR } from "./menu.ts";

/** Bloque formateado con el clima actual de una ciudad. */
export function formatWeather(weather: WeatherResult): string {
  return `${SEPARATOR}
  Clima de ${cityLabel(weather.city)}
${SEPARATOR}
  Temperatura: ${yellow(`${weather.temperature} ${weather.unitSymbol}`)}
  Actualizado: ${weather.time}`;
}

/** Pantalla de ajustes con la unidad actual. */
export function renderSettingsScreen(settings: Settings): string {
  const content = `${SEPARATOR}
         AJUSTES
${SEPARATOR}
  Unidad actual: ${unitSymbol(settings.unit)}
  1. Celsius (°C)
  2. Fahrenheit (°F)
  0. Volver`;
  return cyan(content);
}