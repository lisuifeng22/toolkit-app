import { Note } from '../types';
import { loadData, saveData, KEYS } from './index';

export async function loadNotes(): Promise<Note[]> {
  return loadData<Note>(KEYS.NOTES);
}

export async function saveNotes(notes: Note[]): Promise<void> {
  return saveData(KEYS.NOTES, notes);
}

export async function addNote(note: Note): Promise<void> {
  const notes = await loadNotes();
  notes.unshift(note);
  await saveNotes(notes);
}

export async function updateNote(id: string, updates: Partial<Note>): Promise<void> {
  const notes = await loadNotes();
  const idx = notes.findIndex((n) => n.id === id);
  if (idx !== -1) {
    notes[idx] = { ...notes[idx], ...updates, updatedAt: Date.now() };
    await saveNotes(notes);
  }
}

export async function deleteNote(id: string): Promise<void> {
  const notes = await loadNotes();
  await saveNotes(notes.filter((n) => n.id !== id));
}
