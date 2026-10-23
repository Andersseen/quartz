import { DOCUMENT } from '@angular/common';
import {
  Directive,
  ElementRef,
  OnDestroy,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { CollectionStore, resolveDirection, type CollectionItem } from '@quartz-headless/core';
import type { RadioDirective } from './radio.directive';
import { DEFAULT_RADIO_GROUP_CONFIG, type RadioGroupOrientation } from './radio-group.types';

@Directive({
  selector: '[qzRadioGroup]',
  exportAs: 'qzRadioGroup',
  standalone: true,
  host: {
    '[attr.role]': '"radiogroup"',
    '[attr.aria-orientation]': 'orientation()',
    '[attr.aria-disabled]': 'isDisabled() || null',
    '[attr.data-qz-orientation]': 'orientation()',
    '[attr.data-qz-disabled]': 'isDisabled() ? "" : null',
    '(keydown)': 'onKeydown($event)',
  },
})
export class RadioGroupDirective<T> implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly collection = new CollectionStore<RadioDirective<T> & CollectionItem>(
    { focusStrategy: 'roving-tabindex', orientation: 'vertical', wrap: true },
    this.document,
  );

  readonly value = model<T | null>(null);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly orientation = input<RadioGroupOrientation>(DEFAULT_RADIO_GROUP_CONFIG.orientation);
  readonly loop = input(DEFAULT_RADIO_GROUP_CONFIG.loop, { transform: booleanAttribute });
  readonly compareWith = input<(a: T, b: T) => boolean>(
    DEFAULT_RADIO_GROUP_CONFIG.compareWith as (a: T, b: T) => boolean,
  );

  /** Fires once per user interaction that changed the value; never for programmatic writes. */
  readonly valueChangeCommitted = output<T | null>();

  readonly #formDisabled = signal(false);
  /** Effective disabled state: the `disabled` input OR a disabled Angular Forms control. */
  readonly isDisabled = computed(() => this.disabled() || this.#formDisabled());

  readonly activeId = this.collection.activeId;
  readonly activeRadio = computed(() => this.collection.activeItem());

  register(radio: RadioDirective<T>): void {
    this.configureCollection();
    this.collection.register(radio as RadioDirective<T> & CollectionItem);
    if (this.isSelected(radio)) this.collection.setActive(radio.id);
  }

  // The value is owned by the consumer (model/Forms): removing the checked radio leaves the
  // value untouched, exactly like removing a Select option. Clearing it here also wiped
  // two-way bindings whenever the whole group was torn down (`@if`, route change).
  unregister(radio: RadioDirective<T>): void {
    this.collection.unregister(radio as RadioDirective<T> & CollectionItem);
  }

  select(radio: RadioDirective<T>, options: { focus?: boolean } = {}): void {
    if (this.isDisabled() || radio.radioDisabled()) return;
    this.collection.setActive(radio.id, options);
    this.commit(radio.value());
  }

  /** Adapter hook for `@quartz-headless/primitives/forms` (`setDisabledState`). */
  setFormDisabled(disabled: boolean): void {
    this.#formDisabled.set(disabled);
  }

  setActive(radio: RadioDirective<T>, options: { focus?: boolean } = {}): void {
    if (this.isDisabled() || radio.radioDisabled()) return;
    this.collection.setActive(radio.id, options);
  }

  activeTabIndex(id: string): 0 | -1 {
    const selected = this.collection.items().find((radio) => this.isSelected(radio));
    if (selected) return selected.id === id ? 0 : -1;
    return this.collection.activeTabIndex(id);
  }

  isSelected(radio: RadioDirective<T>): boolean {
    const value = this.value();
    return value !== null && this.compareWith()(value, radio.value());
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    this.configureCollection();
    if (event.key === ' ') {
      const active = this.collection.activeItem();
      if (active) {
        event.preventDefault();
        this.select(active, { focus: true });
      }
      return;
    }
    const handled = this.collection.handleKeydown(event, { focus: true });
    const active = this.collection.activeItem();
    if (handled && active) this.commit(active.value());
  }

  ngOnDestroy(): void {
    this.collection.destroy();
  }

  private commit(next: T): void {
    const current = this.value();
    if (current !== null && this.compareWith()(current, next)) return;
    this.value.set(next);
    this.valueChangeCommitted.emit(next);
  }

  private configureCollection(): void {
    this.collection.configure({
      focusStrategy: 'roving-tabindex',
      orientation: this.orientation(),
      direction: resolveDirection(this.elementRef.nativeElement),
      wrap: this.loop(),
    });
  }
}
