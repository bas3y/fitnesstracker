export interface ToastMessage {
  id: number;
  title: string;
  lines: string[];
  /** `record` (Standard) = Rekord mit Pokal, `info` = schlichter Hinweis */
  variant?: 'record' | 'info';
}

let current: ToastMessage | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

function emit(message: ToastMessage | null) {
  current = message;
  for (const listener of listeners) listener();
}

/** Zeigt einen Hinweis oben auf dem Bildschirm (ersetzt einen noch sichtbaren) */
export function showToast(message: Omit<ToastMessage, 'id'>) {
  emit({ ...message, id: nextId++ });
}

/** Schließt den Hinweis – nur, falls noch dieser angezeigt wird (ohne `id`: immer) */
export function hideToast(id?: number) {
  if (id === undefined || current?.id === id) emit(null);
}

export function subscribeToast(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getToast() {
  return current;
}
