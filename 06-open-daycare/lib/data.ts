// Acceso a los archivos de datos del proyecto. Solo servidor: leer y escribir
// con fs desde un componente cliente rompería el bundle. Se usa desde el
// layout de /kids y desde las Server Actions (SPEC 05).

import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import type { Kid } from "./kids";
import type { FamilyData } from "./family";

const DATA_DIR = path.join(process.cwd(), "data");

async function readJson<T>(file: string): Promise<T> {
  const raw = await readFile(path.join(DATA_DIR, file), "utf8");
  return JSON.parse(raw) as T;
}

async function writeJson(file: string, value: unknown): Promise<void> {
  const body = `${JSON.stringify(value, null, 2)}\n`;
  await writeFile(path.join(DATA_DIR, file), body, "utf8");
}

// data/kids.json — la lista completa de niños (SPEC 02 + SPEC 04).
export function readKids(): Promise<Kid[]> {
  return readJson<Kid[]>("kids.json");
}

export function writeKids(kids: Kid[]): Promise<void> {
  return writeJson("kids.json", kids);
}

// data/family.json — padres por Kid.slug.
export function readFamily(): Promise<FamilyData> {
  return readJson<FamilyData>("family.json");
}

export function writeFamily(family: FamilyData): Promise<void> {
  return writeJson("family.json", family);
}
