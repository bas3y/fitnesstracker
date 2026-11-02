import { useLiveQuery } from 'dexie-react-hooks';
import { listTodos } from '../../db/todos';

export const TODOS_PATH = '/daily/todos';

export function useTodos() {
  return useLiveQuery(listTodos, []);
}
