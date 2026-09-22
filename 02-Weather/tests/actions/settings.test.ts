import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import {
  cleanupTempDir,
  createTempConfigDir,
  importWithTempConfig,
  resetConfigFiles,
} from "../helpers/withTempConfig.ts";

type SettingsActions = typeof import("../../src/actions/settings.ts");
type SettingsStorage = typeof import("../../src/storage/settingsStorage.ts");

const tmpDir = createTempConfigDir();
let actions: SettingsActions;
let storage: SettingsStorage;

beforeAll(async () => {
  actions = await importWithTempConfig<SettingsActions>("../../src/actions/settings.ts", tmpDir);
  storage = await importWithTempConfig<SettingsStorage>("../../src/storage/settingsStorage.ts", tmpDir);
});

afterAll(() => {
  cleanupTempDir(tmpDir);
});

describe("actions/settings", () => {
  test("getUnit devuelve celsius por defecto", () => {
    resetConfigFiles(tmpDir);
    expect(actions.getUnit()).toBe("celsius");
  });

  test("setUnit persiste la unidad elegida", () => {
    resetConfigFiles(tmpDir);
    expect(actions.setUnit("fahrenheit")).toBe("fahrenheit");
    expect(actions.getUnit()).toBe("fahrenheit");
    expect(storage.loadSettings().unit).toBe("fahrenheit");
  });

  test("toggleUnit alterna entre celsius y fahrenheit", () => {
    resetConfigFiles(tmpDir);
    expect(actions.toggleUnit()).toBe("fahrenheit");
    expect(actions.toggleUnit()).toBe("celsius");
    expect(storage.loadSettings().unit).toBe("celsius");
  });
});