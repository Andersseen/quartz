import type { OverlayArrowGeometry } from './overlay-arrow';

export type OverlayPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

export type OverlayFlipAxis = 'main' | 'cross' | 'both' | 'none';

export interface OverlayConfig {
  /** Placement relative to the anchor element. Default: 'bottom-start' */
  placement: OverlayPlacement;
  /** Gap in px between anchor and overlay. Default: 4 */
  offset: number;
  /** Whether to flip placement when there's not enough space. Default: true */
  flip: boolean;
  /**
   * Which alternatives `flip` may try when the placement overflows the viewport.
   * `main`: opposite side. `cross`: opposite alignment on the same side (`-start` ↔ `-end`).
   * `both`: opposite side, then opposite alignment, then both. `none`: never flip.
   * Default: 'main'
   */
  flipAxis: OverlayFlipAxis;
  /** Close when user clicks outside the overlay. Default: true */
  closeOnClickOutside: boolean;
  /** Close on Escape key. Default: true */
  closeOnEscape: boolean;
  /** Close when the trigger's scroll parent scrolls. Default: true */
  closeOnScroll: boolean;
  /** Whether to match the anchor's width. Default: false */
  matchAnchorWidth: boolean;
  /**
   * Opts the overlay into arrow geometry: the rendered arrow's length in px along the surface
   * edge. When set (even to `0`), every position update carries `arrow` and the surface gets
   * `data-side`, `data-placement`, `--qz-arrow-x` and `--qz-arrow-y`. Default: unset (no arrow).
   */
  arrowSize?: number;
  /** Minimum px between the arrow and either end of the surface edge. Default: 0. */
  arrowPadding?: number;
  /**
   * Template context passed to `createEmbeddedView` (available as `let-` variables).
   * Default: no context.
   */
  context?: object;
}

export interface OverlayVirtualAnchor {
  /** Viewport-relative x coordinate, usually MouseEvent.clientX */
  x: number;
  /** Viewport-relative y coordinate, usually MouseEvent.clientY */
  y: number;
  /** Optional virtual anchor width. Default: 0 */
  width?: number;
  /** Optional virtual anchor height. Default: 0 */
  height?: number;
}

export type OverlayAnchor = HTMLElement | OverlayVirtualAnchor;

export const DEFAULT_OVERLAY_CONFIG: OverlayConfig = {
  placement: 'bottom-start',
  offset: 4,
  flip: true,
  flipAxis: 'main',
  closeOnClickOutside: true,
  closeOnEscape: true,
  closeOnScroll: true,
  matchAnchorWidth: false,
};

export interface OverlayPosition {
  top: number;
  left: number;
  /** Resolved physical placement after flip. */
  placement: OverlayPlacement;
  /** Present only when the overlay was created with `arrowSize`. */
  arrow?: OverlayArrowGeometry;
}
