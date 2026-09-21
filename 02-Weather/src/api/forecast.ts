import type { CurrentWeather, Unit } from "../types/index.ts";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

interface ForecastResponse {
  current?: { time?: string; temperature_2m?: number };
  current_units?: { temperature_2m?: string };
}

/**
 * Paso 2 del flujo: obtiene la temperatura actual para unas coordenadas.
 * Si la unidad es fahrenheit, la API ya devuelve el valor convertido.
 */
export async function getCurrentWeather(
  latitude: number,
  longitude: number,
  unit: Unit = "celsius",
): Promise<CurrentWeather> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m",
  });
  if (unit === "fahrenheit") {
    params.set("temperature_unit", "fahrenheit");
  }

  const res = await fetch(`${FORECAST_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Error del servicio de clima (HTTP ${res.status})`);
  }
  const data = (await res.json()) as ForecastResponse;

  const temperature = data.current?.temperature_2m;
  if (typeof temperature !== "number") {
    throw new Error("La API de clima no devolvió temperatura");
  }

  return {
    temperature,
    unitSymbol: data.current_units?.temperature_2m ?? (unit === "fahrenheit" ? "°F" : "°C"),
    time: data.current?.time ?? "",
  };
}