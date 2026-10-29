import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { primaryButton } from '../../components/buttons';
import { reorderWorkoutExercises, type WorkoutItem } from '../../db/workouts';
import { moveItem } from '../../domain/workout';

interface Drag {
  id: string;
  /** Zeigerposition, auf die sich `dy` bezieht (wird beim Tauschen um eine Zeile verschoben) */
  startY: number;
  dy: number;
  /** Abstand zweier Zeilen in px */
  pitch: number;
}

/**
 * Kompakte Liste der Übungsblöcke zum Umsortieren per Ziehen am Griff
 * (z. B. wenn ein Gerät belegt ist). Pfeiltasten am Griff verschieben ebenfalls.
 */
export function ExerciseOrderList({
  workoutId,
  items,
  onDone,
}: {
  workoutId: string;
  items: WorkoutItem[];
  onDone: () => void;
}) {
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);
  const [drag, setDrag] = useState<Drag | null>(null);
  const saving = useRef(false);
  const order = localOrder ?? items.map((item) => item.workoutExercise.id);
  const byId = new Map(items.map((item) => [item.workoutExercise.id, item]));

  const save = async (ids: string[]) => {
    saving.current = true;
    setLocalOrder(ids);
    try {
      await reorderWorkoutExercises(workoutId, ids);
    } finally {
      saving.current = false;
      setLocalOrder(null);
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>, id: string) => {
    if (saving.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    const row = event.currentTarget.closest('li');
    setLocalOrder(order);
    setDrag({ id, startY: event.clientY, dy: 0, pitch: (row?.offsetHeight ?? 56) + 8 });
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (!drag) return;
    let { startY } = drag;
    let dy = event.clientY - startY;
    const index = order.indexOf(drag.id);
    let next = order;
    if (dy > drag.pitch / 2 && index < order.length - 1) {
      next = moveItem(order, index, 1);
      startY += drag.pitch;
      dy -= drag.pitch;
    } else if (dy < -drag.pitch / 2 && index > 0) {
      next = moveItem(order, index, -1);
      startY -= drag.pitch;
      dy += drag.pitch;
    }
    if (next !== order) setLocalOrder(next);
    setDrag({ ...drag, startY, dy });
  };

  const onPointerUp = () => {
    if (!drag) return;
    setDrag(null);
    const initial = items.map((item) => item.workoutExercise.id);
    if (order.join() !== initial.join()) void save(order);
    else setLocalOrder(null);
  };

  const onKeyDown = (event: KeyboardEvent, id: string) => {
    const direction = event.key === 'ArrowUp' ? -1 : event.key === 'ArrowDown' ? 1 : 0;
    if (!direction || saving.current) return;
    event.preventDefault();
    const next = moveItem(order, order.indexOf(id), direction);
    if (next.join() !== order.join()) void save(next);
  };

  return (
    <div className="mb-4">
      <p className="mb-3 text-sm text-slate-600 dark:text-slate-400">
        Am Griff ⠿ ziehen, um die Reihenfolge zu ändern.
      </p>
      <ul aria-label="Reihenfolge der Übungen" className="mb-4 flex flex-col gap-2">
        {order.map((id) => {
          const item = byId.get(id);
          if (!item) return null;
          const name = item.exercise?.name ?? 'Unbekannte Übung';
          const dragging = drag?.id === id;
          return (
            <li
              key={id}
              style={dragging ? { transform: `translateY(${drag.dy}px)` } : undefined}
              className={`flex min-h-14 items-center gap-2 rounded-2xl bg-white pr-4 shadow-sm dark:bg-slate-800 ${
                dragging ? 'relative z-10 shadow-lg ring-2 ring-emerald-500' : ''
              }`}
            >
              <button
                type="button"
                aria-label={`${name} verschieben`}
                className="flex h-14 w-12 shrink-0 cursor-grab touch-none items-center justify-center text-xl text-slate-400 select-none"
                onPointerDown={(event) => onPointerDown(event, id)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                onKeyDown={(event) => onKeyDown(event, id)}
              >
                ⠿
              </button>
              <span className="min-w-0 flex-1 truncate font-medium">{name}</span>
              <span className="shrink-0 text-sm text-slate-500 dark:text-slate-400">
                {item.sets.length === 1 ? '1 Satz' : `${item.sets.length} Sätze`}
              </span>
            </li>
          );
        })}
      </ul>
      <button type="button" className={primaryButton} onClick={onDone}>
        Fertig
      </button>
    </div>
  );
}
