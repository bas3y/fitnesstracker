export const CHECK_HINT = 'block text-sm text-muted';

export function checkNameClass(done: boolean) {
  return `block font-medium ${done ? 'text-muted line-through' : ''}`;
}
