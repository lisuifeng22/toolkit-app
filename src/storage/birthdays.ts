import { Birthday } from '../types';
import { loadData, saveData, KEYS } from './index';

export async function loadBirthdays(): Promise<Birthday[]> {
  return loadData<Birthday>(KEYS.BIRTHDAYS);
}

export async function saveBirthdays(items: Birthday[]): Promise<void> {
  return saveData(KEYS.BIRTHDAYS, items);
}

export async function addBirthday(item: Birthday): Promise<void> {
  const items = await loadBirthdays();
  items.push(item);
  await saveBirthdays(items);
}

export async function deleteBirthday(id: string): Promise<void> {
  const items = await loadBirthdays();
  await saveBirthdays(items.filter(b => b.id !== id));
}
