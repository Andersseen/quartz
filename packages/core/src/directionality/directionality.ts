import type {
  Direction,
  InlineArrowKey,
  LogicalInlineDirection,
  PhysicalHorizontal,
} from './directionality.types';

/**
 * Resolves the effective direction for an element by walking up to the nearest
 * ancestor (including itself) that carries a `dir` attribute — the same
 * resolution `<html dir="rtl">` and a subtree-overriding `<div dir="rtl">` get
 * from the browser. Falls back to `'ltr'` when nothing in the chain sets it. `dir="auto"` and
 * other invalid values are skipped (inherit from the next ancestor).
 *
 * Deliberately attribute-based rather than `getComputedStyle`-based: it needs
 * nothing beyond `Element.closest`/`getAttribute`, which server-side DOM
 * implementations provide too, so this stays correct during SSR without a
 * `document`/`window` guard.
 */
export function resolveDirection(element: Element | null | undefined): Direction {
  // Only valid values participate: `dir="auto"` or a typo is ignored by the browser (the
  // element inherits), so the walk continues upward instead of stopping at it. A manual walk
  // (not a `[dir="rtl" i]` selector) keeps this working in server DOM implementations with
  // limited selector support.
  for (let node: Element | null | undefined = element; node; node = node.parentElement) {
    const value = node.getAttribute?.('dir')?.toLowerCase();
    if (value === 'rtl' || value === 'ltr') return value;
  }
  return 'ltr';
}

/** The other direction. */
export function oppositeDirection(direction: Direction): Direction {
  return direction === 'ltr' ? 'rtl' : 'ltr';
}

/** Converts a logical inline position to the physical side it renders on for `direction`. */
export function inlineToPhysical(
  direction: Direction,
  logical: LogicalInlineDirection,
): PhysicalHorizontal {
  const isStart = logical === 'inline-start';
  if (direction === 'ltr') return isStart ? 'left' : 'right';
  return isStart ? 'right' : 'left';
}

/** Converts a physical side back to the logical inline position it represents for `direction`. */
export function physicalToInline(
  direction: Direction,
  physical: PhysicalHorizontal,
): LogicalInlineDirection {
  const isLeft = physical === 'left';
  if (direction === 'ltr') return isLeft ? 'inline-start' : 'inline-end';
  return isLeft ? 'inline-end' : 'inline-start';
}

/** The arrow key that moves toward inline-start (the reading direction's beginning) for `direction`. */
export function inlineStartKey(direction: Direction): InlineArrowKey {
  return direction === 'ltr' ? 'ArrowLeft' : 'ArrowRight';
}

/** The arrow key that moves toward inline-end (the reading direction's end) for `direction`. */
export function inlineEndKey(direction: Direction): InlineArrowKey {
  return direction === 'ltr' ? 'ArrowRight' : 'ArrowLeft';
}

/**
 * Classifies a keyboard event's key as an inline-start/inline-end move for `direction`,
 * or `null` when it's not a horizontal arrow key at all. Widget-agnostic: callers decide
 * what "start"/"end" means for their own navigation model.
 */
export function resolveInlineArrowKey(
  direction: Direction,
  key: string,
): LogicalInlineDirection | null {
  if (key === inlineStartKey(direction)) return 'inline-start';
  if (key === inlineEndKey(direction)) return 'inline-end';
  return null;
}
