import { Injectable, signal } from '@angular/core';
import type { ListboxOptionDirective } from './listbox-option.directive';

/** Container-scoped registry and active-descendant state for qzListbox. */
@Injectable()
export class ListboxService {
  #options = signal<ListboxOptionDirective<unknown>[]>([]);
  #activeId = signal<string | null>(null);

  readonly options = this.#options.asReadonly();
  readonly activeId = this.#activeId.asReadonly();

  register(option: ListboxOptionDirective<unknown>): void {
    this.#options.update((options) => [...options, option]);
    if (this.#activeId() === null && !option.optionDisabled()) {
      this.#activeId.set(option.id);
    }
  }

  unregister(option: ListboxOptionDirective<unknown>): void {
    this.#options.update((options) => options.filter((current) => current !== option));
    if (this.#activeId() === option.id) {
      this.#activeId.set(this.#options().find((current) => !current.optionDisabled())?.id ?? null);
    }
  }

  setActive(id: string | null): void {
    this.#activeId.set(id);
  }
}
