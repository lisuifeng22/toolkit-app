import { Todo } from '../types';
import { loadData, saveData, KEYS } from './index';

export async function loadTodos(): Promise<Todo[]> {
  return loadData<Todo>(KEYS.TODOS);
}

export async function saveTodos(todos: Todo[]): Promise<void> {
  return saveData(KEYS.TODOS, todos);
}

export async function addTodo(todo: Todo): Promise<void> {
  const todos = await loadTodos();
  todos.unshift(todo);
  await saveTodos(todos);
}

export async function updateTodo(id: string, updates: Partial<Todo>): Promise<void> {
  const todos = await loadTodos();
  const idx = todos.findIndex(t => t.id === id);
  if (idx !== -1) {
    todos[idx] = { ...todos[idx], ...updates };
    await saveTodos(todos);
  }
}

export async function deleteTodo(id: string): Promise<void> {
  const todos = await loadTodos();
  await saveTodos(todos.filter(t => t.id !== id));
}

export async function toggleTodo(id: string): Promise<void> {
  const todos = await loadTodos();
  const idx = todos.findIndex(t => t.id === id);
  if (idx !== -1) {
    todos[idx] = { ...todos[idx], completed: !todos[idx].completed };
    await saveTodos(todos);
  }
}
