import { DOCUMENT } from '@angular/common';
import {
  Directive,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
  booleanAttribute,
  computed,
  contentChild,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import {
  CollectionStore,
  OverlayRef,
  OverlayService,
  createDismissController,
  focusSafely,
  type CollectionItem,
  type DismissController,
  type OverlayFlipAxis,
  type OverlayPlacement,
} from '@quartz-headless/core';
import { Subscription } from 'rxjs';
import { SelectContentDirective } from './select-content.directive';
import type { SelectOptionDirective } from './select-option.directive';
import {
  DEFAULT_SELECT_CONFIG,
  type SelectCloseReason,
  type SelectConfig,
  type SelectOpenReason,
} from './select.types';

let selectId = 0;

@Directive({
  selector: '[qzSelect]',
  exportAs: 'qzSelect',
  standalone: true,
})
export class SelectDirective<T> implements OnDestroy {
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly overlayService = inject(OverlayService);
  private readonly document = inject(DOCUMENT);
  private readonly collection = new CollectionStore<SelectOptionDirective<T> & CollectionItem>(
    { focusStrategy: 'roving-tabindex', orientation: 'vertical' },
    this.document,
  );
  private readonly projectedContent = contentChild(SelectContentDirective);
  private readonly generatedId = `qz-select-${++selectId}`;
  private readonly generatedPanelId = `${this.generatedId}-listbox`;
  private readonly internalOpenSync = signal(false);
  private readonly openState = signal(false);

  private overlayRef: OverlayRef | null = null;
  private mountedSubscription: Subscription | null = null;
  private closedSubscription: Subscription | null = null;
  private dismissController: DismissController | null = null;
  private triggerElement: HTMLElement | null = null;
  private listboxElement: HTMLElement | null = null;
  private preferredActivation: 'selected' | 'first' | 'last' = 'selected';
  private destroyed = false;
  /** Scroll dismissal is armed two frames after opening, so a scroll already in flight (e.g. the page scrolling the trigger into view) cannot close the popup it just opened. */
  private scrollArmed = false;
  readonly #formDisabled = signal(false);

  /** Selected value in single mode. Ignored while `multiple` is set. */
  readonly value = model<T | null>(null);
  /** Selected values in `multiple` mode (controlled: write a new array to change the selection). */
  readonly values = model<readonly T[]>([]);
  readonly open = model(false);
  /** Enables multiple selection: `values` is used instead of `value` and toggles keep the popup open. */
  readonly multiple = input(false, { transform: booleanAttribute });
  /**
   * Whether a user selection closes the popup. Defaults to `true` in single mode and `false` when
   * `multiple` is set.
   */
  readonly closeOnSelect = input<boolean | undefined>(undefined);

  readonly content = input<TemplateRef<unknown> | null>(null);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly placement = input<OverlayPlacement>(DEFAULT_SELECT_CONFIG.placement);
  readonly offset = input(DEFAULT_SELECT_CONFIG.offset);
  readonly flip = input(DEFAULT_SELECT_CONFIG.flip, { transform: booleanAttribute });
  readonly flipAxis = input<OverlayFlipAxis>(DEFAULT_SELECT_CONFIG.flipAxis);
  readonly matchAnchorWidth = input(DEFAULT_SELECT_CONFIG.matchAnchorWidth, {
    transform: booleanAttribute,
  });
  readonly closeOnEscape = input(DEFAULT_SELECT_CONFIG.closeOnEscape, {
    transform: booleanAttribute,
  });
  readonly closeOnOutsidePointer = input(DEFAULT_SELECT_CONFIG.closeOnOutsidePointer, {
    transform: booleanAttribute,
  });
  readonly closeOnFocusOutside = input(DEFAULT_SELECT_CONFIG.closeOnFocusOutside, {
    transform: booleanAttribute,
  });
  readonly closeOnScroll = input(DEFAULT_SELECT_CONFIG.closeOnScroll, {
    transform: booleanAttribute,
  });
  readonly displayWith = input<(value: T) => string>(DEFAULT_SELECT_CONFIG.displayWith);
  readonly compareWith = input<(a: T, b: T) => boolean>(DEFAULT_SELECT_CONFIG.compareWith);
  readonly config = input<Partial<SelectConfig<T>>>({});

  readonly opened = output<void>();
  readonly closed = output<void>();
  /** Fires with the option value on every user selection (in `multiple` mode: every toggle). */
  readonly selected = output<T>();
  /** Single mode: fires once per user selection that changed the value; never for programmatic writes. */
  readonly valueChangeCommitted = output<T>();
  /** Multiple mode: fires once per user toggle with the new array; never for programmatic writes. */
  readonly valuesChangeCommitted = output<readonly T[]>();
  /** Fires when focus leaves the control (trigger blur with the popup closed, or a close that does not return focus to the trigger). */
  readonly touched = output<void>();

  /** Effective disabled state: the `disabled` input OR a disabled Angular Forms control. */
  readonly isDisabled = computed(() => this.disabled() || this.#formDisabled());

  readonly activeId = this.collection.activeId;
  readonly activeOption = computed(() => this.collection.activeItem());
  readonly isOpen = this.openState.asReadonly();
  readonly panelId = computed(() => (this.isOpen() ? this.generatedPanelId : null));
  /** Currently selected values as an array in both modes (derived from `value` / `values`). */
  readonly selectedValues = computed<readonly T[]>(() => {
    if (this.multiple()) return this.values();
    const value = this.value();
    return value === null ? [] : [value];
  });
  /** True when nothing is selected: the trigger should show its placeholder. */
  readonly isEmpty = computed(() => this.selectedValues().length === 0);
  /** First registered (rendered) selected option, in DOM order. */
  readonly selectedOption = computed(
    () => this.collection.items().find((option) => this.isSelected(option)) ?? null,
  );
  /**
   * Display labels of the selected values. Derived from the value through `displayWith`, never
   * from registered options, so a value whose option is not rendered yet keeps its label.
   */
  readonly selectedLabels = computed(() => this.selectedValues().map((v) => this.displayWith()(v)));
  /** `selectedLabels` joined with `, ` (empty string when nothing is selected). */
  readonly selectedLabel = computed(() => this.selectedLabels().join(', '));

  constructor() {
    effect(() => {
      const shouldOpen = this.open();
      if (this.internalOpenSync()) return;
      untracked(() => {
        if (shouldOpen) this.openPopup('programmatic');
        else this.closePopup('programmatic');
      });
    });
    effect(() => {
      if (this.isDisabled()) untracked(() => this.closePopup('programmatic'));
    });
  }

  /** Adapter hook for `@quartz-headless/primitives/forms` (`writeValue`); silent, never emits. */
  writeFormValue(value: unknown): void {
    if (this.multiple()) {
      this.values.set(Array.isArray(value) ? (value as T[]) : value == null ? [] : [value as T]);
    } else {
      this.value.set(
        Array.isArray(value)
          ? ((value[0] as T | undefined) ?? null)
          : ((value ?? null) as T | null),
      );
    }
  }

  /** Adapter hook for `@quartz-headless/primitives/forms` (`setDisabledState`). */
  setFormDisabled(disabled: boolean): void {
    this.#formDisabled.set(disabled);
  }

  /**
   * Gives an unlabelled popup its accessible name from the trigger: the trigger's `aria-label`
   * or `aria-labelledby` when present, otherwise a reference to the trigger itself. A listbox
   * the consumer labelled (`aria-label` / `aria-labelledby`, static or bound) is left alone.
   * Attributes are read as they are when the popup opens, so `[attr.aria-label]` bindings work.
   */
  nameListbox(listbox: HTMLElement): void {
    const trigger = this.triggerElement;
    if (!trigger || listbox.hasAttribute('aria-label') || listbox.hasAttribute('aria-labelledby')) {
      return;
    }
    const label = trigger.getAttribute('aria-label');
    const labelledby = trigger.getAttribute('aria-labelledby') || trigger.id;
    if (label) listbox.setAttribute('aria-label', label);
    else if (labelledby) listbox.setAttribute('aria-labelledby', labelledby);
  }

  onTriggerBlur(): void {
    if (!this.isOpen()) this.touched.emit();
  }

  setTriggerElement(element: HTMLElement | null): void {
    this.triggerElement = element;
  }

  setListboxElement(element: HTMLElement | null): void {
    this.listboxElement = element;
  }

  register(option: SelectOptionDirective<T>): void {
    this.collection.register(option as SelectOptionDirective<T> & CollectionItem);
  }

  unregister(option: SelectOptionDirective<T>): void {
    this.collection.unregister(option as SelectOptionDirective<T> & CollectionItem);
  }

  activeTabIndex(id: string): 0 | -1 {
    return this.collection.activeTabIndex(id);
  }

  setActive(option: SelectOptionDirective<T>, options: { focus?: boolean } = {}): void {
    this.collection.setActive(option.id, options);
  }

  isSelected(option: SelectOptionDirective<T>): boolean {
    const compare = this.compareWith();
    const target = option.value();
    return this.selectedValues().some((value) => compare(value, target));
  }

  openPopup(
    reason: SelectOpenReason,
    options: { activate?: 'selected' | 'first' | 'last' } = {},
  ): void {
    if (this.isDisabled() || this.isOpen()) return;
    const template = this.content() ?? this.projectedContent()?.templateRef;
    if (!template || !this.triggerElement || !this.document.defaultView) return;

    this.preferredActivation = options.activate ?? 'selected';
    this.overlayRef = this.overlayService.create(
      template,
      this.viewContainerRef,
      this.triggerElement,
      {
        placement: this.placement(),
        offset: this.offset(),
        flip: this.flip(),
        flipAxis: this.flipAxis(),
        matchAnchorWidth: this.matchAnchorWidth(),
        closeOnClickOutside: false,
        closeOnEscape: false,
        closeOnScroll: false,
      },
    );
    this.mountedSubscription = this.overlayRef.mounted$.subscribe((panel) => {
      panel.id = this.generatedPanelId;
      this.installDismiss(panel);
      this.queueFrame(() => this.activatePreferredOption());
    });
    this.closedSubscription = this.overlayRef.closed$.subscribe(() => {
      if (this.isOpen()) this.closePopup('programmatic', false);
    });
    this.overlayRef.open();
    this.syncOpen(true);
    this.opened.emit();
  }

  closePopup(reason: SelectCloseReason, restoreFocus = true): void {
    if (!this.isOpen()) return;
    this.dismissController?.destroy();
    this.dismissController = null;
    this.mountedSubscription?.unsubscribe();
    this.closedSubscription?.unsubscribe();
    this.mountedSubscription = null;
    this.closedSubscription = null;
    const overlay = this.overlayRef;
    this.overlayRef = null;
    this.listboxElement = null;
    overlay?.destroy();
    this.syncOpen(false);
    this.closed.emit();
    if (restoreFocus) focusSafely(this.triggerElement);
    else if (!this.destroyed) this.touched.emit();
  }

  selectOption(option: SelectOptionDirective<T>): void {
    if (this.isDisabled() || option.optionDisabled()) return;
    const optionValue = option.value();
    if (this.multiple()) {
      const compare = this.compareWith();
      const current = [...this.values()];
      const index = current.findIndex((item) => compare(item, optionValue));
      if (index === -1) current.push(optionValue);
      else current.splice(index, 1);
      this.values.set(current);
      this.selected.emit(optionValue);
      this.valuesChangeCommitted.emit(current);
      if (this.closeOnSelect() === true) this.closePopup('selection');
      return;
    }
    const previous = this.value();
    const changed = previous === null || !this.compareWith()(previous, optionValue);
    this.value.set(optionValue);
    this.selected.emit(optionValue);
    if (changed) this.valueChangeCommitted.emit(optionValue);
    if (this.closeOnSelect() !== false) this.closePopup('selection');
  }

  handleTriggerKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.openPopup('keyboard', { activate: 'selected' });
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.openPopup('keyboard', { activate: 'last' });
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.openPopup('keyboard', { activate: 'selected' });
    }
  }

  handleListboxKeydown(event: KeyboardEvent): void {
    if (this.isDisabled()) return;
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const active = this.activeOption();
      if (active) this.selectOption(active as SelectOptionDirective<T>);
      return;
    }
    if (event.key === 'Escape' && this.closeOnEscape()) {
      event.preventDefault();
      this.closePopup('escape');
      return;
    }
    if (event.key === 'Tab') {
      // Hand focus back to the trigger *before* the browser moves it, so Tab/Shift+Tab continue
      // from the trigger's position in the page instead of from the portal at the end of <body>.
      this.closePopup('tab');
      return;
    }
    this.collection.configure({
      orientation: 'vertical',
      typeaheadTimeoutMs:
        this.config().typeaheadTimeoutMs ?? DEFAULT_SELECT_CONFIG.typeaheadTimeoutMs,
    });
    this.collection.handleKeydown(event, { focus: true });
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    this.closePopup('programmatic', false);
    this.collection.destroy();
  }

  private installDismiss(panel: HTMLElement): void {
    this.dismissController?.destroy();
    this.scrollArmed = false;
    this.queueFrame(() => this.queueFrame(() => (this.scrollArmed = true)));
    this.dismissController = createDismissController({
      document: this.document,
      escape: this.closeOnEscape(),
      outsidePointer: this.closeOnOutsidePointer(),
      focusOutside: this.closeOnFocusOutside(),
      scroll: this.closeOnScroll(),
      rootElements: () => [panel],
      excludeElements: () => (this.triggerElement ? [this.triggerElement] : []),
      onDismiss: (reason) => {
        if (reason === 'scroll' && !this.scrollArmed) return;
        const closeReason =
          reason === 'outside-pointer'
            ? 'outside-pointer'
            : reason === 'focus-outside'
              ? 'focus-outside'
              : reason === 'scroll'
                ? 'scroll'
                : 'escape';
        this.closePopup(closeReason, reason === 'escape');
      },
    });
  }

  private activatePreferredOption(): void {
    if (!this.isOpen()) return;
    const selected = this.selectedOption();
    if (this.preferredActivation === 'last') {
      this.collection.last({ focus: true });
    } else if (selected) {
      this.collection.setActive(selected.id, { focus: true });
    } else {
      this.collection.first({ focus: true });
    }
  }

  private syncOpen(value: boolean): void {
    this.openState.set(value);
    this.internalOpenSync.set(true);
    this.open.set(value);
    this.internalOpenSync.set(false);
  }

  private queueFrame(callback: () => void): void {
    const view = this.document.defaultView;
    if (!view) return;
    view.requestAnimationFrame(callback);
  }
}
