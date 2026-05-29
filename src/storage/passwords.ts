import { Password } from '../types';
import { loadData, saveData, KEYS } from './index';

export async function loadPasswords(): Promise<Password[]> {
  return loadData<Password>(KEYS.PASSWORDS);
}

export async function savePasswords(items: Password[]): Promise<void> {
  return saveData(KEYS.PASSWORDS, items);
}

export async function addPassword(item: Password): Promise<void> {
  const items = await loadPasswords();
  items.unshift(item);
  await savePasswords(items);
}

export async function updatePassword(id: string, updates: Partial<Password>): Promise<void> {
  const items = await loadPasswords();
  const idx = items.findIndex(p => p.id === id);
  if (idx !== -1) {
    items[idx] = { ...items[idx], ...updates };
    await savePasswords(items);
  }
}

export async function deletePassword(id: string): Promise<void> {
  const items = await loadPasswords();
  await savePasswords(items.filter(p => p.id !== id));
}

// PIN code storage (plain hash for simplicity)
export async function savePinHash(hash: string): Promise<void> {
  await saveData(KEYS.PIN_HASH, [hash]);
}

export async function getPinHash(): Promise<string | null> {
  const data = await loadData<string>(KEYS.PIN_HASH);
  return data.length > 0 ? data[0] : null;
}

export async function clearPinHash(): Promise<void> {
  await saveData(KEYS.PIN_HASH, []);
}
