import type { ForecastResult, Settings, Unit, WeatherResult } from "../types/index.ts";
import { cityLabel, formatTemperature, unitSymbol, weatherCodeLabel } from "../utils/format.ts";
import { SEPARATOR } from "./menu.ts";

/** Bloque formateado con el clima actual de una ciudad. */
export function formatWeather(weather: WeatherResult): string {
  return `${SEPARATOR}
  Clima de ${cityLabel(weather.city)}
${SEPARATOR}
  Temperatura: ${weather.temperature} ${weather.unitSymbol}
  Actualizado: ${weather.time}`;
}

/** Bloque formateado con el pronóstico de 7 días de una ciudad. */
export function formatForecast(forecast: ForecastResult): string {
  const unit: Unit = forecast.unitSymbol === "°F" ? "fahrenheit" : "celsius";
  const rows = forecast.days
    .map(
      (day) =>
        `  ${day.date}   Mín: ${formatTemperature(day.tempMin, unit)}   Máx: ${formatTemperature(day.tempMax, unit)}   ${weatherCodeLabel(day.weatherCode)}`,
    )
    .join("\n");
  return `${SEPARATOR}
  Pronóstico 7 días de ${cityLabel(forecast.city)}
${SEPARATOR}
${rows}`;
}

/** Pantalla de ajustes con la unidad actual. */
export function renderSettingsScreen(settings: Settings): string {
  return `${SEPARATOR}
         AJUSTES
${SEPARATOR}
  Unidad actual: ${unitSymbol(settings.unit)}
  1. Celsius (°C)
  2. Fahrenheit (°F)
  0. Volver`;
}