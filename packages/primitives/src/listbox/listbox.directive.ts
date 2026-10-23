import {
  booleanAttribute,
  Directive,
  ElementRef,
  input,
  model,
  computed,
  inject,
  OnDestroy,
  output,
  signal,
} from '@angular/core';
import { inlineEndKey, inlineStartKey, resolveDirection } from '@quartz-headless/core';
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
    '[attr.tabindex]': 'isDisabled() ? -1 : 0',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.aria-multiselectable]': 'multiple() ? true : null',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.aria-activedescendant]': 'activeId()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class ListboxDirective<T> implements OnDestroy {
  private readonly service = inject(ListboxService);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Selected value. Supports Angular two-way binding: [(value)]="selection". */
  readonly value = model<T | T[] | null>(null);
  readonly multiple = input(false, { transform: booleanAttribute });
  readonly orientation = input<ListboxOrientation>('vertical');
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly config = input<Partial<ListboxConfig>>({});
  /** Equality function for object values. Defaults to Object.is. */
  readonly compareWith = input<(a: T, b: T) => boolean>(Object.is);

  /** Fires once per user selection change; never for programmatic writes. */
  readonly valueChangeCommitted = output<T | T[] | null>();

  readonly #formDisabled = signal(false);
  /** Effective disabled state: the `disabled` input OR a disabled Angular Forms control. */
  readonly isDisabled = computed(() => this.disabled() || this.#formDisabled());

  readonly activeId = this.service.activeId;
  readonly activeOption = computed(
    () => (this.service.activeOption() as ListboxOptionDirective<T> | null) ?? null,
  );

  register(option: ListboxOptionDirective<T>): void {
    this.configureCollection();
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

  /** Adapter hook for `@quartz-headless/primitives/forms` (`setDisabledState`). */
  setFormDisabled(disabled: boolean): void {
    this.#formDisabled.set(disabled);
  }

  select(option: ListboxOptionDirective<T>): void {
    if (this.isDisabled() || option.optionDisabled()) return;
    this.setActive(option);
    const optionValue = option.value();
    if (!this.multiple()) {
      const previous = this.value();
      this.value.set(optionValue);
      const changed =
        Array.isArray(previous) || previous === null || !this.compareWith()(previous, optionValue);
      if (changed) this.valueChangeCommitted.emit(optionValue);
      return;
    }
    const selected = this.value();
    const current: T[] = Array.isArray(selected) ? [...(selected as T[])] : [];
    const index = current.findIndex((item) => this.compareWith()(item, optionValue));
    if (index === -1) current.push(optionValue);
    else current.splice(index, 1);
    this.value.set(current);
    this.valueChangeCommitted.emit(current);
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    this.configureCollection();
    const horizontal = this.orientation() === 'horizontal';
    // Horizontal navigation follows reading direction (RTL: ArrowRight = previous, ArrowLeft
    // = next); vertical Up/Down are never mirrored. LTR is byte-for-byte the historical
    // ArrowRight/ArrowLeft mapping.
    const direction = resolveDirection(this.elementRef.nativeElement);
    const nextKey = horizontal ? inlineEndKey(direction) : 'ArrowDown';
    const previousKey = horizontal ? inlineStartKey(direction) : 'ArrowUp';
    switch (event.key) {
      case nextKey:
        event.preventDefault();
        this.service.next();
        return;
      case previousKey:
        event.preventDefault();
        this.service.previous();
        return;
      case 'Home':
        event.preventDefault();
        this.service.first();
        return;
      case 'End':
        event.preventDefault();
        this.service.last();
        return;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.activeOption()) this.select(this.activeOption()! as ListboxOptionDirective<T>);
        return;
      default:
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          this.service.typeahead(event.key);
        }
    }
  }

  ngOnDestroy(): void {
    this.service.destroy();
  }

  private enabledOptions(): ListboxOptionDirective<unknown>[] {
    return this.service.enabledOptions();
  }

  private configureCollection(): void {
    this.service.configure({
      orientation: this.orientation(),
      typeaheadTimeoutMs:
        this.config().typeaheadTimeoutMs ?? DEFAULT_LISTBOX_CONFIG.typeaheadTimeoutMs,
    });
  }
}
