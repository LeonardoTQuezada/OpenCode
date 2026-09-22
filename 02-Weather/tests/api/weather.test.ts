import { afterAll, describe, expect, mock, test } from "bun:test";

const originalFetch = globalThis.fetch;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function fetchUrl(): string {
  const fetchMock = globalThis.fetch as unknown as { mock: { calls: unknown[][] } };
  return String((fetchMock.mock.calls[0] ?? [])[0] ?? "");
}

describe("api/weather", () => {
  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  test("getCurrentWeather devuelve temperatura y °C por defecto", async () => {
    globalThis.fetch = mock(() =>
      jsonResponse({
        current: { time: "2026-09-21T15:00", temperature_2m: 11.3 },
        current_units: { temperature_2m: "°C" },
      }),
    ) as unknown as typeof fetch;
    const { getCurrentWeather } = await import("../../src/api/weather.ts");
    const weather = await getCurrentWeather(45.41117, -75.69812);

    expect(weather.temperature).toBe(11.3);
    expect(weather.unitSymbol).toBe("°C");
    expect(weather.time).toBe("2026-09-21T15:00");

    const url = fetchUrl();
    expect(url).toContain("latitude=45.41117");
    expect(url).toContain("longitude=-75.69812");
    expect(url).toContain("current=temperature_2m");
    expect(url).not.toContain("temperature_unit");
  });

  test("getCurrentWeather envía temperature_unit=fahrenheit cuando se pide", async () => {
    globalThis.fetch = mock(() =>
      jsonResponse({
        current: { time: "2026-09-21T15:00", temperature_2m: 52.3 },
        current_units: { temperature_2m: "°F" },
      }),
    ) as unknown as typeof fetch;
    const { getCurrentWeather } = await import("../../src/api/weather.ts");
    const weather = await getCurrentWeather(45.41117, -75.69812, "fahrenheit");

    expect(weather.temperature).toBe(52.3);
    expect(weather.unitSymbol).toBe("°F");
    expect(fetchUrl()).toContain("temperature_unit=fahrenheit");
  });

  test("getCurrentWeather lanza error si no hay temperatura", async () => {
    globalThis.fetch = mock(() => jsonResponse({ current: {} })) as unknown as typeof fetch;
    const { getCurrentWeather } = await import("../../src/api/weather.ts");
    await expect(getCurrentWeather(1, 2)).rejects.toThrow("temperatura");
  });

  test("getCurrentWeather lanza error si la API responde con error HTTP", async () => {
    globalThis.fetch = mock(() => jsonResponse({}, 503)) as unknown as typeof fetch;
    const { getCurrentWeather } = await import("../../src/api/weather.ts");
    await expect(getCurrentWeather(1, 2)).rejects.toThrow("HTTP 503");
  });

  test("getDailyForecast devuelve 7 días con mín, máx y código WMO", async () => {
    globalThis.fetch = mock(() =>
      jsonResponse({
        daily: {
          time: ["2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27", "2026-09-28"],
          temperature_2m_max: [21, 22, 20, 19, 18, 21, 17],
          temperature_2m_min: [12, 13, 11, 10, 9, 12, 8],
          weather_code: [2, 3, 61, 80, 0, 1, 95],
        },
        daily_units: { temperature_2m_max: "°C" },
      }),
    ) as unknown as typeof fetch;
    const { getDailyForecast } = await import("../../src/api/weather.ts");
    const result = await getDailyForecast(45.41117, -75.69812);

    expect(result.days).toHaveLength(7);
    expect(result.days[0]).toEqual({ date: "2026-09-22", tempMin: 12, tempMax: 21, weatherCode: 2 });
    expect(result.days[6]).toEqual({ date: "2026-09-28", tempMin: 8, tempMax: 17, weatherCode: 95 });
    expect(result.unitSymbol).toBe("°C");

    const url = fetchUrl();
    expect(url).toContain("daily=temperature_2m_max%2Ctemperature_2m_min%2Cweather_code");
    expect(url).toContain("forecast_days=7");
    expect(url).toContain("latitude=45.41117");
    expect(url).not.toContain("temperature_unit");
  });

  test("getDailyForecast envía temperature_unit=fahrenheit cuando se pide", async () => {
    globalThis.fetch = mock(() =>
      jsonResponse({
        daily: {
          time: ["2026-09-22", "2026-09-23", "2026-09-24", "2026-09-25", "2026-09-26", "2026-09-27", "2026-09-28"],
          temperature_2m_max: [70, 72, 68, 66, 64, 70, 63],
          temperature_2m_min: [54, 55, 52, 50, 48, 54, 46],
          weather_code: [2, 3, 61, 80, 0, 1, 95],
        },
        daily_units: { temperature_2m_max: "°F" },
      }),
    ) as unknown as typeof fetch;
    const { getDailyForecast } = await import("../../src/api/weather.ts");
    const result = await getDailyForecast(45.41117, -75.69812, "fahrenheit");

    expect(result.unitSymbol).toBe("°F");
    expect(result.days[0]?.tempMax).toBe(70);
    expect(fetchUrl()).toContain("temperature_unit=fahrenheit");
  });

  test("getDailyForecast lanza error si no hay datos diarios", async () => {
    globalThis.fetch = mock(() => jsonResponse({})) as unknown as typeof fetch;
    const { getDailyForecast } = await import("../../src/api/weather.ts");
    await expect(getDailyForecast(1, 2)).rejects.toThrow("pronóstico diario");
  });

  test("getDailyForecast lanza error si faltan temperaturas en algún día", async () => {
    globalThis.fetch = mock(() =>
      jsonResponse({
        daily: {
          time: ["2026-09-22"],
          temperature_2m_max: [null],
          temperature_2m_min: [10],
          weather_code: [2],
        },
      }),
    ) as unknown as typeof fetch;
    const { getDailyForecast } = await import("../../src/api/weather.ts");
    await expect(getDailyForecast(1, 2)).rejects.toThrow("temperaturas diarias");
  });
});