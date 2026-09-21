import type { GeoCity } from "../types/index.ts";

const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

interface GeocodingResponse {
  results?: GeoCity[];
}

/**
 * Paso 1 del flujo: busca ciudades por nombre usando la Geocoding API de OpenMeteo.
 * Devuelve una lista vacía si no hay coincidencias.
 */
export async function searchCities(name: string, count = 5): Promise<GeoCity[]> {
  const url = `${GEOCODING_URL}?name=${encodeURIComponent(name)}&count=${count}&language=es&format=json`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error del servicio de geocoding (HTTP ${res.status})`);
  }
  const data = (await res.json()) as GeocodingResponse;
  return data.results ?? [];
}