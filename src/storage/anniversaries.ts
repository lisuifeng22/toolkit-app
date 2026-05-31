import { Anniversary } from '../types';
import { loadData, saveData, KEYS } from './index';

export async function loadAnniversaries(): Promise<Anniversary[]> {
  return loadData<Anniversary>(KEYS.ANNIVERSARIES);
}

export async function saveAnniversaries(items: Anniversary[]): Promise<void> {
  return saveData(KEYS.ANNIVERSARIES, items);
}

export async function addAnniversary(item: Anniversary): Promise<void> {
  const items = await loadAnniversaries();
  items.push(item);
  await saveAnniversaries(items);
}

export async function deleteAnniversary(id: string): Promise<void> {
  const items = await loadAnniversaries();
  await saveAnniversaries(items.filter((a) => a.id !== id));
}
