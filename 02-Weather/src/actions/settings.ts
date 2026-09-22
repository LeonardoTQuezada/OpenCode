import { loadSettings, saveSettings } from "../storage/settingsStorage.ts";
import type { Unit } from "../types/Settings.ts";

/** Unidad de temperatura actualmente configurada. */
export function getUnit(): Unit {
  return loadSettings().unit;
}

/** Cambia la unidad de temperatura y la persiste. */
export function setUnit(unit: Unit): Unit {
  saveSettings({ unit });
  return unit;
}

/** Alterna entre celsius y fahrenheit. */
export function toggleUnit(): Unit {
  const next: Unit = getUnit() === "celsius" ? "fahrenheit" : "celsius";
  saveSettings({ unit: next });
  return next;
}