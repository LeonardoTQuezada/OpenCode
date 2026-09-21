import { mock } from "bun:test";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const REGISTERED = new Set<string>();

/** Crea un directorio temporal para aislar la configuración. */
export function createTempConfigDir(): string {
  return mkdtempSync(join(tmpdir(), "weather-cli-test-"));
}

/** Elimina el directorio temporal. */
export function cleanupTempDir(dir: string): void {
  rmSync(dir, { recursive: true, force: true });
}

/** Borra los archivos de configuración dentro del directorio temporal. */
export function resetConfigFiles(dir: string): void {
  for (const name of ["cities.json", "settings.json", "data.json"]) {
    rmSync(join(dir, name), { force: true });
  }
}

/**
 * Registra un mock de `src/constants.ts` apuntando a un temp dir y
 * devuelve el módulo pedido importado de forma dinámica.
 *
 * Es importante que el import sea dinámico: ESM "hoistea" los imports
 * estáticos antes de ejecutar `mock.module`, así que hay que registrar
 * el mock primero y hacer `await import()` después.
 */
export async function importWithTempConfig<T>(modulePath: string, tmpDir: string): Promise<T> {
  if (!REGISTERED.has(tmpDir)) {
    mock.module("../../src/constants.ts", () => ({
      CONFIG_DIR: tmpDir,
      CONFIG_DIR_NAME: "weather-cli",
      CITIES_FILE: join(tmpDir, "cities.json"),
      SETTINGS_FILE: join(tmpDir, "settings.json"),
      LEGACY_FILE: join(tmpDir, "data.json"),
    }));
    REGISTERED.add(tmpDir);
  }
  return (await import(modulePath)) as T;
}

/** Acceso a los args del último fetch mockeado, con tipos simples. */
export function lastFetchUrl(): string {
  const fetchMock = globalThis.fetch as unknown as { mock: { calls: unknown[][] } };
  const first = fetchMock.mock.calls[0];
  return String((first ?? [])[0] ?? "");
}