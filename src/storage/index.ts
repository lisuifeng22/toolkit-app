import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  NOTES: '@toolkit_notes',
  TODOS: '@toolkit_todos',
  PASSWORDS: '@toolkit_passwords',
  COUNTDOWNS: '@toolkit_countdowns',
  BIRTHDAYS: '@toolkit_birthdays',
  ANNIVERSARIES: '@toolkit_anniversaries',
  PIN_HASH: '@toolkit_pin_hash',
} as const;

export { KEYS };

export async function loadData<T>(key: string): Promise<T[]> {
  try {
    const json = await AsyncStorage.getItem(key);
    return json ? JSON.parse(json) : [];
  } catch {
    return [];
  }
}

export async function saveData<T>(key: string, data: T[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save data:', e);
  }
}
