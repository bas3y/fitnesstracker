import {
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { moveItem } from '../domain/workout';

export interface SortableItem {
  id: string;
  /** Für die Beschriftung des Griffs */
  name: string;
}

export interface SortableRowProps {
  /** Griff zum Ziehen; `null`, solange es nichts zu sortieren gibt */
  handle: ReactNode;
  /** Gerade wird gezogen: Zeilen möglichst kompakt darstellen, damit lange Listen hinpassen */
  compact: boolean;
}

interface Drag {
  id: string;
  pointerY: number;
  /** Abstand Zeilenmitte–Zeiger; erst nach dem Zusammenklappen messbar */
  offset: number | null;
  /** Aktuelle Reihenfolge – Zeigerereignisse können schneller kommen als gerendert wird */
  order: string[];
}

/**
 * Liste, deren Zeilen sich direkt am Griff ziehen lassen (Pfeiltasten am Griff gehen auch).
 * `renderItem` baut den Griff in die Zeile ein. Die gezogene Zeile bewegt sich um die Strecke des
 * Zeigers (kein Sprung, wenn die Liste beim Ziehen zusammenklappt). Positionen kommen aus dem DOM –
 * Zeilen dürfen also unterschiedlich hoch sein.
 */
export function SortableList<T extends SortableItem>({
  label,
  items,
  onReorder,
  renderItem,
}: {
  label: string;
  items: T[];
  /** Bekommt die neue Reihenfolge; `items` kommen danach aktualisiert zurück */
  onReorder: (ids: string[]) => Promise<void>;
  renderItem: (item: T, row: SortableRowProps) => ReactNode;
}) {
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [droppedId, setDroppedId] = useState<string | null>(null);
  const drag = useRef<Drag | null>(null);
  const saving = useRef(false);
  const list = useRef<HTMLUListElement>(null);
  const order = localOrder ?? items.map((item) => item.id);
  const byId = new Map(items.map((item) => [item.id, item]));

  const rowOf = (id: string) => list.current?.querySelector<HTMLElement>(`[data-sort-id="${id}"]`);
  const middleOf = (row: HTMLElement) =>
    list.current!.getBoundingClientRect().top + row.offsetTop + row.offsetHeight / 2;

  const followPointer = () => {
    const current = drag.current;
    const row = current && rowOf(current.id);
    if (!current || !row) return;
    if (current.offset === null) {
      row.scrollIntoView?.({ block: 'nearest' });
      current.offset = middleOf(row) - current.pointerY;
    }
    row.style.transform = `translateY(${current.pointerY + current.offset - middleOf(row)}px)`;
  };

  // Auch nach dem Zusammenklappen und nach jedem Tausch, weil sich dann das Layout ändert
  useLayoutEffect(followPointer, [draggingId, localOrder]);

  // Nach dem Aufklappen die abgelegte Zeile wieder in den sichtbaren Bereich holen
  useLayoutEffect(() => {
    if (droppedId) rowOf(droppedId)?.scrollIntoView?.({ block: 'nearest' });
  }, [droppedId]);

  const save = async (ids: string[]) => {
    saving.current = true;
    setLocalOrder(ids);
    try {
      await onReorder(ids);
    } finally {
      saving.current = false;
      setLocalOrder(null);
    }
  };

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>, id: string) => {
    if (saving.current) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { id, pointerY: event.clientY, offset: null, order };
    setDroppedId(null);
    setLocalOrder(order);
    setDraggingId(id);
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current) return;
    current.pointerY = event.clientY;
    followPointer();
    const middle = event.clientY + (current.offset ?? 0);
    const index = current.order.indexOf(current.id);
    const next = rowOf(current.order[index + 1] ?? '');
    const previous = rowOf(current.order[index - 1] ?? '');
    const direction =
      next && middle > middleOf(next) ? 1 : previous && middle < middleOf(previous) ? -1 : 0;
    if (direction) {
      current.order = moveItem(current.order, index, direction);
      setLocalOrder(current.order);
    }
  };

  const onPointerUp = () => {
    if (!drag.current) return;
    const { id, order: dropped } = drag.current;
    const row = rowOf(id);
    if (row) row.style.transform = '';
    drag.current = null;
    setDraggingId(null);
    setDroppedId(id);
    const initial = items.map((item) => item.id);
    if (dropped.join() !== initial.join()) void save(dropped);
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
    <ul ref={list} aria-label={label} className="relative">
      {order.map((id) => {
        const item = byId.get(id);
        if (!item) return null;
        const handle =
          items.length > 1 ? (
            <button
              type="button"
              aria-label={`${item.name} verschieben`}
              className="flex h-14 w-10 shrink-0 cursor-grab touch-none items-center justify-center text-xl text-slate-400 select-none"
              onPointerDown={(event) => onPointerDown(event, id)}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onKeyDown={(event) => onKeyDown(event, id)}
            >
              ⠿
            </button>
          ) : null;
        return (
          <li
            key={id}
            data-sort-id={id}
            className={draggingId === id ? 'relative z-10 rounded-2xl shadow-lg' : undefined}
          >
            {renderItem(item, { handle, compact: draggingId !== null })}
          </li>
        );
      })}
    </ul>
  );
}
