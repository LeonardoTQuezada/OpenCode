import { loadCities } from "../storage/citiesStorage.ts";
import type { StoredCity } from "../types/City.ts";

/** Todas las ciudades guardadas. */
export function listSavedCities(): StoredCity[] {
  return loadCities().cities;
}