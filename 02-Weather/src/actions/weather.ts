import { getCurrentWeather, getDailyForecast } from "../api/forecast.ts";
import { loadCities } from "../storage/cities.ts";
import { loadSettings } from "../storage/settings.ts";
import type { ForecastResult, WeatherResult } from "../types/index.ts";

/**
 * Clima de la ciudad default. Devuelve null si no hay default configurado.
 */
export async function getDefaultCityWeather(): Promise<WeatherResult | null> {
  const store = loadCities();
  if (store.defaultCityId === null) {
    return null;
  }
  const city = store.cities.find((c) => c.id === store.defaultCityId);
  if (!city) {
    return null;
  }
  const settings = loadSettings();
  const weather = await getCurrentWeather(city.latitude, city.longitude, settings.unit);
  return { city, ...weather };
}

/**
 * Clima de todas las ciudades guardadas (default incluida si está en la lista).
 */
export async function getAllCitiesWeather(): Promise<WeatherResult[]> {
  const store = loadCities();
  const settings = loadSettings();
  const results: WeatherResult[] = [];
  for (const city of store.cities) {
    const weather = await getCurrentWeather(city.latitude, city.longitude, settings.unit);
    results.push({ city, ...weather });
  }
  return results;
}

/**
 * Pronóstico de 7 días de todas las ciudades guardadas.
 */
export async function getAllCitiesForecast(): Promise<ForecastResult[]> {
  const store = loadCities();
  const settings = loadSettings();
  const results: ForecastResult[] = [];
  for (const city of store.cities) {
    const forecast = await getDailyForecast(city.latitude, city.longitude, settings.unit);
    results.push({ city, ...forecast });
  }
  return results;
}