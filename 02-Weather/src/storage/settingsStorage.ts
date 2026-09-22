import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { CONFIG_DIR, SETTINGS_FILE } from "../utils/constants.ts";
import type { Settings, Unit } from "../types/Settings.ts";

export const DEFAULT_SETTINGS: Settings = { unit: "celsius" };

/** Lee settings.json; devuelve los valores por defecto si falta o está corrupto. */
export function loadSettings(): Settings {
  if (!existsSync(SETTINGS_FILE)) {
    return { ...DEFAULT_SETTINGS };
  }
  try {
    const parsed = JSON.parse(readFileSync(SETTINGS_FILE, "utf-8")) as Partial<Settings>;
    return { unit: parsed.unit === "fahrenheit" ? "fahrenheit" : "celsius" };
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

/** Persiste la configuración en settings.json. */
export function saveSettings(settings: Settings): void {
  mkdirSync(CONFIG_DIR, { recursive: true });
  writeFileSync(SETTINGS_FILE, JSON.stringify(settings, null, 2), "utf-8");
}

/** Valida que un valor sea una unidad soportada. */
export function isUnit(value: string | undefined): value is Unit {
  return value === "celsius" || value === "fahrenheit";
}