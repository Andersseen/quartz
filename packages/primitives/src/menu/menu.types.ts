import type { CollectionItem } from '@quartz-headless/core';

export interface MenuConfig {
  /** Wrap arrow navigation past the first/last enabled item. Default: true. */
  wrap: boolean;
  /** Milliseconds a typeahead query stays active. Default: 500. */
  typeaheadTimeoutMs: number;
  /** Pointer hover-intent delay before opening a submenu. Default: 100. */
  submenuOpenDelayMs: number;
}

export const DEFAULT_MENU_CONFIG: MenuConfig = {
  wrap: true,
  typeaheadTimeoutMs: 500,
  submenuOpenDelayMs: 100,
};

export interface MenuCollectionEntry extends CollectionItem {
  activate(): void;
  openSubmenu?(options?: { focusFirst?: boolean }): void;
  closeSubmenu?(restoreFocus?: boolean): void;
  hasSubmenu?(): boolean;
}
