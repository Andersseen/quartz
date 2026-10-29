import { describe, expect, it } from 'vitest';
import { calculateArrowGeometry, placementSide } from './overlay-arrow';
import { calculatePosition } from './overlay-position';

const anchor = { left: 100, top: 100, width: 40, height: 20 };

describe('calculateArrowGeometry', () => {
  it('centers the arrow on the anchor for a top placement', () => {
    // surface 100px wide centered on anchor center (120) → left 70
    const g = calculateArrowGeometry(anchor, { left: 70, top: 40, width: 100, height: 50 }, 'top', {
      size: 10,
    });
    expect(g).toMatchObject({
      side: 'top',
      edge: 'bottom',
      axis: 'x',
      alignment: 'center',
      available: true,
    });
    expect(g.offset).toBe(45);
    expect(g.centerOffset).toBe(0);
  });

  it.each([
    ['bottom', 'top', 'x'],
    ['left', 'right', 'y'],
    ['right', 'left', 'y'],
  ] as const)('%s placement puts the arrow on the %s edge along %s', (placement, edge, axis) => {
    const g = calculateArrowGeometry(
      anchor,
      { left: 60, top: 60, width: 100, height: 100 },
      placement,
      {
        size: 8,
      },
    );
    expect(g.edge).toBe(edge);
    expect(g.axis).toBe(axis);
    expect(placementSide(placement)).toBe(placement);
  });

  it('clamps with padding when the surface is aligned to the anchor start', () => {
    // bottom-start: surface starts at anchor.left (100), anchor center is 20px in
    const g = calculateArrowGeometry(
      { left: 100, top: 100, width: 8, height: 20 },
      { left: 100, top: 120, width: 100, height: 40 },
      'bottom-start',
      { size: 10, padding: 12 },
    );
    expect(g.alignment).toBe('start');
    expect(g.offset).toBe(12); // padding, not the raw 4 - 5
    expect(g.available).toBe(true);
  });

  it('clamps at the end edge on viewport shift', () => {
    const g = calculateArrowGeometry(
      { left: 0, top: 100, width: 600, height: 20 },
      { left: 0, top: 120, width: 100, height: 40 },
      'bottom',
      { size: 10, padding: 4 },
    );
    expect(g.offset).toBe(100 - 4 - 10);
  });

  it('is unavailable when the arrow is larger than the track', () => {
    const g = calculateArrowGeometry(anchor, { left: 100, top: 40, width: 20, height: 50 }, 'top', {
      size: 30,
    });
    expect(g.available).toBe(false);
    expect(g.offset).toBeNull();
    expect(g.centerOffset).toBeNull();
  });

  it('is unavailable when the anchor no longer overlaps the surface', () => {
    const g = calculateArrowGeometry(
      anchor,
      { left: 400, top: 40, width: 100, height: 50 },
      'top',
      {
        size: 8,
      },
    );
    expect(g.available).toBe(false);
  });

  it.each([NaN, Infinity])('never emits non-finite offsets (%s)', (bad) => {
    const g = calculateArrowGeometry(
      { ...anchor, left: bad },
      { left: 70, top: 40, width: 100, height: 50 },
      'top',
      { size: 8 },
    );
    expect(g.available).toBe(false);
    expect(g.offset).toBeNull();
  });

  it('is unavailable for a zero-size surface', () => {
    expect(
      calculateArrowGeometry(anchor, { left: 100, top: 0, width: 0, height: 0 }, 'top').available,
    ).toBe(false);
  });

  it('follows the resolved placement after a flip (not the requested one)', () => {
    const el = document.createElement('div');
    Object.defineProperty(el, 'offsetWidth', { value: 100 });
    Object.defineProperty(el, 'offsetHeight', { value: 50 });
    const rect = { left: 100, top: 10, width: 40, height: 20, right: 140, bottom: 30 } as DOMRect;
    const pos = calculatePosition(rect, el, 'top', 8, true, 'main', { width: 800, height: 600 });
    expect(pos.placement).toBe('bottom');
    const g = calculateArrowGeometry(
      rect,
      { left: pos.left, top: pos.top, width: 100, height: 50 },
      pos.placement,
      { size: 8 },
    );
    expect(g.side).toBe('bottom');
    expect(g.edge).toBe('top');
  });

  it('uses physical alignment in RTL (top-start resolves to top-end)', () => {
    const el = document.createElement('div');
    Object.defineProperty(el, 'offsetWidth', { value: 100 });
    Object.defineProperty(el, 'offsetHeight', { value: 50 });
    const rect = { left: 300, top: 200, width: 40, height: 20, right: 340, bottom: 220 } as DOMRect;
    const pos = calculatePosition(
      rect,
      el,
      'top-start',
      8,
      true,
      'main',
      { width: 800, height: 600 },
      'rtl',
    );
    expect(pos.placement).toBe('top-end');
    expect(
      calculateArrowGeometry(
        rect,
        { left: pos.left, top: pos.top, width: 100, height: 50 },
        pos.placement,
        { size: 8 },
      ).alignment,
    ).toBe('end');
  });
});
