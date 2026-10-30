/** Abstand vom Rand des sichtbaren Bereichs, ab dem beim Ziehen gescrollt wird */
export const DRAG_SCROLL_EDGE_PX = 72;
export const DRAG_SCROLL_MAX_SPEED_PX = 14;

/**
 * Scroll-Schritt pro Bild beim Ziehen, je näher am Rand desto schneller; negativ = nach oben.
 * `top`/`bottom` begrenzen den sichtbaren Bereich (ohne Navigation und andere feste Leisten).
 */
export function dragScrollDelta(pointerY: number, top: number, bottom: number): number {
  const depth =
    pointerY < top + DRAG_SCROLL_EDGE_PX
      ? pointerY - top - DRAG_SCROLL_EDGE_PX
      : pointerY > bottom - DRAG_SCROLL_EDGE_PX
        ? pointerY - bottom + DRAG_SCROLL_EDGE_PX
        : 0;
  if (depth === 0) return 0;
  const speed = Math.ceil(
    (Math.min(Math.abs(depth), DRAG_SCROLL_EDGE_PX) / DRAG_SCROLL_EDGE_PX) *
      DRAG_SCROLL_MAX_SPEED_PX,
  );
  return depth < 0 ? -speed : speed;
}
