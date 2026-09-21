import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { CITIES_FILE, CONFIG_DIR, LEGACY_FILE, SETTINGS_FILE } from "../constants.ts";
import type { Unit } from "../types/index.ts";

/** Formato tolerante del data.json legado (pre-refactor). */
interface LegacyData {
  cities?: unknown[];
  defaultCityId?: number | null;
  defaultCity?: { id?: number } | null;
  unit?: string;
}

/**
 * Migra en una sola ejecución el antiguo data.json único
 * hacia cities.json + settings.json. No hace nada si no hay data.json
 * o si ya existe cities.json.
 */
export function migrateLegacyData(): "migrated" | "none" {
  if (!existsSync(LEGACY_FILE) || existsSync(CITIES_FILE)) {
    return "none";
  }
  try {
    const parsed = JSON.parse(readFileSync(LEGACY_FILE, "utf-8")) as LegacyData;
    const cities = Array.isArray(parsed.cities) ? parsed.cities : [];
    let defaultCityId: number | null = typeof parsed.defaultCityId === "number" ? parsed.defaultCityId : null;
    if (defaultCityId === null && parsed.defaultCity && typeof parsed.defaultCity.id === "number") {
      defaultCityId = parsed.defaultCity.id;
    }
    const unit: Unit = parsed.unit === "fahrenheit" ? "fahrenheit" : "celsius";

    mkdirSync(CONFIG_DIR, { recursive: true });
    writeFileSync(CITIES_FILE, JSON.stringify({ defaultCityId, cities }, null, 2), "utf-8");
    writeFileSync(SETTINGS_FILE, JSON.stringify({ unit }, null, 2), "utf-8");
    unlinkSync(LEGACY_FILE);
    return "migrated";
  } catch {
    return "none";
  }
}