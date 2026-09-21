import { describe, expect, test } from "bun:test";
import { formatWeather, renderSettingsScreen } from "../../src/presentation/display.ts";
import type { StoredCity, WeatherResult } from "../../src/types/index.ts";

const ottawa: StoredCity = {
  id: 1,
  name: "Ottawa",
  latitude: 45.41117,
  longitude: -75.69812,
  country: "Canadá",
  admin1: "Ontario",
};

const result: WeatherResult = {
  city: ottawa,
  temperature: 11.3,
  unitSymbol: "°C",
  time: "2026-09-21T15:00",
};

describe("presentation/display", () => {
  test("formatWeather muestra la ciudad, temperatura y hora", () => {
    const out = formatWeather(result);
    expect(out).toContain("Clima de Ottawa, Ontario, Canadá");
    expect(out).toContain("11.3 °C");
    expect(out).toContain("2026-09-21T15:00");
  });

  test("renderSettingsScreen muestra la unidad actual", () => {
    const out = renderSettingsScreen({ unit: "celsius" });
    expect(out).toContain("AJUSTES");
    expect(out).toContain("Unidad actual: °C");
    expect(out).toContain("Fahrenheit (°F)");
  });
});