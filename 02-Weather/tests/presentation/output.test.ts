import { describe, expect, test } from "bun:test";
import { formatForecast, formatWeather, renderSettingsScreen } from "../../src/presentation/output.ts";
import type { StoredCity } from "../../src/types/City.ts";
import type { ForecastResult, WeatherResult } from "../../src/types/Weather.ts";

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

const forecast: ForecastResult = {
  city: ottawa,
  unitSymbol: "°C",
  days: [
    { date: "2026-09-22", tempMin: 12, tempMax: 21, weatherCode: 2 },
    { date: "2026-09-23", tempMin: 13, tempMax: 22, weatherCode: 3 },
    { date: "2026-09-24", tempMin: 11, tempMax: 20, weatherCode: 61 },
    { date: "2026-09-25", tempMin: 10, tempMax: 19, weatherCode: 80 },
    { date: "2026-09-26", tempMin: 9, tempMax: 18, weatherCode: 0 },
    { date: "2026-09-27", tempMin: 12, tempMax: 21, weatherCode: 1 },
    { date: "2026-09-28", tempMin: 8, tempMax: 17, weatherCode: 95 },
  ],
};

describe("presentation/output", () => {
  test("formatWeather muestra la ciudad, temperatura y hora", () => {
    const out = formatWeather(result);
    expect(out).toContain("Clima de Ottawa, Ontario, Canadá");
    expect(out).toContain("11.3 °C");
    expect(out).toContain("2026-09-21T15:00");
  });

  test("formatForecast muestra el encabezado y las 7 filas con condición", () => {
    const out = formatForecast(forecast);
    expect(out).toContain("Pronóstico 7 días de Ottawa, Ontario, Canadá");
    expect(out).toContain("2026-09-22   Mín: 12 °C   Máx: 21 °C   Parcialmente nublado");
    expect(out).toContain("2026-09-28   Mín: 8 °C   Máx: 17 °C   Tormenta");
    expect(out).toContain("Lluvia ligera");
    expect(out.split("\n")).toHaveLength(10);
  });

  test("formatForecast respeta la unidad fahrenheit", () => {
    const fahrenheit: ForecastResult = {
      ...forecast,
      unitSymbol: "°F",
      days: [{ date: "2026-09-22", tempMin: 54, tempMax: 70, weatherCode: 0 }],
    };
    const out = formatForecast(fahrenheit);
    expect(out).toContain("Mín: 54 °F   Máx: 70 °F");
  });

  test("renderSettingsScreen muestra la unidad actual", () => {
    const out = renderSettingsScreen({ unit: "celsius" });
    expect(out).toContain("AJUSTES");
    expect(out).toContain("Unidad actual: °C");
    expect(out).toContain("Fahrenheit (°F)");
  });
});