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
}

export const DEFAULT_COLLECTION_CONFIG: CollectionConfig = {
  orientation: 'vertical',
  wrap: true,
  focusStrategy: 'aria-activedescendant',
  typeaheadTimeoutMs: 500,
};

export interface CollectionNavigationResult<T extends CollectionItem> {
  item: T | null;
  index: number;
}
