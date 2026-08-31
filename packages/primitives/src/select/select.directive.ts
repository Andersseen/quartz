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

  readonly value = model<T | null>(null);
  readonly open = model(false);

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
  readonly selected = output<T>();

  readonly activeId = this.collection.activeId;
  readonly activeOption = computed(() => this.collection.activeItem());
  readonly isOpen = this.openState.asReadonly();
  readonly panelId = computed(() => (this.isOpen() ? this.generatedPanelId : null));
  readonly selectedOption = computed(
    () => this.collection.items().find((option) => this.isSelected(option)) ?? null,
  );
  readonly selectedLabel = computed(() => {
    const value = this.value();
    return value === null ? '' : this.displayWith()(value);
  });

  constructor() {
    effect(() => {
      const shouldOpen = this.open();
      if (this.internalOpenSync()) return;
      untracked(() => {
        if (shouldOpen) this.openPopup('programmatic');
        else this.closePopup('programmatic');
      });
    });
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
    const value = this.value();
    return value !== null && this.compareWith()(value, option.value());
  }

  openPopup(
    reason: SelectOpenReason,
    options: { activate?: 'selected' | 'first' | 'last' } = {},
  ): void {
    if (this.disabled() || this.isOpen()) return;
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
  }

  selectOption(option: SelectOptionDirective<T>): void {
    if (this.disabled() || option.optionDisabled()) return;
    this.value.set(option.value());
    this.selected.emit(option.value());
    this.closePopup('selection');
  }

  handleTriggerKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
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
    if (this.disabled()) return;
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
      this.closePopup('tab', false);
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
    this.closePopup('programmatic', false);
    this.collection.destroy();
  }

  private installDismiss(panel: HTMLElement): void {
    this.dismissController?.destroy();
    this.dismissController = createDismissController({
      document: this.document,
      escape: this.closeOnEscape(),
      outsidePointer: this.closeOnOutsidePointer(),
      focusOutside: this.closeOnFocusOutside(),
      scroll: this.closeOnScroll(),
      rootElements: () => [panel],
      excludeElements: () => (this.triggerElement ? [this.triggerElement] : []),
      onDismiss: (reason) => {
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
