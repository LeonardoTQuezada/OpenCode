import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  cleanupTempDir,
  createTempConfigDir,
  importWithTempConfig,
  resetConfigFiles,
} from "../helpers/withTempConfig.ts";
import type { StoredCity } from "../../src/types/City.ts";

type SetDefaultCityActions = typeof import("../../src/actions/setDefaultCity.ts");
type CitiesStorage = typeof import("../../src/storage/citiesStorage.ts");

const tmpDir = createTempConfigDir();
let actions: SetDefaultCityActions;
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
  actions = await importWithTempConfig<SetDefaultCityActions>("../../src/actions/setDefaultCity.ts", tmpDir);
  storage = await importWithTempConfig<CitiesStorage>("../../src/storage/citiesStorage.ts", tmpDir);
});

afterAll(() => {
  cleanupTempDir(tmpDir);
});

describe("actions/setDefaultCity", () => {
  test("persistSetDefaultCity fija el default solo si la ciudad existe", () => {
    resetConfigFiles(tmpDir);
    storage.saveCities({ defaultCityId: null, cities: [ottawa, madrid] });

    expect(actions.persistSetDefaultCity(2)).toBe(true);
    expect(storage.loadCities().defaultCityId).toBe(2);
    expect(actions.persistSetDefaultCity(999)).toBe(false);
    expect(storage.loadCities().defaultCityId).toBe(2);
  });
});