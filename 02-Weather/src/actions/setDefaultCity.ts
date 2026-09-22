import { loadCities, saveCities, setDefaultCity } from "../storage/citiesStorage.ts";

/** Establece la ciudad default; devuelve false si no existe. */
export function persistSetDefaultCity(id: number): boolean {
  const store = loadCities();
  if (!store.cities.some((c) => c.id === id)) {
    return false;
  }
  saveCities(setDefaultCity(store, id));
  return true;
}