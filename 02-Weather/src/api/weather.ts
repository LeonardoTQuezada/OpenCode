import type { CurrentWeather, DailyForecastDay } from "../types/Weather.ts";
import type { Unit } from "../types/Settings.ts";

const FORECAST_URL = "https://api.open-meteo.com/v1/forecast";

interface ForecastResponse {
  current?: { time?: string; temperature_2m?: number };
  current_units?: { temperature_2m?: string };
}

interface DailyResponse {
  daily?: {
    time?: string[];
    temperature_2m_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    weather_code?: (number | null)[];
  };
  daily_units?: { temperature_2m_max?: string };
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

/**
 * Paso 2 del flujo: obtiene el pronóstico diario (7 días) para unas coordenadas.
 * Incluye temperatura máxima, mínima y el código WMO de la condición del tiempo.
 * Si la unidad es fahrenheit, la API ya devuelve los valores convertidos.
 */
export async function getDailyForecast(
  latitude: number,
  longitude: number,
  unit: Unit = "celsius",
): Promise<{ days: DailyForecastDay[]; unitSymbol: string }> {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    daily: "temperature_2m_max,temperature_2m_min,weather_code",
    forecast_days: "7",
  });
  if (unit === "fahrenheit") {
    params.set("temperature_unit", "fahrenheit");
  }

  const res = await fetch(`${FORECAST_URL}?${params.toString()}`);
  if (!res.ok) {
    throw new Error(`Error del servicio de clima (HTTP ${res.status})`);
  }
  const data = (await res.json()) as DailyResponse;

  const times = data.daily?.time ?? [];
  const maxTemps = data.daily?.temperature_2m_max ?? [];
  const minTemps = data.daily?.temperature_2m_min ?? [];
  const weatherCodes = data.daily?.weather_code ?? [];

  if (times.length === 0 || times.length !== maxTemps.length || times.length !== minTemps.length) {
    throw new Error("La API de clima no devolvió el pronóstico diario");
  }

  const days: DailyForecastDay[] = times.map((date, i) => {
    const tempMax = maxTemps[i];
    const tempMin = minTemps[i];
    if (typeof tempMax !== "number" || typeof tempMin !== "number") {
      throw new Error("La API de clima no devolvió temperaturas diarias");
    }
    return {
      date,
      tempMax,
      tempMin,
      weatherCode: typeof weatherCodes[i] === "number" ? weatherCodes[i] : 0,
    };
  });

  return {
    days,
    unitSymbol: data.daily_units?.temperature_2m_max ?? (unit === "fahrenheit" ? "°F" : "°C"),
  };
}