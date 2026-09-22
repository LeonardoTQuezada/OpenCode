import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import {
  cleanupTempDir,
  createTempConfigDir,
  importWithTempConfig,
  resetConfigFiles,
} from "../helpers/withTempConfig.ts";
import type { GeoCity } from "../../src/types/City.ts";

type AddCityActions = typeof import("../../src/actions/addCity.ts");
type CitiesStorage = typeof import("../../src/storage/citiesStorage.ts");

const tmpDir = createTempConfigDir();
const originalFetch = globalThis.fetch;
let actions: AddCityActions;
let storage: CitiesStorage;

const ottawa: GeoCity = {
  id: 1,
  name: "Ottawa",
  latitude: 45.41117,
  longitude: -75.69812,
  country: "Canadá",
  admin1: "Ontario",
};

beforeAll(async () => {
  actions = await importWithTempConfig<AddCityActions>("../../src/actions/addCity.ts", tmpDir);
  storage = await importWithTempConfig<CitiesStorage>("../../src/storage/citiesStorage.ts", tmpDir);
});

afterAll(() => {
  cleanupTempDir(tmpDir);
  globalThis.fetch = originalFetch;
});

describe("actions/addCity", () => {
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
});