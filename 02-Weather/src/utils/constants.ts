import { homedir } from "node:os";
import { join } from "node:path";

export const CONFIG_DIR_NAME = "weather-cli";
export const CONFIG_DIR = join(homedir(), ".config", CONFIG_DIR_NAME);
export const CITIES_FILE = join(CONFIG_DIR, "cities.json");
export const SETTINGS_FILE = join(CONFIG_DIR, "settings.json");
export const LEGACY_FILE = join(CONFIG_DIR, "data.json");