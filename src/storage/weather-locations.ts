import { loadData, saveData, KEYS } from './index';

export async function loadLocations(): Promise<string[]> {
  return loadData<string>(KEYS.WEATHER_LOCATIONS);
}

export async function saveLocation(city: string): Promise<string[]> {
  const list = await loadLocations();
  if (!list.includes(city)) {
    list.push(city);
    await saveData(KEYS.WEATHER_LOCATIONS, list);
  }
  return list;
}

export async function removeLocation(city: string): Promise<string[]> {
  const list = await loadLocations();
  const filtered = list.filter((c) => c !== city);
  await saveData(KEYS.WEATHER_LOCATIONS, filtered);
  return filtered;
}
