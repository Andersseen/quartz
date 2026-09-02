import { computed, signal } from '@angular/core';
import { inlineEndKey, inlineStartKey } from '../directionality';
import {
  DEFAULT_COLLECTION_CONFIG,
  type CollectionConfig,
  type CollectionItem,
  type CollectionNavigationResult,
} from './collection.types';

export class CollectionStore<T extends CollectionItem> {
  readonly #items = signal<T[]>([]);
  readonly #activeId = signal<string | null>(null);
  #typeahead = '';
  #typeaheadTimer: number | null = null;
  #config: CollectionConfig;
  #document: Document | null;

  readonly items = this.#items.asReadonly();
  readonly enabledItems = computed(() => this.#items().filter((item) => !isDisabled(item)));
  readonly activeItem = computed(
    () => this.enabledItems().find((item) => item.id === this.#activeId()) ?? null,
  );
  // Derived from activeItem, not a direct readonly view of #activeId: if the active item's
  // `disabled` accessor flips to true in place (no unregister, no explicit nav call),
  // activeItem reactively becomes null via enabledItems() filtering it out — but a plain
  // #activeId.asReadonly() would keep returning the stale, now-disabled id, producing a
  // public activeId/activeItem pair that disagree. This keeps them always consistent.
  readonly activeId = computed(() => this.activeItem()?.id ?? null);

  constructor(config: Partial<CollectionConfig> = {}, document: Document | null = null) {
    this.#config = { ...DEFAULT_COLLECTION_CONFIG, ...config };
    this.#document = document;
  }

  configure(config: Partial<CollectionConfig>): void {
    this.#config = { ...this.#config, ...config };
  }

  register(item: T): void {
    this.#items.update((items) => sortByDomOrder([...items, item]));
    if (this.#activeId() === null && !isDisabled(item)) {
      this.#activeId.set(item.id);
    }
  }

  unregister(item: T): void {
    const wasActive = this.#activeId() === item.id;
    this.#items.update((items) => items.filter((current) => current !== item));
    if (wasActive) {
      this.#activeId.set(this.enabledItems()[0]?.id ?? null);
    }
  }

  refreshOrder(): void {
    this.#items.update((items) => sortByDomOrder(items));
  }

  setActive(id: string | null, options: { focus?: boolean } = {}): void {
    if (id !== null) {
      const next = this.enabledItems().find((item) => item.id === id);
      if (!next) return;
    }
    this.#activeId.set(id);
    if (options.focus) this.focusActive();
  }

  first(options: { focus?: boolean } = {}): T | null {
    return this.#activate(this.enabledItems()[0] ?? null, options);
  }

  last(options: { focus?: boolean } = {}): T | null {
    const items = this.enabledItems();
    return this.#activate(items[items.length - 1] ?? null, options);
  }

  next(options: { focus?: boolean; wrap?: boolean } = {}): T | null {
    return this.#move(1, options);
  }

  previous(options: { focus?: boolean; wrap?: boolean } = {}): T | null {
    return this.#move(-1, options);
  }

  handleKeydown(event: KeyboardEvent, options: { focus?: boolean } = {}): boolean {
    const horizontal = this.#config.orientation === 'horizontal';
    const vertical = this.#config.orientation === 'vertical';
    const key = event.key;
    // Which physical arrow key means "next"/"previous" on the horizontal axis
    // depends on direction; vertical Up/Down never do. Defaults to ArrowRight/
    // ArrowLeft (ltr), matching this method's behavior before Directionality existed.
    const nextKey = inlineEndKey(this.#config.direction);
    const previousKey = inlineStartKey(this.#config.direction);

    if ((!horizontal && key === 'ArrowDown') || (!vertical && key === nextKey)) {
      event.preventDefault();
      this.next(options);
      return true;
    }

    if ((!horizontal && key === 'ArrowUp') || (!vertical && key === previousKey)) {
      event.preventDefault();
      this.previous(options);
      return true;
    }

    if (key === 'Home') {
      event.preventDefault();
      this.first(options);
      return true;
    }

    if (key === 'End') {
      event.preventDefault();
      this.last(options);
      return true;
    }

    if (key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      this.typeahead(key, options);
      return true;
    }

    return false;
  }

  typeahead(character: string, options: { focus?: boolean } = {}): T | null {
    const items = this.enabledItems();
    if (!items.length) return null;

    this.#typeahead += character.toLocaleLowerCase();
    const repeated = this.#typeahead.split('').every((char) => char === this.#typeahead[0]);
    const query = repeated ? this.#typeahead[0] : this.#typeahead;
    this.#clearTypeahead(false);

    const view = this.#document?.defaultView;
    if (view) {
      this.#typeaheadTimer = view.setTimeout(
        () => this.#clearTypeahead(),
        this.#config.typeaheadTimeoutMs,
      );
    }

    const result = findByTypeahead(items, this.#activeId(), query);
    return this.#activate(result.item, options);
  }

  activeTabIndex(id: string): 0 | -1 {
    if (this.#config.focusStrategy !== 'roving-tabindex') return -1;
    // Reads the reconciled activeItem rather than the raw private #activeId: if the active
    // item just became disabled in place, activeItem is already null here, so this falls
    // into the same "nothing active" fallback used on cold start, instead of keeping
    // tabindex=0 pinned on a now-disabled, unreachable element.
    const active = this.activeItem()?.id ?? null;
    if (active === null) return this.enabledItems()[0]?.id === id ? 0 : -1;
    return active === id ? 0 : -1;
  }

  focusActive(): void {
    if (this.#config.focusStrategy !== 'roving-tabindex') return;
    getElement(this.activeItem())?.focus();
  }

  destroy(): void {
    this.#clearTypeahead();
  }

  #move(direction: 1 | -1, options: { focus?: boolean; wrap?: boolean } = {}): T | null {
    const items = this.enabledItems();
    const result = findRelativeItem(items, this.#activeId(), direction, {
      wrap: options.wrap ?? this.#config.wrap,
    });
    return this.#activate(result.item, options);
  }

  #activate(item: T | null, options: { focus?: boolean } = {}): T | null {
    this.#activeId.set(item?.id ?? null);
    if (options.focus) this.focusActive();
    return item;
  }

  #clearTypeahead(reset = true): void {
    if (this.#typeaheadTimer !== null) {
      this.#document?.defaultView?.clearTimeout(this.#typeaheadTimer);
      this.#typeaheadTimer = null;
    }
    if (reset) this.#typeahead = '';
  }
}

export function findRelativeItem<T extends CollectionItem>(
  items: readonly T[],
  activeId: string | null,
  direction: 1 | -1,
  options: { wrap?: boolean } = {},
): CollectionNavigationResult<T> {
  const enabled = items.filter((item) => !isDisabled(item));
  if (!enabled.length) return { item: null, index: -1 };

  const current = enabled.findIndex((item) => item.id === activeId);
  if (current === -1) {
    const index = direction === 1 ? 0 : enabled.length - 1;
    return { item: enabled[index], index };
  }

  const next = current + direction;
  if (next >= 0 && next < enabled.length) return { item: enabled[next], index: next };
  if (!options.wrap) return { item: enabled[current], index: current };

  const index = direction === 1 ? 0 : enabled.length - 1;
  return { item: enabled[index], index };
}

export function firstItem<T extends CollectionItem>(
  items: readonly T[],
): CollectionNavigationResult<T> {
  const index = items.findIndex((item) => !isDisabled(item));
  return { item: index === -1 ? null : items[index], index };
}

export function lastItem<T extends CollectionItem>(
  items: readonly T[],
): CollectionNavigationResult<T> {
  for (let index = items.length - 1; index >= 0; index--) {
    if (!isDisabled(items[index])) return { item: items[index], index };
  }
  return { item: null, index: -1 };
}

export function findByTypeahead<T extends CollectionItem>(
  items: readonly T[],
  activeId: string | null,
  query: string,
): CollectionNavigationResult<T> {
  const enabled = items.filter((item) => !isDisabled(item));
  if (!enabled.length) return { item: null, index: -1 };

  const normalized = query.toLocaleLowerCase();
  const start = Math.max(
    0,
    enabled.findIndex((item) => item.id === activeId),
  );
  const offset = normalized.length === 1 ? 1 : 0;

  for (let step = 0; step < enabled.length; step++) {
    const index = (start + offset + step) % enabled.length;
    const item = enabled[index];
    if (getLabel(item).toLocaleLowerCase().startsWith(normalized)) {
      return { item, index };
    }
  }

  return { item: null, index: -1 };
}

export function sortByDomOrder<T extends CollectionItem>(items: readonly T[]): T[] {
  return [...items].sort((a, b) => compareDomOrder(getElement(a), getElement(b)));
}

export function compareDomOrder(a: HTMLElement | null, b: HTMLElement | null): number {
  if (!a || !b || a === b) return 0;
  const position = a.compareDocumentPosition(b);
  if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
  if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
  return 0;
}

export function isDisabled(item: CollectionItem | null): boolean {
  const disabled = item?.disabled;
  return typeof disabled === 'function' ? disabled() : (disabled ?? false);
}

export function getLabel(item: CollectionItem | null): string {
  const label = item?.label;
  return typeof label === 'function' ? label() : (label ?? '');
}

export function getElement(item: CollectionItem | null): HTMLElement | null {
  const element = item?.element;
  const resolved = typeof element === 'function' ? element() : element;
  return resolved ?? null;
}
