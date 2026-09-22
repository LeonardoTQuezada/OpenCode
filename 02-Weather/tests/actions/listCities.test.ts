import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  cleanupTempDir,
  createTempConfigDir,
  importWithTempConfig,
  resetConfigFiles,
} from "../helpers/withTempConfig.ts";
import type { StoredCity } from "../../src/types/City.ts";

type ListCitiesActions = typeof import("../../src/actions/listCities.ts");
type CitiesStorage = typeof import("../../src/storage/citiesStorage.ts");

const tmpDir = createTempConfigDir();
let actions: ListCitiesActions;
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
  actions = await importWithTempConfig<ListCitiesActions>("../../src/actions/listCities.ts", tmpDir);
  storage = await importWithTempConfig<CitiesStorage>("../../src/storage/citiesStorage.ts", tmpDir);
});

afterAll(() => {
  cleanupTempDir(tmpDir);
});

describe("actions/listCities", () => {
  test("listSavedCities devuelve las ciudades guardadas", () => {
    resetConfigFiles(tmpDir);
    storage.saveCities({ defaultCityId: null, cities: [ottawa, madrid] });
    expect(actions.listSavedCities()).toHaveLength(2);
    expect(actions.listSavedCities()[0]?.name).toBe("Ottawa");
  });

  test("listSavedCities devuelve lista vacía sin ciudades", () => {
    resetConfigFiles(tmpDir);
    expect(actions.listSavedCities()).toEqual([]);
  });
});