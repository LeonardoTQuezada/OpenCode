import { describe, expect, test } from "bun:test";
import { OPTIONS, SEPARATOR, VALID_OPTIONS, renderMenu } from "../../src/presentation/menu.ts";

describe("presentation/menu", () => {
  test("renderMenu incluye todas las opciones del README", () => {
    const menu = renderMenu(0);
    expect(menu).toContain("WEATHER CLI");
    expect(menu).toContain("1. Clima de ciudad default");
    expect(menu).toContain("2. Clima de todas las ciudades (0)");
    expect(menu).toContain("3. Buscar y agregar ciudad");
    expect(menu).toContain("4. Eliminar ciudad");
    expect(menu).toContain("5. Establecer ciudad default");
    expect(menu).toContain("6. Pronóstico 7 días");
    expect(menu).toContain("8. Ajustes (°C)");
    expect(menu).toContain("9. Salir");
    expect(menu).toContain("Selecciona una opción:");
  });

  test("renderMenu muestra el número de ciudades guardadas", () => {
    expect(renderMenu(3)).toContain("2. Clima de todas las ciudades (3)");
    expect(renderMenu(7)).toContain("2. Clima de todas las ciudades (7)");
  });

  test("el separador tiene la misma longitud que en el README", () => {
    expect(SEPARATOR).toMatch(/^═+$/);
    expect(SEPARATOR.length).toBe(40);
  });

  test("las opciones válidas son 1-6, 8 y 9", () => {
    expect(VALID_OPTIONS.has("6")).toBe(true);
    expect(VALID_OPTIONS.has("7")).toBe(false);
    expect(VALID_OPTIONS.has("0")).toBe(false);
  });
});