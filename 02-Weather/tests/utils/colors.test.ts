import { afterEach, describe, expect, test } from "bun:test";
import { cyan, green, paint, red, yellow } from "../../src/utils/colors.ts";

const originalEnv = { ...process.env };

afterEach(() => {
  process.env = { ...originalEnv };
});

describe("utils/colors", () => {
  test("sin TTY ni env, los helpers devuelven el texto tal cual", () => {
    process.stdout.isTTY = false;
    delete process.env.NO_COLOR;
    delete process.env.FORCE_COLOR;
    expect(cyan("Hola")).toBe("Hola");
    expect(yellow("11.3 °C")).toBe("11.3 °C");
    expect(green("ok")).toBe("ok");
    expect(red("error")).toBe("error");
  });

  test("con FORCE_COLOR, se usa el código ANSI correcto por color", () => {
    process.env.FORCE_COLOR = "1";
    expect(cyan("Hola")).toBe("\x1b[36mHola\x1b[0m");
    expect(yellow("11.3 °C")).toBe("\x1b[33m11.3 °C\x1b[0m");
    expect(green("ok")).toBe("\x1b[32mok\x1b[0m");
    expect(red("error")).toBe("\x1b[31merror\x1b[0m");
  });

  test("NO_COLOR desactiva los colores incluso con FORCE_COLOR", () => {
    process.env.FORCE_COLOR = "1";
    process.env.NO_COLOR = "1";
    expect(yellow("11.3 °C")).toBe("11.3 °C");
  });

  test("paint aplica el color sin comprobar soporte", () => {
    expect(paint("x", "cyan")).toBe("\x1b[36mx\x1b[0m");
    expect(paint("x", "yellow")).toBe("\x1b[33mx\x1b[0m");
    expect(paint("x", "green")).toBe("\x1b[32mx\x1b[0m");
    expect(paint("x", "red")).toBe("\x1b[31mx\x1b[0m");
  });
});