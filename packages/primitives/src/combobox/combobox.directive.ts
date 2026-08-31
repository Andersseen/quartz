import { DOCUMENT } from '@angular/common';
import {
  Directive,
  ElementRef,
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
import { ComboboxContentDirective } from './combobox-content.directive';
import type { ComboboxOptionDirective } from './combobox-option.directive';
import {
  DEFAULT_COMBOBOX_CONFIG,
  defaultComboboxDisplayWith,
  defaultComboboxFilter,
  type ComboboxAutocomplete,
  type ComboboxCloseReason,
  type ComboboxCompareWith,
  type ComboboxConfig,
  type ComboboxDisplayWith,
  type ComboboxFilter,
  type ComboboxOpenReason,
} from './combobox.types';

let comboboxId = 0;

@Directive({
  selector: '[qzCombobox]',
  exportAs: 'qzCombobox',
  standalone: true,
})
export class ComboboxDirective<T> implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly overlayService = inject(OverlayService);
  private readonly document = inject(DOCUMENT);
  private readonly collection = new CollectionStore<ComboboxOptionDirective<T> & CollectionItem>(
    { focusStrategy: 'aria-activedescendant', orientation: 'vertical' },
    this.document,
  );
  private overlayRef: OverlayRef | null = null;
  private mountedSubscription: Subscription | null = null;
  private closedSubscription: Subscription | null = null;
  private dismissController: DismissController | null = null;
  private dismissTimer: number | null = null;
  private contentTemplate: TemplateRef<unknown> | null = null;
  private inputElement: HTMLInputElement | null = null;
  private triggerElement: HTMLElement | null = null;
  private panelElement = signal<HTMLElement | null>(null);
  private readonly internalOpenSync = signal(false);
  private readonly internalInputSync = signal(false);
  private readonly internalValueSync = signal(false);
  private readonly composing = signal(false);
  private readonly openState = signal(false);
  private readonly projectedContent = contentChild(ComboboxContentDirective);
  private readonly generatedId = `qz-combobox-${++comboboxId}`;
  private readonly generatedPanelId = `${this.generatedId}-listbox`;

  readonly value = model<T | null>(null);
  readonly inputValue = model('');
  readonly open = model(false);

  readonly content = input<TemplateRef<unknown> | null>(null);
  readonly options = input<readonly T[] | null>(null);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly loading = input(false, { transform: booleanAttribute });
  readonly placement = input<OverlayPlacement>(DEFAULT_COMBOBOX_CONFIG.placement);
  readonly offset = input(DEFAULT_COMBOBOX_CONFIG.offset);
  readonly flip = input(DEFAULT_COMBOBOX_CONFIG.flip, { transform: booleanAttribute });
  readonly flipAxis = input<OverlayFlipAxis>(DEFAULT_COMBOBOX_CONFIG.flipAxis);
  readonly matchAnchorWidth = input(DEFAULT_COMBOBOX_CONFIG.matchAnchorWidth, {
    transform: booleanAttribute,
  });
  readonly autocomplete = input<ComboboxAutocomplete>(DEFAULT_COMBOBOX_CONFIG.autocomplete);
  readonly openOnFocus = input(DEFAULT_COMBOBOX_CONFIG.openOnFocus, {
    transform: booleanAttribute,
  });
  readonly openOnTyping = input(DEFAULT_COMBOBOX_CONFIG.openOnTyping, {
    transform: booleanAttribute,
  });
  readonly closeOnSelect = input(DEFAULT_COMBOBOX_CONFIG.closeOnSelect, {
    transform: booleanAttribute,
  });
  readonly closeOnEscape = input(DEFAULT_COMBOBOX_CONFIG.closeOnEscape, {
    transform: booleanAttribute,
  });
  readonly closeOnOutsidePointer = input(DEFAULT_COMBOBOX_CONFIG.closeOnOutsidePointer, {
    transform: booleanAttribute,
  });
  readonly closeOnFocusOutside = input(DEFAULT_COMBOBOX_CONFIG.closeOnFocusOutside, {
    transform: booleanAttribute,
  });
  readonly closeOnScroll = input(DEFAULT_COMBOBOX_CONFIG.closeOnScroll, {
    transform: booleanAttribute,
  });
  readonly allowFreeform = input(DEFAULT_COMBOBOX_CONFIG.allowFreeform, {
    transform: booleanAttribute,
  });
  readonly resetActiveOnClose = input(DEFAULT_COMBOBOX_CONFIG.resetActiveOnClose, {
    transform: booleanAttribute,
  });
  readonly filter = input<ComboboxFilter<T> | null>(defaultComboboxFilter);
  readonly displayWith = input<ComboboxDisplayWith<T>>(defaultComboboxDisplayWith);
  readonly compareWith = input<ComboboxCompareWith<T>>(Object.is);
  readonly config = input<Partial<ComboboxConfig<T>>>({});

  readonly opened = output<void>();
  readonly closed = output<void>();
  readonly selected = output<T | null>();
  readonly inputValueChangeCommitted = output<string>();

  readonly activeId = this.collection.activeId;
  readonly activeOption = computed(() => this.collection.activeItem());
  readonly isOpen = this.openState.asReadonly();
  readonly panelId = computed(() => (this.isOpen() ? this.generatedPanelId : null));
  readonly filteredOptions = computed(() => {
    const options = this.options() ?? [];
    const filter = this.resolvedFilter();
    if (!filter) return options;
    const query = this.inputValue();
    return options.filter((option) => filter(option, query, this.displayOption(option)));
  });
  readonly empty = computed(() => {
    if (this.options()) return this.filteredOptions().length === 0;
    return this.collection.items().length === 0;
  });
  readonly isComposing = this.composing.asReadonly();

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
      const value = this.value();
      if (this.internalValueSync() || untracked(this.composing)) return;
      untracked(() => {
        this.syncInputValue(value === null ? '' : this.displayOption(value as T));
      });
    });
  }

  setContentTemplate(template: TemplateRef<unknown> | null): void {
    this.contentTemplate = template;
  }

  setInputElement(element: HTMLInputElement | null): void {
    this.inputElement = element;
    if (element) element.value = this.inputValue();
  }

  setTriggerElement(element: HTMLElement | null): void {
    this.triggerElement = element;
  }

  register(option: ComboboxOptionDirective<T>): void {
    this.collection.register(option as ComboboxOptionDirective<T> & CollectionItem);
  }

  unregister(option: ComboboxOptionDirective<T>): void {
    this.collection.unregister(option as ComboboxOptionDirective<T> & CollectionItem);
  }

  setActive(id: string | null): void {
    this.collection.setActive(id);
  }

  isSelected(option: ComboboxOptionDirective<T>): boolean {
    const value = this.value();
    return value !== null && this.compareWith()(value, option.value());
  }

  displayOption(value: T): string {
    return this.displayWith()(value);
  }

  handleInput(value: string): void {
    if (this.disabled()) return;
    this.syncInputValue(value);
    this.clearSelectedValueIfInputDiverged(value);
    if (this.resolvedOpenOnTyping()) this.openPopup('input', { activate: 'first' });
    this.queueFrame(() => {
      this.collection.first();
      this.overlayRef?.updatePosition();
    });
  }

  handleFocus(): void {
    if (this.disabled()) return;
    if (this.resolvedOpenOnFocus()) this.openPopup('focus', { activate: 'first' });
  }

  handleKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    if (this.composing() || event.isComposing) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!this.isOpen()) this.openPopup('keyboard', { activate: 'first' });
      else this.collection.next();
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!this.isOpen()) this.openPopup('keyboard', { activate: 'last' });
      else this.collection.previous();
      return;
    }

    if (event.key === 'Enter') {
      const active = this.activeOption();
      if (!this.isOpen() || !active) return;
      event.preventDefault();
      this.selectOption(active);
      return;
    }

    if (event.key === 'Escape' && this.isOpen() && this.resolvedCloseOnEscape()) {
      event.preventDefault();
      event.stopPropagation();
      this.closePopup('escape');
      this.restoreStrictInput();
      return;
    }

    if (event.key === 'Tab' && this.isOpen()) {
      this.closePopup('tab');
    }
  }

  startComposition(): void {
    this.composing.set(true);
  }

  endComposition(value: string): void {
    this.composing.set(false);
    this.handleInput(value);
  }

  openPopup(
    _reason: ComboboxOpenReason = 'programmatic',
    options: { activate?: 'first' | 'last' } = {},
  ): void {
    if (this.disabled() || this.isOpen()) return;
    const contentTemplate =
      this.content() ?? this.contentTemplate ?? this.projectedContent()?.templateRef ?? null;
    if (!this.document.defaultView || !this.inputElement || !contentTemplate) return;

    this.overlayRef = this.overlayService.create(
      contentTemplate,
      this.viewContainerRef,
      this.inputElement,
      {
        placement: this.resolvedPlacement(),
        offset: this.resolvedOffset(),
        flip: this.resolvedFlip(),
        flipAxis: this.resolvedFlipAxis(),
        matchAnchorWidth: this.resolvedMatchAnchorWidth(),
        closeOnClickOutside: false,
        closeOnEscape: false,
        closeOnScroll: false,
      },
    );
    this.mountedSubscription = this.overlayRef.mounted$.subscribe((panel) => {
      panel.id ||= this.generatedPanelId;
      this.panelElement.set(panel);
      this.attachDismissController();
      if (options.activate === 'last') this.collection.last();
      else if (options.activate === 'first') this.collection.first();
      this.queueFrame(() => this.overlayRef?.updatePosition());
    });
    this.closedSubscription = this.overlayRef.closed$.subscribe(() =>
      this.finishClose('programmatic'),
    );
    this.overlayRef.open();
    this.setOpenState(true);
    this.opened.emit();
  }

  closePopup(reason: ComboboxCloseReason = 'programmatic'): void {
    if (!this.isOpen() && !this.overlayRef) return;
    this.finishClose(reason);
  }

  togglePopup(): void {
    this.isOpen()
      ? this.closePopup('programmatic')
      : this.openPopup('trigger', { activate: 'first' });
  }

  selectActive(): void {
    const active = this.activeOption();
    if (active) this.selectOption(active);
  }

  selectOption(option: ComboboxOptionDirective<T>): void {
    if (this.disabled() || option.optionDisabled()) return;
    this.collection.setActive(option.id);
    const value = option.value();
    this.internalValueSync.set(true);
    this.value.set(value);
    this.internalValueSync.set(false);
    const label = option.label();
    this.syncInputValue(label);
    this.selected.emit(value);
    this.inputValueChangeCommitted.emit(label);
    if (this.resolvedCloseOnSelect()) this.closePopup('selection');
    this.queueFrame(() => focusSafely(this.inputElement));
  }

  commitFreeformValue(): void {
    if (!this.allowFreeform()) return;
    const value = this.inputValue() as unknown as T;
    this.internalValueSync.set(true);
    this.value.set(value);
    this.internalValueSync.set(false);
    this.selected.emit(value);
    this.inputValueChangeCommitted.emit(this.inputValue());
  }

  ngOnDestroy(): void {
    this.finishClose('programmatic');
    this.collection.destroy();
  }

  private finishClose(reason: ComboboxCloseReason): void {
    this.clearDismissTimer();
    this.dismissController?.destroy();
    this.dismissController = null;
    this.mountedSubscription?.unsubscribe();
    this.closedSubscription?.unsubscribe();
    this.mountedSubscription = null;
    this.closedSubscription = null;
    const overlay = this.overlayRef;
    this.overlayRef = null;
    this.panelElement.set(null);
    if (this.resetActiveOnClose()) this.collection.setActive(null);
    this.setOpenState(false);
    overlay?.destroy();
    if (reason === 'focus-outside' || reason === 'tab') {
      if (this.allowFreeform()) this.commitFreeformValue();
      else this.restoreStrictInput();
    }
    this.closed.emit();
  }

  private attachDismissController(): void {
    this.clearDismissTimer();
    const view = this.document.defaultView;
    if (!view) return;
    this.dismissTimer = view.setTimeout(() => {
      this.dismissTimer = null;
      this.dismissController?.destroy();
      this.dismissController = createDismissController({
        document: this.document,
        outsidePointer: this.resolvedCloseOnOutsidePointer(),
        focusOutside: this.resolvedCloseOnFocusOutside(),
        scroll: this.resolvedCloseOnScroll(),
        rootElements: () => [this.inputElement, this.triggerElement, this.panelElement()],
        onDismiss: (reason) => {
          if (reason === 'outside-pointer') this.closePopup('outside-pointer');
          else if (reason === 'focus-outside') this.closePopup('focus-outside');
          else if (reason === 'scroll') this.closePopup('scroll');
        },
      });
    });
  }

  private clearDismissTimer(): void {
    if (this.dismissTimer === null) return;
    this.document.defaultView?.clearTimeout(this.dismissTimer);
    this.dismissTimer = null;
  }

  private setOpenState(value: boolean): void {
    this.openState.set(value);
    this.internalOpenSync.set(true);
    this.open.set(value);
    this.internalOpenSync.set(false);
  }

  private syncInputValue(value: string): void {
    this.internalInputSync.set(true);
    this.inputValue.set(value);
    this.internalInputSync.set(false);
    if (this.inputElement && this.inputElement.value !== value) {
      this.inputElement.value = value;
    }
  }

  private clearSelectedValueIfInputDiverged(inputValue: string): void {
    const value = this.value();
    if (value === null) return;
    if (this.displayOption(value as T) === inputValue) return;
    this.internalValueSync.set(true);
    this.value.set(null);
    this.internalValueSync.set(false);
  }

  private restoreStrictInput(): void {
    if (this.allowFreeform()) return;
    const value = this.value();
    this.syncInputValue(value === null ? '' : this.displayOption(value));
  }

  private queueFrame(callback: () => void): void {
    const view = this.document.defaultView;
    if (view?.requestAnimationFrame) view.requestAnimationFrame(callback);
    else callback();
  }

  private resolvedConfig(): Partial<ComboboxConfig<T>> {
    return this.config();
  }

  private resolvedPlacement(): OverlayPlacement {
    return this.resolvedConfig().placement ?? this.placement();
  }

  private resolvedOffset(): number {
    return this.resolvedConfig().offset ?? this.offset();
  }

  private resolvedFlip(): boolean {
    return this.resolvedConfig().flip ?? this.flip();
  }

  private resolvedFlipAxis(): OverlayFlipAxis {
    return this.resolvedConfig().flipAxis ?? this.flipAxis();
  }

  private resolvedMatchAnchorWidth(): boolean {
    return this.resolvedConfig().matchAnchorWidth ?? this.matchAnchorWidth();
  }

  private resolvedOpenOnFocus(): boolean {
    return this.resolvedConfig().openOnFocus ?? this.openOnFocus();
  }

  private resolvedOpenOnTyping(): boolean {
    return this.resolvedConfig().openOnTyping ?? this.openOnTyping();
  }

  private resolvedCloseOnSelect(): boolean {
    return this.resolvedConfig().closeOnSelect ?? this.closeOnSelect();
  }

  private resolvedCloseOnEscape(): boolean {
    return this.resolvedConfig().closeOnEscape ?? this.closeOnEscape();
  }

  private resolvedCloseOnOutsidePointer(): boolean {
    return this.resolvedConfig().closeOnOutsidePointer ?? this.closeOnOutsidePointer();
  }

  private resolvedCloseOnFocusOutside(): boolean {
    return this.resolvedConfig().closeOnFocusOutside ?? this.closeOnFocusOutside();
  }

  private resolvedCloseOnScroll(): boolean {
    return this.resolvedConfig().closeOnScroll ?? this.closeOnScroll();
  }

  private resolvedFilter(): ComboboxFilter<T> | null {
    const config = this.resolvedConfig();
    return 'filter' in config ? (config.filter ?? null) : this.filter();
  }
}
