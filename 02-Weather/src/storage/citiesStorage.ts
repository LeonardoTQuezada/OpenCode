import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { CITIES_FILE, CONFIG_DIR } from "../utils/constants.ts";
import type { CitiesStore, GeoCity, StoredCity } from "../types/City.ts";

export const EMPTY_STORE: CitiesStore = { defaultCityId: null, cities: [] };

/** Crea el directorio de configuración si no existe. */
export function ensureConfigDir(): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
}

/** Lee cities.json; devuelve un store vacío si falta o está corrupto. */
export function loadCities(): CitiesStore {
  if (!existsSync(CITIES_FILE)) {
    return { ...EMPTY_STORE, cities: [] };
  }
  try {
    const parsed = JSON.parse(readFileSync(CITIES_FILE, "utf-8")) as Partial<CitiesStore>;
    return {
      defaultCityId:
        typeof parsed.defaultCityId === "number" ? parsed.defaultCityId : null,
      cities: Array.isArray(parsed.cities) ? (parsed.cities as StoredCity[]) : [],
    };
  } catch {
    return { ...EMPTY_STORE, cities: [] };
  }
}

/** Persiste el store completo en cities.json. */
export function saveCities(store: CitiesStore): void {
  ensureConfigDir();
  writeFileSync(CITIES_FILE, JSON.stringify(store, null, 2), "utf-8");
}

/** Devuelve un nuevo store con la ciudad agregada (sin duplicados por id). */
export function addCity(store: CitiesStore, city: StoredCity): CitiesStore {
  if (store.cities.some((c) => c.id === city.id)) {
    return store;
  }
  return { ...store, cities: [...store.cities, city] };
}

/** Devuelve un nuevo store sin la ciudad indicada; limpia el default si era esa. */
export function removeCity(store: CitiesStore, id: number): CitiesStore {
  const cities = store.cities.filter((c) => c.id !== id);
  const defaultCityId = store.defaultCityId === id ? null : store.defaultCityId;
  return { ...store, cities, defaultCityId };
}

/** Devuelve un nuevo store con la ciudad indicada como default (solo si existe). */
export function setDefaultCity(store: CitiesStore, id: number): CitiesStore {
  if (!store.cities.some((c) => c.id === id)) {
    return store;
  }
  return { ...store, defaultCityId: id };
}

/** Convierte un resultado de geocoding en una ciudad guardable. */
export function toStoredCity(city: GeoCity): StoredCity {
  return {
    id: city.id,
    name: city.name,
    latitude: city.latitude,
    longitude: city.longitude,
    country: city.country,
    admin1: city.admin1,
  };
}