import { getAllCitiesForecast, getAllCitiesWeather, getDefaultCityWeather } from "./actions/weather.ts";
import {
  listSavedCities,
  persistSetDefaultCity,
  removeSavedCity,
  saveCity,
  searchAndListCities,
} from "./actions/cities.ts";
import { getUnit, setUnit } from "./actions/settings.ts";
import { SEPARATOR, OPTIONS, renderMenu } from "./presentation/menu.ts";
import { formatForecast, formatWeather, renderSettingsScreen } from "./presentation/display.ts";
import { cityLabel, formatNumberedList } from "./utils/format.ts";
import { closePrompt, isPromptClosed, prompt } from "./utils/prompt.ts";
import { migrateLegacyData } from "./storage/migrate.ts";
import { loadCities } from "./storage/cities.ts";
import { loadSettings } from "./storage/settings.ts";

function clearScreen(): void {
  if (process.stdout.isTTY) {
    process.stdout.write("\x1b[2J\x1b[H");
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Ocurrió un error inesperado";
}

async function pause(): Promise<void> {
  await prompt("  Presiona Enter para continuar...");
}

async function showDefaultWeather(): Promise<void> {
  try {
    const result = await getDefaultCityWeather();
    if (!result) {
      console.log("  No hay ciudad default configurada. Usa la opción 5.");
    } else {
      console.log(formatWeather(result));
    }
  } catch (err) {
    console.log(`  ${errorMessage(err)}`);
  }
  await pause();
}

async function showAllWeather(): Promise<void> {
  try {
    const results = await getAllCitiesWeather();
    if (results.length === 0) {
      console.log("  No hay ciudades guardadas. Usa la opción 3.");
    } else {
      for (const result of results) {
        console.log(formatWeather(result));
        console.log("");
      }
    }
  } catch (err) {
    console.log(`  ${errorMessage(err)}`);
  }
  await pause();
}

async function showAllForecast(): Promise<void> {
  try {
    const results = await getAllCitiesForecast();
    if (results.length === 0) {
      console.log("  No hay ciudades guardadas. Usa la opción 3.");
    } else {
      for (const result of results) {
        console.log(formatForecast(result));
        console.log("");
      }
    }
  } catch (err) {
    console.log(`  ${errorMessage(err)}`);
  }
  await pause();
}

async function searchAndAddCityFlow(): Promise<void> {
  const name = await prompt("  Nombre de la ciudad: ");
  if (name === "") {
    return;
  }
  try {
    const results = await searchAndListCities(name);
    if (results.length === 0) {
      console.log(`  No se encontraron resultados para "${name}".`);
    } else {
      console.log(`${SEPARATOR}\n  Resultados para "${name}"\n${SEPARATOR}`);
      console.log(formatNumberedList(results.map(cityLabel)));
      const pick = await prompt("  Selecciona un número (0 para cancelar): ");
      const chosen = results[Number(pick) - 1];
      if (!chosen) {
        console.log("  Selección inválida.");
      } else if (saveCity(chosen)) {
        console.log(`  "${cityLabel(chosen)}" guardada.`);
      } else {
        console.log(`  "${cityLabel(chosen)}" ya estaba guardada.`);
      }
    }
  } catch (err) {
    console.log(`  ${errorMessage(err)}`);
  }
  await pause();
}

async function removeCityFlow(): Promise<void> {
  const cities = listSavedCities();
  if (cities.length === 0) {
    console.log("  No hay ciudades guardadas.");
    await pause();
    return;
  }
  console.log(`${SEPARATOR}\n  Ciudades guardadas\n${SEPARATOR}`);
  console.log(formatNumberedList(cities.map(cityLabel)));
  const pick = await prompt("  Selecciona un número (0 para cancelar): ");
  const chosen = cities[Number(pick) - 1];
  if (!chosen) {
    console.log("  Selección inválida.");
  } else if (removeSavedCity(chosen.id)) {
    console.log(`  "${cityLabel(chosen)}" eliminada.`);
  }
  await pause();
}

async function setDefaultCityFlow(): Promise<void> {
  const cities = listSavedCities();
  if (cities.length === 0) {
    console.log("  No hay ciudades guardadas.");
    await pause();
    return;
  }
  console.log(`${SEPARATOR}\n  Ciudades guardadas\n${SEPARATOR}`);
  console.log(formatNumberedList(cities.map(cityLabel)));
  const pick = await prompt("  Selecciona un número (0 para cancelar): ");
  const chosen = cities[Number(pick) - 1];
  if (!chosen) {
    console.log("  Selección inválida.");
  } else if (persistSetDefaultCity(chosen.id)) {
    console.log(`  Ciudad default: "${cityLabel(chosen)}".`);
  }
  await pause();
}

async function settingsFlow(): Promise<void> {
  console.log(renderSettingsScreen(loadSettings()));
  const pick = await prompt("  Opción: ");
  if (pick === "1") {
    setUnit("celsius");
    console.log("  Unidad configurada: °C");
  } else if (pick === "2") {
    setUnit("fahrenheit");
    console.log("  Unidad configurada: °F");
  }
  await pause();
}

async function main(): Promise<void> {
  migrateLegacyData();
  let running = true;
  while (running) {
    clearScreen();
    const menu = renderMenu(loadCities().cities.length);
    const raw = await prompt(menu);
    if (raw === "" && isPromptClosed()) {
      running = false;
      break;
    }
    switch (raw) {
      case OPTIONS.DEFAULT_WEATHER:
        await showDefaultWeather();
        break;
      case OPTIONS.ALL_WEATHER:
        await showAllWeather();
        break;
      case OPTIONS.FORECAST:
        await showAllForecast();
        break;
      case OPTIONS.SEARCH_ADD:
        await searchAndAddCityFlow();
        break;
      case OPTIONS.REMOVE:
        await removeCityFlow();
        break;
      case OPTIONS.SET_DEFAULT:
        await setDefaultCityFlow();
        break;
      case OPTIONS.SETTINGS:
        await settingsFlow();
        break;
      case OPTIONS.EXIT:
        running = false;
        break;
      default:
        console.log("  Opción inválida.");
        await pause();
    }
  }
  closePrompt();
  console.log(SEPARATOR);
  console.log("  ¡Hasta luego!");
  console.log(SEPARATOR);
}

main().catch((err) => {
  console.error("Error fatal:", err);
  process.exit(1);
});