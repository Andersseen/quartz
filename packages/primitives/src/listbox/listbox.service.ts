import { DOCUMENT } from '@angular/common';
import { Injectable, inject } from '@angular/core';
import { CollectionStore } from '@quartz-headless/core';
import type { ListboxOptionDirective } from './listbox-option.directive';

/** Container-scoped registry and active-descendant state for qzListbox. */
@Injectable()
export class ListboxService {
  readonly #document = inject(DOCUMENT);
  readonly #collection = new CollectionStore<ListboxOptionDirective<unknown>>(
    { focusStrategy: 'aria-activedescendant' },
    this.#document,
  );

  readonly options = this.#collection.items;
  readonly enabledOptions = this.#collection.enabledItems;
  readonly activeId = this.#collection.activeId;
  readonly activeOption = this.#collection.activeItem;

  register(option: ListboxOptionDirective<unknown>): void {
    this.#collection.register(option);
  }

  unregister(option: ListboxOptionDirective<unknown>): void {
    this.#collection.unregister(option);
  }

  setActive(id: string | null): void {
    this.#collection.setActive(id);
  }

  configure(options: { orientation: 'vertical' | 'horizontal'; typeaheadTimeoutMs: number }): void {
    this.#collection.configure(options);
  }

  first(): void {
    this.#collection.first();
  }

  last(): void {
    this.#collection.last();
  }

  next(): void {
    this.#collection.next();
  }

  previous(): void {
    this.#collection.previous();
  }

  typeahead(character: string): void {
    this.#collection.typeahead(character);
  }

  destroy(): void {
    this.#collection.destroy();
  }
}
