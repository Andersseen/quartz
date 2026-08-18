import {
  booleanAttribute,
  Directive,
  input,
  model,
  computed,
  inject,
  OnDestroy,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ListboxService } from './listbox.service';
import {
  DEFAULT_LISTBOX_CONFIG,
  type ListboxConfig,
  type ListboxOrientation,
} from './listbox.types';
import type { ListboxOptionDirective } from './listbox-option.directive';

@Directive({
  selector: '[qzListbox]',
  exportAs: 'qzListbox',
  standalone: true,
  providers: [ListboxService],
  host: {
    '[attr.role]': '"listbox"',
    '[attr.tabindex]': 'disabled() ? -1 : 0',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.aria-multiselectable]': 'multiple() ? true : null',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.aria-activedescendant]': 'activeId()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class ListboxDirective<T> implements OnDestroy {
  private readonly service = inject(ListboxService);
  private readonly document = inject(DOCUMENT);

  /** Selected value. Supports Angular two-way binding: [(value)]="selection". */
  readonly value = model<T | T[] | null>(null);
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly orientation = input<ListboxOrientation>('vertical');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly config = input<Partial<ListboxConfig>>({});
  /** Equality function for object values. Defaults to Object.is. */
  readonly compareWith = input<(a: T, b: T) => boolean>(Object.is);

  readonly activeId = this.service.activeId;
  readonly activeOption = computed(
    () => this.enabledOptions().find((option) => option.id === this.activeId()) ?? null,
  );

  private typeahead = '';
  private typeaheadTimer: number | null = null;

  register(option: ListboxOptionDirective<T>): void {
    this.service.register(option as ListboxOptionDirective<unknown>);
  }

  unregister(option: ListboxOptionDirective<T>): void {
    this.service.unregister(option as ListboxOptionDirective<unknown>);
  }

  setActive(option: ListboxOptionDirective<T>): void {
    if (!option.optionDisabled()) this.service.setActive(option.id);
  }

  isSelected(option: ListboxOptionDirective<T>): boolean {
    const value = this.value();
    if (this.multiple()) {
      return Array.isArray(value) && value.some((item) => this.compareWith()(item, option.value()));
    }
    return !Array.isArray(value) && value !== null && this.compareWith()(value, option.value());
  }

  select(option: ListboxOptionDirective<T>): void {
    if (this.disabled() || option.optionDisabled()) return;
    this.setActive(option);
    const optionValue = option.value();
    if (!this.multiple()) {
      this.value.set(optionValue);
      return;
    }
    const selected = this.value();
    const current: T[] = Array.isArray(selected) ? [...(selected as T[])] : [];
    const index = current.findIndex((item) => this.compareWith()(item, optionValue));
    if (index === -1) current.push(optionValue);
    else current.splice(index, 1);
    this.value.set(current);
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const horizontal = this.orientation() === 'horizontal';
    switch (event.key) {
      case horizontal ? 'ArrowRight' : 'ArrowDown':
        event.preventDefault();
        this.moveActive(1);
        return;
      case horizontal ? 'ArrowLeft' : 'ArrowUp':
        event.preventDefault();
        this.moveActive(-1);
        return;
      case 'Home':
        event.preventDefault();
        this.service.setActive(this.enabledOptions()[0]?.id ?? null);
        return;
      case 'End':
        event.preventDefault();
        this.service.setActive(this.enabledOptions().at(-1)?.id ?? null);
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.activeOption()) this.select(this.activeOption()! as ListboxOptionDirective<T>);
        return;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          this.search(event.key);
        }
    }
  }

  ngOnDestroy(): void {
    this.clearTypeahead();
  }

  private enabledOptions(): ListboxOptionDirective<unknown>[] {
    return this.service.options().filter((option) => !option.optionDisabled());
  }

  private moveActive(direction: 1 | -1): void {
    const options = this.enabledOptions();
    if (!options.length) return;
    const current = options.findIndex((option) => option.id === this.activeId());
    const next =
      current === -1
        ? direction === 1
          ? 0
          : options.length - 1
        : (current + direction + options.length) % options.length;
    this.service.setActive(options[next].id);
  }

  private search(character: string): void {
    const options = this.enabledOptions();
    if (!options.length) return;
    this.typeahead += character.toLocaleLowerCase();
    this.clearTypeahead(false);
    const timeout = this.config().typeaheadTimeoutMs ?? DEFAULT_LISTBOX_CONFIG.typeaheadTimeoutMs;
    const view = this.document.defaultView;
    if (view) this.typeaheadTimer = view.setTimeout(() => this.clearTypeahead(), timeout);

    const start = options.findIndex((option) => option.id === this.activeId());
    for (let offset = 1; offset <= options.length; offset++) {
      const option = options[(start + offset + options.length) % options.length];
      if (option.label().toLocaleLowerCase().startsWith(this.typeahead)) {
        this.service.setActive(option.id);
        return;
      }
    }
  }

  private clearTypeahead(reset = true): void {
    if (this.typeaheadTimer !== null) {
      this.document.defaultView?.clearTimeout(this.typeaheadTimer);
      this.typeaheadTimer = null;
    }
    if (reset) this.typeahead = '';
  }
}
