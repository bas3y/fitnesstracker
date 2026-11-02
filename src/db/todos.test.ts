import { db } from './database';
import { resetDatabase } from './testUtils';
import {
  clearDoneTodos,
  createTodo,
  deleteTodo,
  listTodos,
  setTodoDone,
  updateTodo,
} from './todos';

beforeEach(resetDatabase);

const INPUT = { title: ' Einkaufen ', priority: 'high' as const, date: '2026-10-30' };

describe('To-dos', () => {
  it('legt an, prüft und ändert', async () => {
    const todo = await createTodo(INPUT);
    expect(todo).toMatchObject({ title: 'Einkaufen', completedAt: null, deletedAt: null });
    await expect(createTodo({ ...INPUT, title: '  ' })).rejects.toThrow();
    await expect(createTodo({ ...INPUT, date: '30.10.' })).rejects.toThrow();
    await updateTodo(todo.id, { ...INPUT, title: 'Wocheneinkauf', priority: 'low' });
    expect(await listTodos()).toMatchObject([{ title: 'Wocheneinkauf', priority: 'low' }]);
  });

  it('hakt ab und nimmt zurück', async () => {
    const todo = await createTodo(INPUT);
    await setTodoDone(todo.id, true);
    expect((await listTodos())[0]?.completedAt).not.toBeNull();
    await setTodoDone(todo.id, false);
    expect((await listTodos())[0]?.completedAt).toBeNull();
  });

  it('löscht weich, auch alle erledigten auf einmal', async () => {
    const a = await createTodo(INPUT);
    const b = await createTodo({ ...INPUT, title: 'B' });
    await createTodo({ ...INPUT, title: 'Offen' });
    await deleteTodo(a.id);
    await setTodoDone(b.id, true);
    await clearDoneTodos();
    expect((await listTodos()).map(({ title }) => title)).toEqual(['Offen']);
    expect(await db.todos.count()).toBe(3);
  });
});
