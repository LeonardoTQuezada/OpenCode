import { searchCities } from "../api/geocoding.ts";
import {
  addCity,
  loadCities,
  removeCity,
  saveCities,
  setDefaultCity,
  toStoredCity,
} from "../storage/cities.ts";
import type { GeoCity, StoredCity } from "../types/index.ts";

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

/** Todas las ciudades guardadas. */
export function listSavedCities(): StoredCity[] {
  return loadCities().cities;
}

/** Elimina una ciudad guardada; devuelve false si no existía. */
export function removeSavedCity(id: number): boolean {
  const store = loadCities();
  if (!store.cities.some((c) => c.id === id)) {
    return false;
  }
  saveCities(removeCity(store, id));
  return true;
}

/** Establece la ciudad default; devuelve false si no existe. */
export function persistSetDefaultCity(id: number): boolean {
  const store = loadCities();
  if (!store.cities.some((c) => c.id === id)) {
    return false;
  }
  saveCities(setDefaultCity(store, id));
  return true;
}