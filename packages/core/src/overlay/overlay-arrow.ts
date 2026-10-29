import type { OverlayPlacement } from './overlay.types';

/** A physical side of a rectangle. */
export type OverlaySide = 'top' | 'bottom' | 'left' | 'right';

export interface OverlayArrowOptions {
  /** Arrow length along the cross axis, in px (the consumer's rendered arrow width). Default: 0. */
  size?: number;
  /** Minimum distance in px kept between the arrow and either end of the surface edge. Default: 0. */
  padding?: number;
}

/**
 * Geometry for a consumer-rendered arrow. Quartz computes numbers only — no markup, colors or
 * dimensions. All values describe the surface *after* flip, alignment changes and viewport
 * clamping, so they never refer to the requested placement.
 */
export interface OverlayArrowGeometry {
  /** Resolved (physical) placement after flip. `-start`/`-end` are physical, also in RTL. */
  placement: OverlayPlacement;
  /** Side of the anchor the surface sits on (`top` placement → `top`). Same as Radix `data-side`. */
  side: OverlaySide;
  /** Edge of the surface that faces the anchor and carries the arrow (`top` placement → `bottom`). */
  edge: OverlaySide;
  /** Where the resolved placement aligns the surface to the anchor. */
  alignment: 'start' | 'center' | 'end';
  /** Axis the offsets run along: `x` for top/bottom placements, `y` for left/right. */
  axis: 'x' | 'y';
  /**
   * Px from the surface's start edge (left for `x`, top for `y`) to the arrow's start edge,
   * i.e. the value to bind to `left`/`top`. `null` when `available` is false.
   */
  offset: number | null;
  /** Px from the surface's cross-axis center to the arrow's center. `null` when unavailable. */
  centerOffset: number | null;
  /**
   * `false` when no safe arrow position exists: the arrow (plus padding) does not fit the
   * surface edge, the anchor does not overlap the surface along the cross axis, or a
   * measurement is not finite. Consumers should hide the arrow. Offsets are `null` then —
   * never `NaN` or `Infinity`.
   */
  available: boolean;
}

const EDGE_FACING_ANCHOR: Record<OverlaySide, OverlaySide> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

export function placementSide(placement: OverlayPlacement): OverlaySide {
  return placement.split('-')[0] as OverlaySide;
}

function placementAlignment(placement: OverlayPlacement): 'start' | 'center' | 'end' {
  if (placement.endsWith('-start')) return 'start';
  if (placement.endsWith('-end')) return 'end';
  return 'center';
}

/**
 * Computes the arrow position for a surface already positioned at `surface`.
 * `anchor` and `surface` are viewport-relative rectangles.
 */
export function calculateArrowGeometry(
  anchor: { left: number; top: number; width: number; height: number },
  surface: { left: number; top: number; width: number; height: number },
  placement: OverlayPlacement,
  options: OverlayArrowOptions = {},
): OverlayArrowGeometry {
  const side = placementSide(placement);
  const horizontal = side === 'top' || side === 'bottom';
  const size = options.size ?? 0;
  const padding = options.padding ?? 0;

  const anchorStart = horizontal ? anchor.left : anchor.top;
  const anchorLength = horizontal ? anchor.width : anchor.height;
  const surfaceStart = horizontal ? surface.left : surface.top;
  const surfaceLength = horizontal ? surface.width : surface.height;

  const base = {
    placement,
    side,
    edge: EDGE_FACING_ANCHOR[side],
    alignment: placementAlignment(placement),
    axis: horizontal ? ('x' as const) : ('y' as const),
  };
  const unavailable: OverlayArrowGeometry = {
    ...base,
    offset: null,
    centerOffset: null,
    available: false,
  };

  const measures = [anchorStart, anchorLength, surfaceStart, surfaceLength, size, padding];
  if (!measures.every(Number.isFinite) || size < 0 || padding < 0 || surfaceLength <= 0) {
    return unavailable;
  }
  // The anchor must touch the surface's cross-axis range, otherwise the arrow would point at
  // nothing (a viewport-clamped surface slid completely past its anchor).
  if (anchorStart + anchorLength < surfaceStart || anchorStart > surfaceStart + surfaceLength) {
    return unavailable;
  }

  const min = padding + size / 2;
  const max = surfaceLength - padding - size / 2;
  if (max < min) return unavailable;

  const anchorCenter = anchorStart + anchorLength / 2 - surfaceStart;
  const center = Math.min(Math.max(anchorCenter, min), max);
  return {
    ...base,
    offset: center - size / 2,
    centerOffset: center - surfaceLength / 2,
    available: true,
  };
}
