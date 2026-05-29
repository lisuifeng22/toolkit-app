export interface Note {
  id: string;
  content: string;
  colorTag: string;
  createdAt: number;
  updatedAt: number;
}

export interface Todo {
  id: string;
  title: string;
  completed: boolean;
  dueDate: number | null;
  createdAt: number;
}

export interface Password {
  id: string;
  siteName: string;
  username: string;
  password: string;
  notes: string;
}

export interface Countdown {
  id: string;
  title: string;
  targetDate: string;
  createdAt: number;
}

export interface Birthday {
  id: string;
  name: string;
  birthDate: string;
  repeatYearly: boolean;
}

export interface Anniversary {
  id: string;
  title: string;
  date: string;
  createdAt: number;
}

export type RootDrawerParamList = {
  Dashboard: undefined;
  Weather: undefined;
  Notes: undefined;
  Todos: undefined;
  Countdowns: undefined;
  Birthdays: undefined;
  Anniversaries: undefined;
  Password: undefined;
};

export type NotesStackParamList = {
  NotesList: undefined;
  NoteEditor: { noteId?: string };
};

export type TodosStackParamList = {
  TodosList: undefined;
  TodoEditor: { todoId?: string };
};

export type CountdownStackParamList = {
  CountdownsList: undefined;
  CountdownEditor: { countdownId?: string };
};
