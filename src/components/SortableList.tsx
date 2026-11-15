import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { dragScrollDelta } from '../domain/dragScroll';
import { moveItem } from '../domain/workout';
import { scrollRoot } from './scrollRoot';

/** So weit muss der Zeiger wandern, bevor gescrollt wird – ein Griff kann am Rand liegen */
const SCROLL_THRESHOLD_PX = 8;

/**
 * Unterkante des sichtbaren Bereichs ohne feste Leisten (`data-bottom-bar`); Leisten, die nicht
 * unten liegen (Navigation als Seitenleiste am Desktop), zählen nicht
 */
function visibleBottom(): number {
  const bars = document.querySelectorAll('[data-bottom-bar]');
  return Math.min(
    window.innerHeight,
    ...Array.from(bars, (bar) => bar.getBoundingClientRect().top).filter(
      (top) => top > window.innerHeight / 2,
    ),
  );
}

export interface SortableItem {
  id: string;
  /** Für die Beschriftung des Griffs */
  name: string;
}

export interface SortableRowProps {
  /** Griff zum Ziehen; `null`, solange es nichts zu sortieren gibt */
  handle: ReactNode;
}

interface Drag {
  id: string;
  startY: number;
  pointerY: number;
  pointerX: number;
  /** Abstand Zeilenmitte–Zeiger beim Greifen */
  offset: number;
  /** Waagrecht (nur im Raster) */
  offsetX: number;
  /** Aktuelle Reihenfolge – Zeigerereignisse können schneller kommen als gerendert wird */
  order: string[];
  /**
   * Größte Scrollhöhe beim Greifen: Die verschobene Zeile vergrößert sonst den Scrollbereich und
   * die Seite liefe am unteren Rand endlos weiter
   */
  maxScroll: number;
}

/**
 * Liste, deren Zeilen sich direkt am Griff ziehen lassen (Pfeiltasten am Griff gehen auch).
 * `renderItem` baut den Griff in die Zeile ein. Zeilen werden samt Inhalt gezogen und bewegen sich
 * um die Strecke des Zeigers. Positionen kommen aus dem DOM – Zeilen dürfen also unterschiedlich
 * hoch sein. Am Bildschirmrand scrollt die Seite mit (auch bei Zeilen, die höher als der
 * Bildschirm sind).
 * Mit `grid` stehen die Zeilen in einem Raster (Spalten und Breite je Zeile als Tailwind-Klassen)
 * und lassen sich auch seitlich ziehen: Getauscht wird mit der Zeile, über deren Fläche die Mitte
 * der gezogenen Zeile liegt. Pfeiltasten links/rechts gehen dann auch.
 */
export function SortableList<T extends SortableItem>({
  label,
  items,
  onReorder,
  renderItem,
  grid: gridLayout,
}: {
  label: string;
  items: T[];
  /** Bekommt die neue Reihenfolge; `items` kommen danach aktualisiert zurück */
  onReorder: (ids: string[]) => Promise<void>;
  renderItem: (item: T, row: SortableRowProps) => ReactNode;
  /** Raster statt Liste: `columns` z. B. `grid-cols-2 sm:grid-cols-4`, `span` je Zeile `col-span-…` */
  grid?: { columns: string; span: (item: T) => string };
}) {
  const grid = gridLayout !== undefined;
  const [localOrder, setLocalOrder] = useState<string[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const drag = useRef<Drag | null>(null);
  const saving = useRef(false);
  const list = useRef<HTMLUListElement>(null);
  const order = localOrder ?? items.map((item) => item.id);

  const rowOf = (id: string) => list.current?.querySelector<HTMLElement>(`[data-sort-id="${id}"]`);
  const middleOf = (row: HTMLElement) =>
    list.current!.getBoundingClientRect().top + row.offsetTop + row.offsetHeight / 2;
  const centerOf = (row: HTMLElement) =>
    list.current!.getBoundingClientRect().left + row.offsetLeft + row.offsetWidth / 2;

  const followPointer = () => {
    const current = drag.current;
    const row = current && rowOf(current.id);
    if (!current || !row) return;
    const y = current.pointerY + current.offset - middleOf(row);
    const x = grid ? current.pointerX + current.offsetX - centerOf(row) : 0;
    row.style.transform = grid ? `translate(${x}px, ${y}px)` : `translateY(${y}px)`;
  };

  // Raster: Zeile, über deren Fläche (ohne Verschiebung) die Mitte der gezogenen Zeile liegt
  const swapInGrid = (current: Drag) => {
    const x = current.pointerX + current.offsetX;
    const y = current.pointerY + current.offset;
    const listBox = list.current!.getBoundingClientRect();
    const target = current.order.find((id) => {
      const row = id === current.id ? null : rowOf(id);
      if (!row) return false;
      const left = listBox.left + row.offsetLeft;
      const top = listBox.top + row.offsetTop;
      return x >= left && x <= left + row.offsetWidth && y >= top && y <= top + row.offsetHeight;
    });
    if (!target) return;
    const next = current.order.filter((id) => id !== current.id);
    const at = current.order.indexOf(target);
    next.splice(at, 0, current.id);
    current.order = next;
    setLocalOrder(next);
  };

  // Getauscht wird, sobald die Kante der gezogenen Zeile die Mitte des Nachbarn überquert –
  // so reicht auch bei hohen Karten (Workout-Übungen) eine halbe Nachbarhöhe
  const swapAtPointer = () => {
    const current = drag.current;
    const row = current && rowOf(current.id);
    if (!current || !row) return;
    if (grid) return swapInGrid(current);
    const middle = current.pointerY + current.offset;
    const top = middle - row.offsetHeight / 2;
    const bottom = middle + row.offsetHeight / 2;
    const index = current.order.indexOf(current.id);
    const next = rowOf(current.order[index + 1] ?? '');
    const previous = rowOf(current.order[index - 1] ?? '');
    const direction =
      next && bottom > middleOf(next) ? 1 : previous && top < middleOf(previous) ? -1 : 0;
    if (direction) {
      current.order = moveItem(current.order, index, direction);
      setLocalOrder(current.order);
    }
  };

  // Nach jedem Tausch, weil sich dann das Layout ändert
  useLayoutEffect(followPointer, [draggingId, localOrder, grid]);

  // Läuft bildweise weiter, weil ein ruhender Finger am Rand keine Zeigerereignisse auslöst
  useEffect(() => {
    if (draggingId === null) return;
    const scroll = () => {
      const current = drag.current;
      if (current && Math.abs(current.pointerY - current.startY) >= SCROLL_THRESHOLD_PX) {
        const delta = dragScrollDelta(current.pointerY, 0, visibleBottom());
        if (delta !== 0) {
          const root = scrollRoot();
          root.scrollTop = Math.max(0, Math.min(current.maxScroll, root.scrollTop + delta));
          followPointer();
          swapAtPointer();
        }
      }
      frame = requestAnimationFrame(scroll);
    };
    let frame = requestAnimationFrame(scroll);
    return () => cancelAnimationFrame(frame);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- arbeitet nur mit Refs
  }, [draggingId]);

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
    const row = rowOf(id);
    if (saving.current || !row) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      id,
      startY: event.clientY,
      pointerY: event.clientY,
      pointerX: event.clientX,
      offset: middleOf(row) - event.clientY,
      offsetX: centerOf(row) - event.clientX,
      order,
      maxScroll: scrollRoot().scrollHeight - scrollRoot().clientHeight,
    };
    setLocalOrder(order);
    setDraggingId(id);
  };

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    const current = drag.current;
    if (!current) return;
    current.pointerY = event.clientY;
    current.pointerX = event.clientX;
    followPointer();
    swapAtPointer();
  };

  const onPointerUp = () => {
    if (!drag.current) return;
    const { id, order: dropped } = drag.current;
    const row = rowOf(id);
    if (row) row.style.transform = '';
    drag.current = null;
    setDraggingId(null);
    const initial = items.map((item) => item.id);
    if (dropped.join() !== initial.join()) void save(dropped);
    else setLocalOrder(null);
  };

  const onKeyDown = (event: KeyboardEvent, id: string) => {
    const back = event.key === 'ArrowUp' || (grid && event.key === 'ArrowLeft');
    const forward = event.key === 'ArrowDown' || (grid && event.key === 'ArrowRight');
    const direction = back ? -1 : forward ? 1 : 0;
    if (!direction || saving.current) return;
    event.preventDefault();
    const next = moveItem(order, order.indexOf(id), direction);
    if (next.join() !== order.join()) void save(next);
  };

  return (
    // Reihenfolge per CSS: Würde die gezogene Zeile im DOM wandern, ginge die Pointer-Capture verloren.
    // Ohne Scroll-Anker: Sonst verschiebt der Browser nach einem Tausch hoher Zeilen die Seite.
    <ul
      ref={list}
      aria-label={label}
      className={`relative [overflow-anchor:none] ${gridLayout ? `grid grid-flow-dense gap-x-3 ${gridLayout.columns}` : 'flex flex-col'}`}
    >
      {items.map((item) => {
        const { id } = item;
        const handle =
          items.length > 1 ? (
            <button
              type="button"
              aria-label={`${item.name} verschieben`}
              className="flex h-14 w-10 shrink-0 cursor-grab touch-none items-center justify-center text-xl text-faint select-none"
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
            style={{ order: order.indexOf(id) }}
            className={
              [
                gridLayout ? `min-w-0 ${gridLayout.span(item)}` : '',
                draggingId === id ? 'anim-lift relative z-10 rounded-2xl shadow-lg' : '',
              ]
                .filter(Boolean)
                .join(' ') || undefined
            }
          >
            {renderItem(item, { handle })}
          </li>
        );
      })}
    </ul>
  );
}
