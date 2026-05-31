import { Countdown } from '../types';
import { loadData, saveData, KEYS } from './index';

export async function loadCountdowns(): Promise<Countdown[]> {
  return loadData<Countdown>(KEYS.COUNTDOWNS);
}

export async function saveCountdowns(items: Countdown[]): Promise<void> {
  return saveData(KEYS.COUNTDOWNS, items);
}

export async function addCountdown(item: Countdown): Promise<void> {
  const items = await loadCountdowns();
  items.push(item);
  await saveCountdowns(items);
}

export async function deleteCountdown(id: string): Promise<void> {
  const items = await loadCountdowns();
  await saveCountdowns(items.filter((c) => c.id !== id));
}
