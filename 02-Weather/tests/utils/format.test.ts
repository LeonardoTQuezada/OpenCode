import { describe, expect, test } from "bun:test";
import {
  cityLabel,
  formatNumberedList,
  formatTemperature,
  unitSymbol,
  weatherCodeLabel,
} from "../../src/utils/format.ts";

describe("utils/format", () => {
  test("unitSymbol devuelve el símbolo correcto", () => {
    expect(unitSymbol("celsius")).toBe("°C");
    expect(unitSymbol("fahrenheit")).toBe("°F");
  });

  test("formatTemperature redondea a 1 decimal", () => {
    expect(formatTemperature(11.34, "celsius")).toBe("11.3 °C");
    expect(formatTemperature(52, "fahrenheit")).toBe("52 °F");
    expect(formatTemperature(11.345, "celsius")).toBe("11.3 °C");
  });

  test("cityLabel combina nombre, admin1 y país", () => {
    expect(
      cityLabel({ id: 1, name: "Madrid", latitude: 0, longitude: 0, admin1: "Comunidad de Madrid", country: "España" }),
    ).toBe("Madrid, Comunidad de Madrid, España");
  });

  test("cityLabel omite campos ausentes", () => {
    expect(cityLabel({ id: 1, name: "Ottawa", latitude: 0, longitude: 0 })).toBe("Ottawa");
    expect(
      cityLabel({ id: 1, name: "Ottawa", latitude: 0, longitude: 0, country: "Canadá" }),
    ).toBe("Ottawa, Canadá");
  });

  test("formatNumberedList enumera desde 1", () => {
    expect(formatNumberedList(["a", "b", "c"])).toBe("  1. a\n  2. b\n  3. c");
  });

  test("weatherCodeLabel traduce códigos WMO conocidos", () => {
    expect(weatherCodeLabel(0)).toBe("Despejado");
    expect(weatherCodeLabel(2)).toBe("Parcialmente nublado");
    expect(weatherCodeLabel(3)).toBe("Nublado");
    expect(weatherCodeLabel(61)).toBe("Lluvia ligera");
    expect(weatherCodeLabel(95)).toBe("Tormenta");
    expect(weatherCodeLabel(99)).toBe("Tormenta con granizo intenso");
  });

  test("weatherCodeLabel devuelve un fallback para códigos desconocidos", () => {
    expect(weatherCodeLabel(999)).toBe("Código 999");
  });
});