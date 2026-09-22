import { afterAll, beforeAll, describe, expect, mock, test } from "bun:test";
import {
  cleanupTempDir,
  createTempConfigDir,
  importWithTempConfig,
  resetConfigFiles,
} from "../helpers/withTempConfig.ts";
import type { StoredCity } from "../../src/types/City.ts";

type ForecastActions = typeof import("../../src/actions/getForecast.ts");
type CitiesStorage = typeof import("../../src/storage/citiesStorage.ts");

const tmpDir = createTempConfigDir();
const originalFetch = globalThis.fetch;
let forecastActions: ForecastActions;
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
  forecastActions = await importWithTempConfig<ForecastActions>("../../src/actions/getForecast.ts", tmpDir);
  citiesStorage = await importWithTempConfig<CitiesStorage>("../../src/storage/citiesStorage.ts", tmpDir);
  globalThis.fetch = mock(() =>
    new Response(
      JSON.stringify({
        daily: {
          time: ["2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27", "2026-09-28"],
          temperature_2m_max: [21, 22, 20, 19, 18, 21, 17],
          temperature_2m_min: [12, 13, 11, 10, 9, 12, 8],
          weather_code: [2, 3, 61, 80, 0, 1, 95],
        },
        daily_units: { temperature_2m_max: "°C" },
      }),
      { status: 200, headers: { "content-type": "application/json" } },
    ),
  ) as unknown as typeof fetch;
});

afterAll(() => {
  cleanupTempDir(tmpDir);
  globalThis.fetch = originalFetch;
});

describe("actions/getForecast", () => {
  test("getAllCitiesForecast devuelve el pronóstico de 7 días de todas las ciudades", async () => {
    resetConfigFiles(tmpDir);
    citiesStorage.saveCities({ defaultCityId: null, cities: [ottawa, madrid] });

    const results = await forecastActions.getAllCitiesForecast();
    expect(results).toHaveLength(2);
    expect(results[0]?.city.name).toBe("Ottawa");
    expect(results[0]?.unitSymbol).toBe("°C");
    expect(results[0]?.days).toHaveLength(7);
    expect(results[0]?.days[0]).toEqual({ date: "2026-09-22", tempMin: 12, tempMax: 21, weatherCode: 2 });
    expect(results[1]?.city.name).toBe("Madrid");
    expect(results[1]?.days).toHaveLength(7);
  });

  test("getAllCitiesForecast devuelve lista vacía sin ciudades", async () => {
    resetConfigFiles(tmpDir);
    citiesStorage.saveCities({ defaultCityId: null, cities: [] });
    await expect(forecastActions.getAllCitiesForecast()).resolves.toEqual([]);
  });
});