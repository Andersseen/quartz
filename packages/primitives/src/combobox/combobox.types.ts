import type { OverlayFlipAxis, OverlayPlacement } from '@quartz-headless/core';

export type ComboboxAutocomplete = 'none' | 'list';
export type ComboboxOpenReason = 'focus' | 'input' | 'keyboard' | 'trigger' | 'programmatic';
export type ComboboxCloseReason =
  | 'escape'
  | 'selection'
  | 'outside-pointer'
  | 'focus-outside'
  | 'tab'
  | 'scroll'
  | 'programmatic';

export type ComboboxFilter<T> = (option: T, query: string, label: string) => boolean;
export type ComboboxDisplayWith<T> = (value: T) => string;
export type ComboboxCompareWith<T> = (a: T, b: T) => boolean;

export interface ComboboxConfig<T> {
  placement: OverlayPlacement;
  offset: number;
  flip: boolean;
  flipAxis: OverlayFlipAxis;
  matchAnchorWidth: boolean;
  autocomplete: ComboboxAutocomplete;
  openOnFocus: boolean;
  openOnTyping: boolean;
  closeOnSelect: boolean;
  closeOnEscape: boolean;
  closeOnOutsidePointer: boolean;
  closeOnFocusOutside: boolean;
  closeOnScroll: boolean;
  allowFreeform: boolean;
  resetActiveOnClose: boolean;
  filter: ComboboxFilter<T> | null;
}

export const defaultComboboxDisplayWith = <T>(value: T): string =>
  value == null ? '' : String(value);

export const defaultComboboxFilter = <T>(_option: T, query: string, label: string): boolean => {
  const normalized = query.trim().toLocaleLowerCase();
  if (!normalized) return true;
  return label.toLocaleLowerCase().includes(normalized);
};

export const DEFAULT_COMBOBOX_CONFIG: ComboboxConfig<unknown> = {
  placement: 'bottom-start',
  offset: 4,
  flip: true,
  flipAxis: 'main',
  matchAnchorWidth: true,
  autocomplete: 'list',
  openOnFocus: false,
  openOnTyping: true,
  closeOnSelect: true,
  closeOnEscape: true,
  closeOnOutsidePointer: true,
  closeOnFocusOutside: true,
  closeOnScroll: false,
  allowFreeform: false,
  resetActiveOnClose: true,
  filter: defaultComboboxFilter,
};
