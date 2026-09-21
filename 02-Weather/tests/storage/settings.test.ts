import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  cleanupTempDir,
  createTempConfigDir,
  importWithTempConfig,
  resetConfigFiles,
} from "../helpers/withTempConfig.ts";

type SettingsModule = typeof import("../../src/storage/settings.ts");

const tmpDir = createTempConfigDir();
let settings: SettingsModule;

beforeAll(async () => {
  settings = await importWithTempConfig<SettingsModule>("../../src/storage/settings.ts", tmpDir);
});

afterAll(() => {
  cleanupTempDir(tmpDir);
});

describe("storage/settings", () => {
  test("loadSettings devuelve celsius por defecto sin archivo", () => {
    resetConfigFiles(tmpDir);
    expect(settings.loadSettings()).toEqual({ unit: "celsius" });
  });

  test("saveSettings y loadSettings hacen round-trip", () => {
    resetConfigFiles(tmpDir);
    settings.saveSettings({ unit: "fahrenheit" });
    expect(settings.loadSettings()).toEqual({ unit: "fahrenheit" });
    expect(existsSync(join(tmpDir, "settings.json"))).toBe(true);
  });

  test("loadSettings tolera un archivo corrupto", () => {
    resetConfigFiles(tmpDir);
    writeFileSync(join(tmpDir, "settings.json"), "no json", "utf-8");
    expect(settings.loadSettings()).toEqual({ unit: "celsius" });
  });

  test("loadSettings ignora unidades desconocidas", () => {
    resetConfigFiles(tmpDir);
    writeFileSync(join(tmpDir, "settings.json"), JSON.stringify({ unit: "kelvin" }), "utf-8");
    expect(settings.loadSettings().unit).toBe("celsius");
  });

  test("isUnit valida solo celsius y fahrenheit", () => {
    expect(settings.isUnit("celsius")).toBe(true);
    expect(settings.isUnit("fahrenheit")).toBe(true);
    expect(settings.isUnit("kelvin")).toBe(false);
    expect(settings.isUnit(undefined)).toBe(false);
  });

  test("el archivo settings.json queda con formato pretty", () => {
    resetConfigFiles(tmpDir);
    settings.saveSettings({ unit: "fahrenheit" });
    const raw = readFileSync(join(tmpDir, "settings.json"), "utf-8");
    expect(JSON.parse(raw)).toEqual({ unit: "fahrenheit" });
    expect(raw).toContain("\n");
  });
});