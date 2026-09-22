import { loadCities, removeCity, saveCities } from "../storage/citiesStorage.ts";

/** Elimina una ciudad guardada; devuelve false si no existía. */
export function removeSavedCity(id: number): boolean {
  const store = loadCities();
  if (!store.cities.some((c) => c.id === id)) {
    return false;
  }
  saveCities(removeCity(store, id));
  return true;
}