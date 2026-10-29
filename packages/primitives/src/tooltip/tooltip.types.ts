import type { Signal } from '@angular/core';
import type { OverlayArrowGeometry, OverlayPlacement } from '@quartz-headless/core';

export type TooltipPlacement = OverlayPlacement;

export interface TooltipConfig {
  /** Placement relative to the anchor element. Default: 'top' */
  placement: TooltipPlacement;
  /** Gap in px between anchor and tooltip. Default: 8 */
  offset: number;
  /** Delay in ms before showing the tooltip. Default: 300 */
  showDelay: number;
  /** Delay in ms before hiding the tooltip. Default: 100 */
  hideDelay: number;
  /** Whether the tooltip is disabled. Default: false */
  disabled: boolean;
  /**
   * Opts into arrow geometry: the rendered arrow's length in px along the tooltip edge.
   * Unset means no arrow data. Default: unset.
   */
  arrowSize?: number;
  /** Minimum px between the arrow and either end of the tooltip edge. Default: 0 */
  arrowPadding?: number;
}

/**
 * Template context of a `TemplateRef` tooltip (`let-arrow="arrow" let-placement="placement"`). Values are
 * signals so an `OnPush`/zoneless template stays in sync after flips and repositioning.
 */
export interface TooltipContext {
  /** Arrow geometry of the open tooltip; `null` until measured or when no arrow size is set. */
  readonly arrow: Signal<OverlayArrowGeometry | null>;
  /** Resolved physical placement after flip; `null` until measured. */
  readonly placement: Signal<TooltipPlacement | null>;
}

export const DEFAULT_TOOLTIP_CONFIG: TooltipConfig = {
  placement: 'top',
  offset: 8,
  showDelay: 300,
  hideDelay: 100,
  disabled: false,
};
