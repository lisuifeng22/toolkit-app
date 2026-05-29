import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@toolkit_weather_locations';

export async function loadLocations(): Promise<string[]> {
  try {
    const json = await AsyncStorage.getItem(KEY);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function saveLocation(city: string): Promise<string[]> {
  const list = await loadLocations();
  if (!list.includes(city)) {
    list.push(city);
    await AsyncStorage.setItem(KEY, JSON.stringify(list));
  }
  return list;
}

export async function removeLocation(city: string): Promise<string[]> {
  const list = await loadLocations();
  const filtered = list.filter(c => c !== city);
  await AsyncStorage.setItem(KEY, JSON.stringify(filtered));
  return filtered;
}
