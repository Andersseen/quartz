import type { OverlayFlipAxis, OverlayPlacement } from '@quartz-headless/core';

export type SelectOpenReason = 'keyboard' | 'pointer' | 'programmatic';
export type SelectCloseReason =
  | 'selection'
  | 'escape'
  | 'outside-pointer'
  | 'focus-outside'
  | 'tab'
  | 'scroll'
  | 'programmatic';

export interface SelectConfig<T> {
  placement: OverlayPlacement;
  offset: number;
  flip: boolean;
  flipAxis: OverlayFlipAxis;
  matchAnchorWidth: boolean;
  closeOnEscape: boolean;
  closeOnOutsidePointer: boolean;
  closeOnFocusOutside: boolean;
  closeOnScroll: boolean;
  typeaheadTimeoutMs: number;
  compareWith: (a: T, b: T) => boolean;
  displayWith: (value: T) => string;
}

export const DEFAULT_SELECT_CONFIG: SelectConfig<unknown> = {
  placement: 'bottom-start',
  offset: 4,
  flip: true,
  flipAxis: 'both',
  matchAnchorWidth: true,
  closeOnEscape: true,
  closeOnOutsidePointer: true,
  closeOnFocusOutside: true,
  closeOnScroll: true,
  typeaheadTimeoutMs: 500,
  compareWith: Object.is,
  displayWith: (value) => String(value ?? ''),
};
