import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  cleanupTempDir,
  createTempConfigDir,
  importWithTempConfig,
  resetConfigFiles,
} from "../helpers/withTempConfig.ts";

type MigrateModule = typeof import("../../src/storage/migrate.ts");
type ConstantsModule = typeof import("../../src/constants.ts");

const tmpDir = createTempConfigDir();
let migrate: MigrateModule;
let constants: ConstantsModule;

beforeAll(async () => {
  migrate = await importWithTempConfig<MigrateModule>("../../src/storage/migrate.ts", tmpDir);
  constants = await importWithTempConfig<ConstantsModule>("../../src/constants.ts", tmpDir);
});

afterAll(() => {
  cleanupTempDir(tmpDir);
});

describe("storage/migrate", () => {
  test("migra data.json a cities.json + settings.json y elimina el legado", () => {
    resetConfigFiles(tmpDir);
    writeFileSync(
      constants.LEGACY_FILE,
      JSON.stringify({
        cities: [{ id: 1, name: "Ottawa", latitude: 45.41, longitude: -75.7, country: "Canadá" }],
        defaultCityId: 1,
        unit: "celsius",
      }),
      "utf-8",
    );

    expect(migrate.migrateLegacyData()).toBe("migrated");

    expect(JSON.parse(readFileSync(constants.CITIES_FILE, "utf-8"))).toEqual({
      defaultCityId: 1,
      cities: [{ id: 1, name: "Ottawa", latitude: 45.41, longitude: -75.7, country: "Canadá" }],
    });
    expect(JSON.parse(readFileSync(constants.SETTINGS_FILE, "utf-8"))).toEqual({ unit: "celsius" });
    expect(existsSync(constants.LEGACY_FILE)).toBe(false);
  });

  test("migra defaultCity anidado y unidad fahrenheit", () => {
    resetConfigFiles(tmpDir);
    writeFileSync(
      constants.LEGACY_FILE,
      JSON.stringify({
        cities: [{ id: 7, name: "Lima", latitude: -12.05, longitude: -77.04 }],
        defaultCity: { id: 7 },
        unit: "fahrenheit",
      }),
      "utf-8",
    );

    expect(migrate.migrateLegacyData()).toBe("migrated");
    expect(JSON.parse(readFileSync(constants.CITIES_FILE, "utf-8")).defaultCityId).toBe(7);
    expect(JSON.parse(readFileSync(constants.SETTINGS_FILE, "utf-8")).unit).toBe("fahrenheit");
  });

  test("no migra si no hay data.json", () => {
    resetConfigFiles(tmpDir);
    expect(migrate.migrateLegacyData()).toBe("none");
  });

  test("no migra si ya existe cities.json", () => {
    resetConfigFiles(tmpDir);
    writeFileSync(constants.CITIES_FILE, JSON.stringify({ defaultCityId: null, cities: [] }), "utf-8");
    writeFileSync(
      constants.LEGACY_FILE,
      JSON.stringify({ cities: [], unit: "celsius" }),
      "utf-8",
    );
    expect(migrate.migrateLegacyData()).toBe("none");
    expect(existsSync(constants.LEGACY_FILE)).toBe(true);
  });

  test("no migra si data.json está corrupto", () => {
    resetConfigFiles(tmpDir);
    writeFileSync(constants.LEGACY_FILE, "no json", "utf-8");
    expect(migrate.migrateLegacyData()).toBe("none");
  });
});