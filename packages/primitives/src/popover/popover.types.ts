import type { OverlayFlipAxis, OverlayPlacement } from '@quartz-headless/core';

export interface PopoverConfig {
  placement: OverlayPlacement;
  offset: number;
  flip: boolean;
  flipAxis: OverlayFlipAxis;
  matchAnchorWidth: boolean;
  closeOnEscape: boolean;
  closeOnClickOutside: boolean;
  autoFocus: boolean;
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
