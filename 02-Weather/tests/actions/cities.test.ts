import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import {
  cleanupTempDir,
  createTempConfigDir,
  importWithTempConfig,
  resetConfigFiles,
} from "../helpers/withTempConfig.ts";
import type { GeoCity } from "../../src/types/index.ts";

type CitiesActions = typeof import("../../src/actions/cities.ts");
type CitiesStorage = typeof import("../../src/storage/cities.ts");

const tmpDir = createTempConfigDir();
const originalFetch = globalThis.fetch;
let actions: CitiesActions;
let storage: CitiesStorage;

const ottawa: GeoCity = {
  id: 1,
  name: "Ottawa",
  latitude: 45.41117,
  longitude: -75.69812,
  country: "Canadá",
  admin1: "Ontario",
};
const madrid: GeoCity = {
  id: 2,
  name: "Madrid",
  latitude: 40.4168,
  longitude: -3.7038,
  country: "España",
  admin1: "Comunidad de Madrid",
};

beforeAll(async () => {
  actions = await importWithTempConfig<CitiesActions>("../../src/actions/cities.ts", tmpDir);
  storage = await importWithTempConfig<CitiesStorage>("../../src/storage/cities.ts", tmpDir);
});

afterAll(() => {
  cleanupTempDir(tmpDir);
  globalThis.fetch = originalFetch;
});

describe("actions/cities", () => {
  test("searchAndListCities llama a la API de geocoding", async () => {
    globalThis.fetch = mock(() =>
      new Response(JSON.stringify({ results: [ottawa] }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }),
    ) as unknown as typeof fetch;
    const results = await actions.searchAndListCities("Ottawa");
    expect(results).toEqual([ottawa]);
  });

  test("searchAndListCities propaga los errores de la API", async () => {
    globalThis.fetch = mock(() => new Response("{}", { status: 500 })) as unknown as typeof fetch;
    await expect(actions.searchAndListCities("Ottawa")).rejects.toThrow("HTTP 500");
  });

  test("saveCity guarda una ciudad nueva y rechaza duplicados", () => {
    resetConfigFiles(tmpDir);
    expect(actions.saveCity(ottawa)).toBe(true);
    expect(actions.saveCity(ottawa)).toBe(false);
    expect(storage.loadCities().cities).toEqual([
      {
        id: 1,
        name: "Ottawa",
        latitude: 45.41117,
        longitude: -75.69812,
        country: "Canadá",
        admin1: "Ontario",
      },
    ]);
  });

  test("listSavedCities devuelve las ciudades guardadas", () => {
    resetConfigFiles(tmpDir);
    actions.saveCity(ottawa);
    actions.saveCity(madrid);
    expect(actions.listSavedCities()).toHaveLength(2);
  });

  test("persistSetDefaultCity fija el default solo si la ciudad existe", () => {
    resetConfigFiles(tmpDir);
    actions.saveCity(ottawa);
    actions.saveCity(madrid);

    expect(actions.persistSetDefaultCity(2)).toBe(true);
    expect(storage.loadCities().defaultCityId).toBe(2);
    expect(actions.persistSetDefaultCity(999)).toBe(false);
    expect(storage.loadCities().defaultCityId).toBe(2);
  });

  test("removeSavedCity elimina y limpia el default si era esa", () => {
    resetConfigFiles(tmpDir);
    actions.saveCity(ottawa);
    actions.saveCity(madrid);
    actions.persistSetDefaultCity(2);

    expect(actions.removeSavedCity(2)).toBe(true);
    expect(storage.loadCities().cities).toHaveLength(1);
    expect(storage.loadCities().defaultCityId).toBeNull();
    expect(actions.removeSavedCity(999)).toBe(false);
  });
});