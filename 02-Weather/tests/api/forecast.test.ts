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

describe("api/forecast", () => {
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
    const { getCurrentWeather } = await import("../../src/api/forecast.ts");
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
    const { getCurrentWeather } = await import("../../src/api/forecast.ts");
    const weather = await getCurrentWeather(45.41117, -75.69812, "fahrenheit");

    expect(weather.temperature).toBe(52.3);
    expect(weather.unitSymbol).toBe("°F");
    expect(fetchUrl()).toContain("temperature_unit=fahrenheit");
  });

  test("getCurrentWeather lanza error si no hay temperatura", async () => {
    globalThis.fetch = mock(() => jsonResponse({ current: {} })) as unknown as typeof fetch;
    const { getCurrentWeather } = await import("../../src/api/forecast.ts");
    await expect(getCurrentWeather(1, 2)).rejects.toThrow("temperatura");
  });

  test("getCurrentWeather lanza error si la API responde con error HTTP", async () => {
    globalThis.fetch = mock(() => jsonResponse({}, 503)) as unknown as typeof fetch;
    const { getCurrentWeather } = await import("../../src/api/forecast.ts");
    await expect(getCurrentWeather(1, 2)).rejects.toThrow("HTTP 503");
  });
});