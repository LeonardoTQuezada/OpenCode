import { getDailyForecast } from "../api/weather.ts";
import { loadCities } from "../storage/citiesStorage.ts";
import { loadSettings } from "../storage/settingsStorage.ts";
import type { ForecastResult } from "../types/Weather.ts";

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