import type { TodoPriority } from '../db/types';
import {
  daysCarried,
  doneOn,
  formatTodoDate,
  todayTodos,
  upcomingTodos,
  type TodoFields,
} from './todos';

const TODAY = '2026-10-28';

function todo(
  id: string,
  date: string,
  priority: TodoPriority = 'medium',
  completedAt: string | null = null,
): TodoFields {
  return { id, title: id, priority, date, completedAt, createdAt: '2026-10-20T08:00:00.000Z' };
}

describe('To-dos', () => {
  const todos = [
    todo('heute', TODAY),
    todo('wichtig', TODAY, 'high'),
    todo('alt', '2026-10-26', 'low'),
    todo('morgen', '2026-10-29', 'high'),
    todo('später', '2026-11-05'),
    todo('erledigt', '2026-10-27', 'high', '2026-10-28T09:00:00.000Z'),
    todo('gestern erledigt', '2026-10-27', 'medium', '2026-10-27T09:00:00.000Z'),
  ];

  it('heute: offene bis heute, überfällige wandern mit, nach Priorität', () => {
    expect(todayTodos(todos, TODAY).map(({ id }) => id)).toEqual(['wichtig', 'heute', 'alt']);
  });

  it('geplant: offene ab morgen nach Datum', () => {
    expect(upcomingTodos(todos, TODAY).map(({ id }) => id)).toEqual(['morgen', 'später']);
  });

  it('erledigt an einem Tag (lokaler Tag des Abhakens)', () => {
    expect(doneOn(todos, TODAY).map(({ id }) => id)).toEqual(['erledigt']);
  });

  it('daysCarried und formatTodoDate', () => {
    expect(daysCarried({ date: TODAY }, TODAY)).toBe(0);
    expect(daysCarried({ date: '2026-10-25' }, TODAY)).toBe(3);
    expect(formatTodoDate({ date: TODAY }, TODAY)).toBeNull();
    expect(formatTodoDate({ date: '2026-10-27' }, TODAY)).toBe('seit gestern');
    expect(formatTodoDate({ date: '2026-10-25' }, TODAY)).toBe('seit 3 Tagen');
    expect(formatTodoDate({ date: '2026-10-29' }, TODAY)).toBe('Morgen');
    expect(formatTodoDate({ date: '2026-11-05' }, TODAY)).toBe('Do., 05.11.2026');
  });

  it('daysCarried über die Zeitumstellung (25.10.2026)', () => {
    expect(daysCarried({ date: '2026-10-24' }, '2026-10-26')).toBe(2);
  });
});
