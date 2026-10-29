import type { Signal } from '@angular/core';
import type {
  OverlayArrowGeometry,
  OverlayFlipAxis,
  OverlayPlacement,
} from '@quartz-headless/core';

export interface PopoverConfig {
  placement: OverlayPlacement;
  offset: number;
  flip: boolean;
  flipAxis: OverlayFlipAxis;
  matchAnchorWidth: boolean;
  closeOnEscape: boolean;
  closeOnClickOutside: boolean;
  autoFocus: boolean;
  /** Arrow length in px; unset means no arrow geometry. Default: unset. */
  arrowSize?: number;
  /** Minimum px between the arrow and either end of the popover edge. Default: 0 */
  arrowPadding?: number;
}

/**
 * Template context of the popover content (`let-arrow="arrow" let-placement="placement"
 * let-open="open"`). Values are signals so `OnPush`/zoneless templates stay in sync.
 */
export interface PopoverContext {
  /** Arrow geometry of the open popover; `null` until measured or without `arrowSize`. */
  readonly arrow: Signal<OverlayArrowGeometry | null>;
  /** Resolved physical placement after flip; `null` until measured. */
  readonly placement: Signal<OverlayPlacement | null>;
  /** Mirrors the trigger's open state (`true` while the content exists). */
  readonly open: Signal<boolean>;
}

export const DEFAULT_POPOVER_CONFIG: PopoverConfig = {
  placement: 'bottom-start',
  offset: 4,
  flip: true,
  flipAxis: 'main',
  matchAnchorWidth: false,
  closeOnEscape: true,
  closeOnClickOutside: true,
  autoFocus: false,
};
