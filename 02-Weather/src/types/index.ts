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

/** Unidades de temperatura soportadas por la app. */
export type Unit = "celsius" | "fahrenheit";

/** Contenido del archivo settings.json. */
export interface Settings {
  unit: Unit;
}

/** Condiciones actuales devueltas por la API de forecast. */
export interface CurrentWeather {
  temperature: number;
  unitSymbol: string;
  time: string;
}

/** Temperatura actual combinada con la ciudad a la que pertenece. */
export interface WeatherResult {
  city: StoredCity;
  temperature: number;
  unitSymbol: string;
  time: string;
}