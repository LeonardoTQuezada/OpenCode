import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import {
  cleanupTempDir,
  createTempConfigDir,
  importWithTempConfig,
  resetConfigFiles,
} from "../helpers/withTempConfig.ts";
import type { StoredCity } from "../../src/types/index.ts";

type WeatherActions = typeof import("../../src/actions/weather.ts");
type CitiesStorage = typeof import("../../src/storage/cities.ts");

const tmpDir = createTempConfigDir();
const originalFetch = globalThis.fetch;
let weatherActions: WeatherActions;
let citiesStorage: CitiesStorage;

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
  weatherActions = await importWithTempConfig<WeatherActions>("../../src/actions/weather.ts", tmpDir);
  citiesStorage = await importWithTempConfig<CitiesStorage>("../../src/storage/cities.ts", tmpDir);
  globalThis.fetch = mock(() =>
    new Response(
      JSON.stringify({
        current: { time: "2026-09-21T15:00", temperature_2m: 11.3 },
        current_units: { temperature_2m: "°C" },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    ),
  ) as unknown as typeof fetch;
});

afterAll(() => {
  cleanupTempDir(tmpDir);
  globalThis.fetch = originalFetch;
});

function fetchUrl(): string {
  const fetchMock = globalThis.fetch as unknown as { mock: { calls: unknown[][] } };
  return String((fetchMock.mock.calls[0] ?? [])[0] ?? "");
}

describe("actions/weather", () => {
  test("getDefaultCityWeather devuelve null sin default configurado", async () => {
    resetConfigFiles(tmpDir);
    await expect(weatherActions.getDefaultCityWeather()).resolves.toBeNull();
  });

  test("getDefaultCityWeather consulta el clima de la ciudad default", async () => {
    resetConfigFiles(tmpDir);
    citiesStorage.saveCities({ defaultCityId: 1, cities: [ottawa] });

    const result = await weatherActions.getDefaultCityWeather();
    expect(result).not.toBeNull();
    expect(result?.city.name).toBe("Ottawa");
    expect(result?.temperature).toBe(11.3);
    expect(result?.unitSymbol).toBe("°C");
    expect(result?.time).toBe("2026-09-21T15:00");

    const url = fetchUrl();
    expect(url).toContain("latitude=45.41117");
    expect(url).toContain("longitude=-75.69812");
  });

  test("getDefaultCityWeather devuelve null si el default apunta a una ciudad inexistente", async () => {
    resetConfigFiles(tmpDir);
    citiesStorage.saveCities({ defaultCityId: 999, cities: [ottawa] });
    await expect(weatherActions.getDefaultCityWeather()).resolves.toBeNull();
  });

  test("getAllCitiesWeather devuelve el clima de todas las ciudades", async () => {
    resetConfigFiles(tmpDir);
    citiesStorage.saveCities({ defaultCityId: null, cities: [ottawa, madrid] });

    const results = await weatherActions.getAllCitiesWeather();
    expect(results).toHaveLength(2);
    expect(results[0]?.city.name).toBe("Ottawa");
    expect(results[1]?.city.name).toBe("Madrid");
  });

  test("getAllCitiesWeather devuelve lista vacía sin ciudades", async () => {
    resetConfigFiles(tmpDir);
    citiesStorage.saveCities({ defaultCityId: null, cities: [] });
    await expect(weatherActions.getAllCitiesWeather()).resolves.toEqual([]);
  });
});