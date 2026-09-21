import { afterAll, describe, expect, mock, test } from "bun:test";

const originalFetch = globalThis.fetch;

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

describe("api/geocoding", () => {
  afterAll(() => {
    globalThis.fetch = originalFetch;
  });

  test("searchCities devuelve los resultados de la API", async () => {
    globalThis.fetch = mock(() =>
      jsonResponse({
        results: [
          {
            id: 6094817,
            name: "Ottawa",
            latitude: 45.41117,
            longitude: -75.69812,
            country: "Canadá",
            admin1: "Ontario",
          },
        ],
      }),
    ) as unknown as typeof fetch;
    const { searchCities } = await import("../../src/api/geocoding.ts");
    const cities = await searchCities("Ottawa");

    expect(cities).toHaveLength(1);
    expect(cities[0]?.name).toBe("Ottawa");
    expect(cities[0]?.latitude).toBe(45.41117);

    const fetchMock = globalThis.fetch as unknown as { mock: { calls: unknown[][] } };
    const url = String((fetchMock.mock.calls[0] ?? [])[0] ?? "");
    expect(url).toContain("geocoding-api.open-meteo.com");
    expect(url).toContain("name=Ottawa");
    expect(url).toContain("language=es");
    expect(url).toContain("format=json");
  });

  test("searchCities devuelve [] cuando no hay resultados", async () => {
    globalThis.fetch = mock(() => jsonResponse({ results: [] })) as unknown as typeof fetch;
    const { searchCities } = await import("../../src/api/geocoding.ts");
    await expect(searchCities("zzzz")).resolves.toEqual([]);
  });

  test("searchCities lanza error si la API responde con error HTTP", async () => {
    globalThis.fetch = mock(() => jsonResponse({}, 500)) as unknown as typeof fetch;
    const { searchCities } = await import("../../src/api/geocoding.ts");
    await expect(searchCities("Ottawa")).rejects.toThrow("HTTP 500");
  });
});