import type { Direction } from '../directionality';

export type CollectionOrientation = 'vertical' | 'horizontal' | 'both';
export type CollectionFocusStrategy = 'roving-tabindex' | 'aria-activedescendant';

export interface CollectionItem {
  id: string;
  element?: HTMLElement | null | (() => HTMLElement | null | undefined);
  disabled?: boolean | (() => boolean);
  label?: string | (() => string);
}

export interface CollectionConfig {
  orientation: CollectionOrientation;
  wrap: boolean;
  focusStrategy: CollectionFocusStrategy;
  typeaheadTimeoutMs: number;
  /**
   * Direction used to resolve which arrow key moves "next"/"previous" on the
   * horizontal axis (see `handleKeydown`). Vertical Up/Down are never affected.
   * Defaults to `'ltr'`, which reproduces the historical (pre-Directionality)
   * behaviour byte-for-byte: ArrowRight → next, ArrowLeft → previous.
   */
  direction: Direction;
}

export const DEFAULT_COLLECTION_CONFIG: CollectionConfig = {
  orientation: 'vertical',
  wrap: true,
  focusStrategy: 'aria-activedescendant',
  typeaheadTimeoutMs: 500,
  direction: 'ltr',
};

export interface CollectionNavigationResult<T extends CollectionItem> {
  item: T | null;
  index: number;
}
