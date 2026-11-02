import { db } from './database';
import { create, listActive, nowIso, softDelete, update } from './repository';
import { todoInputSchema, type TodoInput } from './schemas';
import type { Todo } from './types';

export function listTodos(): Promise<Todo[]> {
  return listActive(db.todos);
}

export async function createTodo(input: TodoInput): Promise<Todo> {
  return create<Todo>(db.todos, { ...todoInputSchema.parse(input), completedAt: null });
}

export async function updateTodo(id: string, input: TodoInput): Promise<void> {
  await update(db.todos, id, todoInputSchema.parse(input));
}

export async function setTodoDone(id: string, done: boolean): Promise<void> {
  await update(db.todos, id, { completedAt: done ? nowIso() : null });
}

export function deleteTodo(id: string): Promise<void> {
  return softDelete(db.todos, id);
}

/** Entfernt alle erledigten Aufgaben (weich) */
export function clearDoneTodos(): Promise<void> {
  return db.transaction('rw', db.todos, async () => {
    const done = (await listActive(db.todos)).filter((todo) => todo.completedAt !== null);
    for (const todo of done) await softDelete(db.todos, todo.id);
  });
}
