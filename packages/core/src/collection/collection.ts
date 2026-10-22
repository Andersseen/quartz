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
  #typeaheadTimer: ReturnType<typeof setTimeout> | null = null;
  #destroyed = false;
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

  /**
   * Registers `item` in DOM order. Registering the same object (or another object with the
   * same `id`) again replaces the earlier entry instead of duplicating it.
   */
  register(item: T): void {
    this.#items.update((items) => {
      // Replace in place so element-less items (no DOM order to re-derive) keep their slot.
      const existing = items.findIndex((c) => c === item || c.id === item.id);
      const next = [...items];
      if (existing === -1) next.push(item);
      else next[existing] = item;
      return sortByDomOrder(next);
    });
    if (this.#activeId() === null && !isDisabled(item)) {
      this.#activeId.set(item.id);
    }
  }

  /**
   * Removes `item`. If it was active, activation moves to the nearest enabled neighbour:
   * the item that now occupies its position (its next sibling) first, otherwise the previous
   * one, otherwise nothing.
   */
  unregister(item: T): void {
    const before = this.#items();
    const index = before.indexOf(item);
    if (index === -1) return;
    const wasActive = this.#activeId() === item.id;
    this.#items.set(before.filter((current) => current !== item));
    if (wasActive) {
      this.#activeId.set(this.#nearestEnabled(index)?.id ?? null);
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
    if (this.#destroyed) return null;
    const items = this.enabledItems();
    if (!items.length) return null;

    this.#typeahead += character.toLocaleLowerCase();
    const repeated = this.#typeahead.split('').every((char) => char === this.#typeahead[0]);
    const query = repeated ? this.#typeahead[0] : this.#typeahead;
    this.#clearTypeahead(false);

    // Works without a Document too (plain `setTimeout`), so the buffer always expires.
    const view = this.#document?.defaultView;
    this.#typeaheadTimer = (view ?? globalThis).setTimeout(
      () => this.#clearTypeahead(),
      this.#config.typeaheadTimeoutMs,
    );

    const result = findByTypeahead(items, this.#activeId(), query);
    // No match keeps the current active item: a stray key must not drop the user's position.
    return result.item ? this.#activate(result.item, options) : null;
  }

  activeTabIndex(id: string): 0 | -1 {
    if (this.#config.focusStrategy !== 'roving-tabindex') return -1;
    // Reads the reconciled activeItem rather than the raw private #activeId: if the active
    // item just became disabled in place, activeItem is already null here, so this falls
    // into the same "nothing active" fallback used on cold start, instead of keeping
    // tabindex=0 pinned on a now-disabled, unreachable element.
    const active = this.activeItem()?.id ?? null;
    if (active === null) return this.#fallbackItem()?.id === id ? 0 : -1;
    return active === id ? 0 : -1;
  }

  focusActive(): void {
    if (this.#config.focusStrategy !== 'roving-tabindex') return;
    getElement(this.activeItem())?.focus();
  }

  destroy(): void {
    this.#destroyed = true;
    this.#clearTypeahead();
  }

  /** Enabled item closest to `index` in the current list: the one at/after it, else before. */
  #nearestEnabled(index: number): T | null {
    const items = this.#items();
    for (let i = index; i < items.length; i++) if (!isDisabled(items[i])) return items[i];
    for (let i = Math.min(index, items.length) - 1; i >= 0; i--) {
      if (!isDisabled(items[i])) return items[i];
    }
    return null;
  }

  /**
   * Where the tab stop / next navigation should land when no item is currently active: the
   * enabled neighbour of an active item that was disabled in place, otherwise the first enabled.
   */
  #fallbackItem(): T | null {
    const index = this.#items().findIndex((item) => item.id === this.#activeId());
    return index === -1 ? (this.enabledItems()[0] ?? null) : this.#nearestEnabled(index);
  }

  #move(direction: 1 | -1, options: { focus?: boolean; wrap?: boolean } = {}): T | null {
    const result = findRelativeItem(this.#items(), this.#activeId(), direction, {
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
      (this.#document?.defaultView ?? globalThis).clearTimeout(this.#typeaheadTimer);
      this.#typeaheadTimer = null;
    }
    if (reset) this.#typeahead = '';
  }
}

/**
 * Next/previous enabled item relative to `activeId`. If `activeId` is itself disabled (or
 * was disabled in place), movement starts from its position, so the neighbour in the requested
 * direction is chosen rather than jumping to an end. Unknown/`null` ids start from the first
 * (forward) or last (backward) enabled item.
 */
export function findRelativeItem<T extends CollectionItem>(
  items: readonly T[],
  activeId: string | null,
  direction: 1 | -1,
  options: { wrap?: boolean } = {},
): CollectionNavigationResult<T> {
  const enabled = items.filter((item) => !isDisabled(item));
  if (!enabled.length) return { item: null, index: -1 };

  const edge = direction === 1 ? 0 : enabled.length - 1;
  const position = items.findIndex((item) => item.id === activeId);
  if (position === -1) return { item: enabled[edge], index: edge };

  const current = enabled.findIndex((item) => item.id === activeId);
  let next: number;
  if (current !== -1) {
    next = current + direction;
  } else if (direction === 1) {
    // Disabled active: first enabled item after its position.
    next = enabled.findIndex((item) => items.indexOf(item) > position);
    if (next === -1) next = enabled.length;
  } else {
    let before = -1;
    enabled.forEach((item, i) => {
      if (items.indexOf(item) < position) before = i;
    });
    next = before;
  }

  if (next >= 0 && next < enabled.length) return { item: enabled[next], index: next };
  if (!options.wrap) {
    // Clamp: stay on the active item, or — if it is disabled — on the enabled item nearest
    // to the boundary that was hit.
    const clamped = current !== -1 ? current : direction === 1 ? enabled.length - 1 : 0;
    return { item: enabled[clamped], index: clamped };
  }
  return { item: enabled[edge], index: edge };
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
