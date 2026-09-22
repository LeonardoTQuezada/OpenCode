import { searchCities } from "../api/geocoding.ts";
import {
  addCity,
  loadCities,
  saveCities,
  toStoredCity,
} from "../storage/citiesStorage.ts";
import type { GeoCity } from "../types/City.ts";

/** Busca ciudades por nombre en la API de geocoding. */
export async function searchAndListCities(name: string): Promise<GeoCity[]> {
  return searchCities(name, 5);
}

/** Guarda la ciudad elegida; devuelve false si ya estaba guardada. */
export function saveCity(city: GeoCity): boolean {
  const store = loadCities();
  if (store.cities.some((c) => c.id === city.id)) {
    return false;
  }
  saveCities(addCity(store, toStoredCity(city)));
  return true;
}