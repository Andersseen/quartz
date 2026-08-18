export type ListboxOrientation = 'vertical' | 'horizontal';

export interface ListboxConfig {
  /** Milliseconds a type-ahead query stays active. Default: 500. */
  typeaheadTimeoutMs: number;
}

export const DEFAULT_LISTBOX_CONFIG: ListboxConfig = {
  typeaheadTimeoutMs: 500,
};
