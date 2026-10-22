import { describe, it, expect } from 'vitest';
import { calculatePosition } from './overlay-position';

function overlayEl(width: number, height: number): HTMLElement {
  return { offsetWidth: width, offsetHeight: height } as unknown as HTMLElement;
}

const ANCHOR = new DOMRect(100, 100, 50, 20); // left:100 top:100 right:150 bottom:120
const VIEWPORT = { width: 1200, height: 800 };

describe('calculatePosition — direction', () => {
  it('defaults to ltr when direction is omitted (unchanged pre-Directionality behavior)', () => {
    const withDirection = calculatePosition(
      ANCHOR,
      overlayEl(80, 30),
      'bottom-start',
      4,
      false,
      'main',
      VIEWPORT,
      'ltr',
    );
    const omitted = calculatePosition(
      ANCHOR,
      overlayEl(80, 30),
      'bottom-start',
      4,
      false,
      'main',
      VIEWPORT,
    );
    expect(omitted).toEqual(withDirection);
  });

  it('ltr: bottom-start aligns to the anchor left edge (physical left)', () => {
    const pos = calculatePosition(
      ANCHOR,
      overlayEl(80, 30),
      'bottom-start',
      4,
      false,
      'main',
      VIEWPORT,
      'ltr',
    );
    expect(pos.left).toBe(ANCHOR.left);
    expect(pos.top).toBe(ANCHOR.bottom + 4);
    expect(pos.placement).toBe('bottom-start');
  });

  it('rtl: bottom-start aligns to the anchor right edge instead (mirrors to physical right)', () => {
    const pos = calculatePosition(
      ANCHOR,
      overlayEl(80, 30),
      'bottom-start',
      4,
      false,
      'main',
      VIEWPORT,
      'rtl',
    );
    expect(pos.left).toBe(ANCHOR.right - 80);
    expect(pos.top).toBe(ANCHOR.bottom + 4);
    // Reports the physical placement actually used, matching what 'bottom-end' means in ltr.
    expect(pos.placement).toBe('bottom-end');
  });

  it('rtl: bottom-end aligns to the anchor left edge (mirror of bottom-start)', () => {
    const pos = calculatePosition(
      ANCHOR,
      overlayEl(80, 30),
      'bottom-end',
      4,
      false,
      'main',
      VIEWPORT,
      'rtl',
    );
    expect(pos.left).toBe(ANCHOR.left);
    expect(pos.placement).toBe('bottom-start');
  });

  it('rtl: top-start/top-end mirror the same way as bottom-start/bottom-end', () => {
    const start = calculatePosition(
      ANCHOR,
      overlayEl(80, 30),
      'top-start',
      4,
      false,
      'main',
      VIEWPORT,
      'rtl',
    );
    const end = calculatePosition(
      ANCHOR,
      overlayEl(80, 30),
      'top-end',
      4,
      false,
      'main',
      VIEWPORT,
      'rtl',
    );
    expect(start.left).toBe(ANCHOR.right - 80);
    expect(end.left).toBe(ANCHOR.left);
  });

  it('centered top/bottom placements are direction-independent', () => {
    const ltr = calculatePosition(
      ANCHOR,
      overlayEl(80, 30),
      'bottom',
      4,
      false,
      'main',
      VIEWPORT,
      'ltr',
    );
    const rtl = calculatePosition(
      ANCHOR,
      overlayEl(80, 30),
      'bottom',
      4,
      false,
      'main',
      VIEWPORT,
      'rtl',
    );
    expect(ltr).toEqual(rtl);
  });

  it('left/right placements (and their vertical -start/-end) are always physical, never mirrored', () => {
    for (const placement of [
      'left',
      'left-start',
      'left-end',
      'right',
      'right-start',
      'right-end',
    ] as const) {
      const ltr = calculatePosition(
        ANCHOR,
        overlayEl(80, 30),
        placement,
        4,
        false,
        'main',
        VIEWPORT,
        'ltr',
      );
      const rtl = calculatePosition(
        ANCHOR,
        overlayEl(80, 30),
        placement,
        4,
        false,
        'main',
        VIEWPORT,
        'rtl',
      );
      expect(rtl).toEqual(ltr);
    }
  });

  it('flip still resolves off the direction-mirrored physical placement', () => {
    // Anchor near the top of a short viewport: 'top-start' has no room above, must flip to bottom.
    const nearTopAnchor = new DOMRect(100, 5, 50, 20);
    const pos = calculatePosition(
      nearTopAnchor,
      overlayEl(80, 30),
      'top-start',
      4,
      true,
      'main',
      VIEWPORT,
      'rtl',
    );
    // top-start under rtl resolves to physical top-end, which flips to bottom-end.
    expect(pos.placement).toBe('bottom-end');
    expect(pos.top).toBe(nearTopAnchor.bottom + 4);
  });
});

describe('calculatePosition — flipAxis and geometry limits', () => {
  const vp = { width: 400, height: 300 };
  const run = (
    anchor: DOMRect,
    size: [number, number],
    placement: Parameters<typeof calculatePosition>[2],
    axis: Parameters<typeof calculatePosition>[5],
    direction: 'ltr' | 'rtl' = 'ltr',
    viewport = vp,
  ) => calculatePosition(anchor, overlayEl(...size), placement, 4, true, axis, viewport, direction);

  it('main: flips to the opposite side when the preferred side overflows', () => {
    // Anchor at the bottom: nothing fits below.
    const anchor = new DOMRect(100, 270, 50, 20);
    expect(run(anchor, [80, 100], 'bottom-start', 'main').placement).toBe('top-start');
  });

  it('main: does not change alignment when the cross axis overflows', () => {
    // Anchor near the right edge: bottom-start overflows horizontally, main flip cannot help.
    const anchor = new DOMRect(360, 50, 30, 20);
    const pos = run(anchor, [80, 40], 'bottom-start', 'main');
    expect(pos.placement).toBe('bottom-start');
    expect(pos.left).toBe(400 - 80 - 8); // clamped
  });

  it('cross: flips alignment (start → end) when the cross axis overflows', () => {
    const anchor = new DOMRect(320, 50, 30, 20);
    const pos = run(anchor, [80, 40], 'bottom-start', 'cross');
    expect(pos.placement).toBe('bottom-end');
    expect(pos.left).toBe(350 - 80);
  });

  it('cross: never flips the side', () => {
    const anchor = new DOMRect(100, 270, 50, 20);
    expect(run(anchor, [80, 100], 'bottom-start', 'cross').placement).toBe('bottom-start');
  });

  it('cross: leaves centered placements unchanged', () => {
    const anchor = new DOMRect(380, 50, 10, 20);
    expect(run(anchor, [80, 40], 'bottom', 'cross').placement).toBe('bottom');
  });

  it('both: finds the first fitting candidate across side and alignment', () => {
    // Bottom-right corner: only top-end fits.
    const anchor = new DOMRect(340, 270, 30, 20);
    expect(run(anchor, [80, 100], 'bottom-start', 'both').placement).toBe('top-end');
  });

  it('none: never flips, even when flip is true', () => {
    const anchor = new DOMRect(100, 270, 50, 20);
    expect(run(anchor, [80, 100], 'bottom-start', 'none').placement).toBe('bottom-start');
  });

  it('rtl: cross flip operates on the mirrored physical placement', () => {
    // rtl bottom-start renders as bottom-end (right-aligned); near the left edge it overflows
    // to the left and cross-flips to physical bottom-start.
    const anchor = new DOMRect(10, 50, 30, 20);
    expect(run(anchor, [80, 40], 'bottom-start', 'cross', 'rtl').placement).toBe('bottom-start');
  });

  it('clamps oversized content deterministically to the start margin', () => {
    const pos = run(new DOMRect(100, 100, 50, 20), [500, 400], 'bottom-start', 'main');
    expect(pos.left).toBe(8);
    expect(pos.top).toBe(8);
  });
});
