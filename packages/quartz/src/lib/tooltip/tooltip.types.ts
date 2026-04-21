import type { OverlayPlacement } from '../overlay';

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
  /** Whether to allow hovering the tooltip content. Default: false */
  interactive: boolean;
}

export const DEFAULT_TOOLTIP_CONFIG: TooltipConfig = {
  placement: 'top',
  offset: 8,
  showDelay: 300,
  hideDelay: 100,
  disabled: false,
  interactive: false,
};
