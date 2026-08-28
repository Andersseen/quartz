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
