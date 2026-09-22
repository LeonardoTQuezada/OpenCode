/** Resultado de la API de geocoding de OpenMeteo. */
export interface GeoCity {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  country_code?: string;
  admin1?: string;
  timezone?: string;
}

/** Ciudad guardada localmente en cities.json. */
export interface StoredCity {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country?: string;
  admin1?: string;
}

/** Contenido del archivo cities.json. */
export interface CitiesStore {
  defaultCityId: number | null;
  cities: StoredCity[];
}