import { DRAG_SCROLL_EDGE_PX, DRAG_SCROLL_MAX_SPEED_PX, dragScrollDelta } from './dragScroll';

describe('dragScrollDelta', () => {
  const top = 0;
  const bottom = 700;

  it('scrollt nicht außerhalb der Randzonen', () => {
    expect(dragScrollDelta(350, top, bottom)).toBe(0);
    expect(dragScrollDelta(DRAG_SCROLL_EDGE_PX, top, bottom)).toBe(0);
    expect(dragScrollDelta(bottom - DRAG_SCROLL_EDGE_PX, top, bottom)).toBe(0);
  });

  it('scrollt am oberen Rand nach oben und am unteren nach unten', () => {
    expect(dragScrollDelta(10, top, bottom)).toBeLessThan(0);
    expect(dragScrollDelta(690, top, bottom)).toBeGreaterThan(0);
  });

  it('wird zum Rand hin schneller und bleibt begrenzt', () => {
    expect(dragScrollDelta(690, top, bottom)).toBeGreaterThan(dragScrollDelta(640, top, bottom));
    expect(dragScrollDelta(bottom, top, bottom)).toBe(DRAG_SCROLL_MAX_SPEED_PX);
    expect(dragScrollDelta(900, top, bottom)).toBe(DRAG_SCROLL_MAX_SPEED_PX);
    expect(dragScrollDelta(-50, top, bottom)).toBe(-DRAG_SCROLL_MAX_SPEED_PX);
  });

  it('beachtet feste Leisten über die Grenzen', () => {
    expect(dragScrollDelta(650, top, 640)).toBe(DRAG_SCROLL_MAX_SPEED_PX);
    expect(dragScrollDelta(650, top, 800)).toBe(0);
  });
});
