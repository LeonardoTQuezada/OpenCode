import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  cleanupTempDir,
  createTempConfigDir,
  importWithTempConfig,
  resetConfigFiles,
} from "../helpers/withTempConfig.ts";
import type { GeoCity, StoredCity } from "../../src/types/City.ts";

type CitiesModule = typeof import("../../src/storage/citiesStorage.ts");

const tmpDir = createTempConfigDir();
let cities: CitiesModule;

const ottawa: StoredCity = {
  id: 1,
  name: "Ottawa",
  latitude: 45.41117,
  longitude: -75.69812,
  country: "Canadá",
  admin1: "Ontario",
};
const madrid: StoredCity = { id: 2, name: "Madrid", latitude: 40.4168, longitude: -3.7038, country: "España" };

beforeAll(async () => {
  cities = await importWithTempConfig<CitiesModule>("../../src/storage/citiesStorage.ts", tmpDir);
});

afterAll(() => {
  cleanupTempDir(tmpDir);
});

describe("storage/citiesStorage", () => {
  test("loadCities devuelve un store vacío si no hay archivo", () => {
    resetConfigFiles(tmpDir);
    expect(cities.loadCities()).toEqual({ defaultCityId: null, cities: [] });
  });

  test("saveCities y loadCities hacen round-trip", () => {
    resetConfigFiles(tmpDir);
    const store = { defaultCityId: 1, cities: [ottawa] };
    cities.saveCities(store);
    expect(cities.loadCities()).toEqual(store);
    expect(existsSync(join(tmpDir, "cities.json"))).toBe(true);
  });

  test("loadCities tolera un archivo corrupto", () => {
    resetConfigFiles(tmpDir);
    writeFileSync(join(tmpDir, "cities.json"), "{ no es json", "utf-8");
    expect(cities.loadCities()).toEqual({ defaultCityId: null, cities: [] });
  });

  test("loadCities tolera un default inválido", () => {
    resetConfigFiles(tmpDir);
    writeFileSync(
      join(tmpDir, "cities.json"),
      JSON.stringify({ defaultCityId: "raro", cities: [ottawa] }),
      "utf-8",
    );
    expect(cities.loadCities().defaultCityId).toBeNull();
  });

  test("addCity agrega y evita duplicados por id", () => {
    const base = { defaultCityId: null, cities: [ottawa] };
    const withMadrid = cities.addCity(base, madrid);
    expect(withMadrid.cities).toHaveLength(2);
    // Duplicado: no muta ni agrega
    expect(cities.addCity(base, ottawa)).toBe(base);
  });

  test("removeCity elimina una ciudad y limpia el default si era esa", () => {
    const store = { defaultCityId: 1, cities: [ottawa, madrid] };
    const result = cities.removeCity(store, 1);
    expect(result.cities).toEqual([madrid]);
    expect(result.defaultCityId).toBeNull();
  });

  test("removeCity de una ciudad que no existe deja el store intacto", () => {
    const store = { defaultCityId: 1, cities: [ottawa] };
    expect(cities.removeCity(store, 999)).toEqual(store);
  });

  test("setDefaultCity solo acepta ciudades existentes", () => {
    const store = { defaultCityId: null, cities: [ottawa] };
    expect(cities.setDefaultCity(store, 1).defaultCityId).toBe(1);
    expect(cities.setDefaultCity(store, 999)).toBe(store);
  });

  test("toStoredCity convierte un GeoCity en StoredCity", () => {
    const geo: GeoCity = { id: 3, name: "Lima", latitude: -12.0464, longitude: -77.0428, country: "Perú" };
    expect(cities.toStoredCity(geo)).toEqual({
      id: 3,
      name: "Lima",
      latitude: -12.0464,
      longitude: -77.0428,
      country: "Perú",
    });
  });
});