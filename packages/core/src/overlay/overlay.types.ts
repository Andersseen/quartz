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
  /** Which axis to flip on. Default: 'main' */
  flipAxis: OverlayFlipAxis;
  /** Close when user clicks outside the overlay. Default: true */
  closeOnClickOutside: boolean;
  /** Close on Escape key. Default: true */
  closeOnEscape: boolean;
  /** Close when the trigger's scroll parent scrolls. Default: true */
  closeOnScroll: boolean;
  /** Whether to match the anchor's width. Default: false */
  matchAnchorWidth: boolean;
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
  placement: OverlayPlacement;
}
