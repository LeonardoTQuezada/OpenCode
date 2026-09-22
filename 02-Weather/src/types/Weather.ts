import type { StoredCity } from "./City.ts";

/** Condiciones actuales devueltas por la API de forecast. */
export interface CurrentWeather {
  temperature: number;
  unitSymbol: string;
  time: string;
}

/** Temperatura actual combinada con la ciudad a la que pertenece. */
export interface WeatherResult {
  city: StoredCity;
  temperature: number;
  unitSymbol: string;
  time: string;
}

/** Un día del pronóstico de 7 días. */
export interface DailyForecastDay {
  date: string;
  tempMin: number;
  tempMax: number;
  weatherCode: number;
}

/** Pronóstico de 7 días combinado con la ciudad a la que pertenece. */
export interface ForecastResult {
  city: StoredCity;
  unitSymbol: string;
  days: DailyForecastDay[];
}