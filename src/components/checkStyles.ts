export const CHECK_HINT = 'block text-sm text-slate-500 dark:text-slate-400';

export function checkNameClass(done: boolean) {
  return `block font-medium ${done ? 'text-slate-500 line-through dark:text-slate-400' : ''}`;
}
