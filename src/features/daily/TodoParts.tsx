import { useEffect, useId, useRef, useState, type FormEvent } from 'react';
import { dangerButton, inputField, primaryButton, secondaryButton } from '../../components/buttons';
import { Chip } from '../../components/Chip';
import { CheckIcon } from '../../components/icons';
import { createTodo, deleteTodo, setTodoDone, updateTodo } from '../../db/todos';
import { todoInputSchema, type TodoInput } from '../../db/schemas';
import { TODO_PRIORITIES, type DayKey, type Todo, type TodoPriority } from '../../db/types';
import { shiftDay } from '../../domain/daily';
import { formatTodoDate, TODO_PRIORITY_LABELS } from '../../domain/todos';

const LABEL = 'mb-1 block text-sm font-medium';

const PRIORITY_BADGE: Record<TodoPriority, string | null> = {
  high: 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300',
  medium: null,
  low: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
};

function PriorityChips({
  value,
  onChange,
}: {
  value: TodoPriority;
  onChange: (priority: TodoPriority) => void;
}) {
  return (
    <div role="group" aria-label="Priorität" className="flex flex-wrap gap-1">
      {TODO_PRIORITIES.map((priority) => (
        <Chip
          key={priority}
          pressed={value === priority}
          className="px-3"
          onClick={() => onChange(priority)}
        >
          {TODO_PRIORITY_LABELS[priority]}
        </Chip>
      ))}
    </div>
  );
}

/** Heute/Morgen als Chips, optional ein freies Datum */
function DateChoice({
  value,
  today,
  withPicker,
  allowPast = false,
  onChange,
}: {
  value: DayKey;
  today: DayKey;
  withPicker: boolean;
  /** Beim Bearbeiten darf ein überfälliges Datum stehen bleiben */
  allowPast?: boolean;
  onChange: (date: DayKey) => void;
}) {
  const tomorrow = shiftDay(today, 1);
  return (
    <div role="group" aria-label="Datum" className="flex flex-wrap items-center gap-1">
      <Chip pressed={value === today} className="px-3" onClick={() => onChange(today)}>
        Heute
      </Chip>
      <Chip pressed={value === tomorrow} className="px-3" onClick={() => onChange(tomorrow)}>
        Morgen
      </Chip>
      {withPicker && (
        <input
          type="date"
          aria-label="Datum wählen"
          className={`${inputField} w-auto flex-1`}
          min={allowPast ? undefined : today}
          value={value}
          onChange={(event) => event.target.value && onChange(event.target.value)}
        />
      )}
    </div>
  );
}

/** Schnell eintragen: Text, Priorität, Tag; Priorität und Tag bleiben für die nächste Aufgabe */
export function TodoAddForm({
  today,
  withPicker = false,
  onAdded,
}: {
  today: DayKey;
  withPicker?: boolean;
  onAdded?: () => void;
}) {
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<TodoPriority>('medium');
  const [date, setDate] = useState(today);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    const result = todoInputSchema.safeParse({
      title,
      priority,
      date: date < today ? today : date,
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Eingabe prüfen');
      return;
    }
    await createTodo(result.data);
    setTitle('');
    setError(null);
    onAdded?.();
  };

  return (
    <form onSubmit={(event) => void submit(event)} className="mb-3">
      <div className="flex gap-2">
        <input
          aria-label="Neue Aufgabe"
          className={inputField}
          placeholder="Neue Aufgabe …"
          maxLength={200}
          value={title}
          onFocus={() => setExpanded(true)}
          onChange={(event) => {
            setTitle(event.target.value);
            setError(null);
          }}
        />
        <button
          type="submit"
          aria-label="Aufgabe hinzufügen"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-700 text-2xl text-white active:bg-emerald-800"
        >
          +
        </button>
      </div>
      {(expanded || withPicker) && (
        <div className="mt-2 flex flex-col gap-2">
          <PriorityChips value={priority} onChange={setPriority} />
          <DateChoice value={date} today={today} withPicker={withPicker} onChange={setDate} />
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm font-medium text-red-700 dark:text-red-400">
          {error}
        </p>
      )}
    </form>
  );
}

export function TodoRow({ todo, today }: { todo: Todo; today: DayKey }) {
  const [editing, setEditing] = useState(false);
  const done = todo.completedAt !== null;
  const dateHint = done ? null : formatTodoDate(todo, today);
  const badge = PRIORITY_BADGE[todo.priority];

  return (
    <li className="flex items-center gap-1">
      <button
        type="button"
        role="checkbox"
        aria-checked={done}
        aria-label={todo.title}
        className="flex h-11 w-11 shrink-0 items-center justify-center"
        onClick={() => void setTodoDone(todo.id, !done)}
      >
        <span
          aria-hidden="true"
          className={`flex h-7 w-7 items-center justify-center rounded-lg border-2 ${
            done
              ? 'border-emerald-700 bg-emerald-700 text-white'
              : todo.priority === 'high'
                ? 'border-red-500'
                : 'border-slate-300 dark:border-slate-600'
          }`}
        >
          {done && <CheckIcon className="h-5 w-5" />}
        </span>
      </button>
      <button
        type="button"
        aria-label={`Bearbeiten: ${todo.title}`}
        className="flex min-h-12 min-w-0 flex-1 flex-col justify-center py-1 text-left"
        onClick={() => setEditing(true)}
      >
        <span
          className={`block break-words ${done ? 'text-slate-500 line-through dark:text-slate-400' : ''}`}
        >
          {todo.title}
        </span>
        {(badge || dateHint) && (
          <span className="flex flex-wrap items-center gap-2 text-sm">
            {badge && !done && (
              <span className={`rounded-full px-2 text-xs font-semibold ${badge}`}>
                {TODO_PRIORITY_LABELS[todo.priority]}
              </span>
            )}
            {dateHint && (
              <span
                className={
                  dateHint.startsWith('seit')
                    ? 'text-orange-700 dark:text-orange-400'
                    : 'text-slate-500 dark:text-slate-400'
                }
              >
                {dateHint}
              </span>
            )}
          </span>
        )}
      </button>
      {editing && <TodoEditDialog todo={todo} today={today} onClose={() => setEditing(false)} />}
    </li>
  );
}

function TodoEditDialog({
  todo,
  today,
  onClose,
}: {
  todo: Todo;
  today: DayKey;
  onClose: () => void;
}) {
  const titleId = useId();
  const inputId = useId();
  const dialog = useRef<HTMLFormElement>(null);
  const [input, setInput] = useState<TodoInput>({
    title: todo.title,
    priority: todo.priority,
    date: todo.date,
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    dialog.current?.focus();
  }, []);

  const save = async (event: FormEvent) => {
    event.preventDefault();
    const result = todoInputSchema.safeParse(input);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'Eingabe prüfen');
      return;
    }
    await updateTodo(todo.id, result.data);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onKeyDown={(event) => {
          if (event.key === 'Escape') onClose();
        }}
        onSubmit={(event) => void save(event)}
        className="flex w-full max-w-sm flex-col gap-3 rounded-2xl bg-white p-4 shadow-lg outline-none dark:bg-slate-800"
      >
        <h2 id={titleId} className="text-lg font-semibold">
          Aufgabe bearbeiten
        </h2>
        <div>
          <label htmlFor={inputId} className={LABEL}>
            Aufgabe
          </label>
          <input
            id={inputId}
            className={inputField}
            maxLength={200}
            value={input.title}
            onChange={(event) => setInput({ ...input, title: event.target.value })}
          />
        </div>
        <PriorityChips
          value={input.priority}
          onChange={(priority) => setInput({ ...input, priority })}
        />
        <DateChoice
          value={input.date}
          today={today}
          withPicker
          allowPast
          onChange={(date) => setInput({ ...input, date })}
        />
        {error && (
          <p role="alert" className="text-sm font-medium text-red-700 dark:text-red-400">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <button type="button" className={secondaryButton} onClick={onClose}>
            Abbrechen
          </button>
          <button type="submit" className={primaryButton}>
            Speichern
          </button>
        </div>
        <button
          type="button"
          className={dangerButton}
          onClick={() => {
            void deleteTodo(todo.id);
            onClose();
          }}
        >
          Aufgabe löschen
        </button>
      </form>
    </div>
  );
}
