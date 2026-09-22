import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  cleanupTempDir,
  createTempConfigDir,
  importWithTempConfig,
  resetConfigFiles,
} from "../helpers/withTempConfig.ts";
import type { StoredCity } from "../../src/types/City.ts";

type RemoveCityActions = typeof import("../../src/actions/removeCity.ts");
type CitiesStorage = typeof import("../../src/storage/citiesStorage.ts");

const tmpDir = createTempConfigDir();
let actions: RemoveCityActions;
let storage: CitiesStorage;

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
  actions = await importWithTempConfig<RemoveCityActions>("../../src/actions/removeCity.ts", tmpDir);
  storage = await importWithTempConfig<CitiesStorage>("../../src/storage/citiesStorage.ts", tmpDir);
});

afterAll(() => {
  cleanupTempDir(tmpDir);
});

describe("actions/removeCity", () => {
  test("removeSavedCity elimina y limpia el default si era esa", () => {
    resetConfigFiles(tmpDir);
    storage.saveCities({ defaultCityId: 2, cities: [ottawa, madrid] });

    expect(actions.removeSavedCity(2)).toBe(true);
    expect(storage.loadCities().cities).toHaveLength(1);
    expect(storage.loadCities().defaultCityId).toBeNull();
    expect(actions.removeSavedCity(999)).toBe(false);
  });

  test("removeSavedCity deja el default intacto si se elimina otra ciudad", () => {
    resetConfigFiles(tmpDir);
    storage.saveCities({ defaultCityId: 1, cities: [ottawa, madrid] });

    expect(actions.removeSavedCity(2)).toBe(true);
    expect(storage.loadCities().defaultCityId).toBe(1);
  });
});