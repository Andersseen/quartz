import { DOCUMENT } from '@angular/common';
import {
  Directive,
  ElementRef,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
  booleanAttribute,
  computed,
  effect,
  inject,
  input,
  model,
  output,
  signal,
  untracked,
} from '@angular/core';
import { Subscription } from 'rxjs';
import {
  OverlayRef,
  OverlayService,
  createFocusRestorer,
  focusInitialElement,
  focusSafely,
  type FocusRestorer,
  type OverlayFlipAxis,
  type OverlayPlacement,
} from '@quartz-headless/core';
import { DEFAULT_POPOVER_CONFIG } from './popover.types';

let popoverId = 0;

@Directive({
  selector: '[qzPopoverTrigger]',
  exportAs: 'qzPopoverTrigger',
  standalone: true,
  host: {
    '[attr.aria-expanded]': 'isOpen()',
    '[attr.aria-controls]': 'panelId()',
    '[attr.data-qz-open]': 'isOpen() ? "" : null',
    '(click)': 'toggle()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class PopoverTriggerDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly overlayService = inject(OverlayService);
  private readonly document = inject(DOCUMENT);
  private overlayRef: OverlayRef | null = null;
  private mountedSubscription: Subscription | null = null;
  private closedSubscription: Subscription | null = null;
  private focusRestorer: FocusRestorer | null = null;
  private readonly internalSync = signal(false);
  private cancelAutoFocus: (() => void) | null = null;

  readonly popover = input.required<TemplateRef<unknown>>();
  readonly openState = model(false, { alias: 'open' });
  readonly placement = input<OverlayPlacement>(DEFAULT_POPOVER_CONFIG.placement);
  readonly offset = input(DEFAULT_POPOVER_CONFIG.offset);
  readonly flip = input(DEFAULT_POPOVER_CONFIG.flip, { transform: booleanAttribute });
  readonly flipAxis = input<OverlayFlipAxis>(DEFAULT_POPOVER_CONFIG.flipAxis);
  readonly matchAnchorWidth = input(DEFAULT_POPOVER_CONFIG.matchAnchorWidth, {
    transform: booleanAttribute,
  });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly closeOnEscape = input(DEFAULT_POPOVER_CONFIG.closeOnEscape, {
    transform: booleanAttribute,
  });
  readonly closeOnClickOutside = input(DEFAULT_POPOVER_CONFIG.closeOnClickOutside, {
    transform: booleanAttribute,
  });
  readonly autoFocus = input(DEFAULT_POPOVER_CONFIG.autoFocus, { transform: booleanAttribute });
  readonly opened = output<void>();
  readonly closed = output<void>();

  readonly #isOpen = signal(false);
  readonly #panelId = signal<string | null>(null);
  readonly isOpen = this.#isOpen.asReadonly();
  readonly panelId = computed(() => (this.isOpen() ? this.#panelId() : null));

  constructor() {
    effect(() => {
      const shouldOpen = this.openState();
      if (this.internalSync()) return;
      untracked(() => {
        if (shouldOpen) {
          this.open();
          // The model must never claim "open" while the DOM is closed: a disabled trigger
          // refuses to open, so push the real state back.
          if (!this.isOpen() && this.disabled()) this.syncOpenState(false);
        } else this.close(false);
      });
    });
    // Disabling a trigger while its popover is open closes it (no focus move: the user did not
    // ask for one).
    effect(() => {
      if (this.disabled()) untracked(() => this.close(false));
    });
  }

  open(): void {
    if (this.disabled() || this.isOpen()) return;
    if (!this.document.defaultView) return;
    focusSafely(this.elementRef.nativeElement);
    this.focusRestorer = createFocusRestorer(this.document);
    this.overlayRef = this.overlayService.create(
      this.popover(),
      this.viewContainerRef,
      this.elementRef.nativeElement,
      {
        placement: this.placement(),
        offset: this.offset(),
        flip: this.flip(),
        flipAxis: this.flipAxis(),
        matchAnchorWidth: this.matchAnchorWidth(),
        closeOnEscape: this.closeOnEscape(),
        closeOnClickOutside: this.closeOnClickOutside(),
        closeOnScroll: true,
      },
    );
    this.mountedSubscription = this.overlayRef.mounted$.subscribe((panel) => {
      const id = panel.id || `qz-popover-${++popoverId}`;
      panel.id = id;
      this.#panelId.set(id);
      if (this.autoFocus()) {
        // The frame is cancelled on close, so a popover that closed (or was destroyed) before
        // it fires can never pull focus.
        this.cancelAutoFocus = queueFrame(this.document, () => {
          this.cancelAutoFocus = null;
          if (this.overlayRef) focusInitialElement(panel);
        });
      }
    });
    this.closedSubscription = this.overlayRef.closed$.subscribe(() => this.finishClose(true));
    this.overlayRef.open();
    this.#isOpen.set(true);
    this.syncOpenState(true);
    this.opened.emit();
  }

  close(restoreFocus = true): void {
    if (!this.isOpen() && !this.overlayRef) return;
    this.finishClose(restoreFocus);
  }

  toggle(): void {
    this.isOpen() ? this.close(true) : this.open();
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key !== 'Escape' || !this.isOpen()) return;
    event.preventDefault();
    event.stopPropagation();
    this.close(true);
  }

  ngOnDestroy(): void {
    // Route through close()'s guard rather than calling finishClose() directly — a trigger
    // that was destroyed while never opened (or already closed) must not emit a spurious
    // `closed` event for a transition that never happened.
    this.close(false);
  }

  private finishClose(restoreFocus: boolean): void {
    const overlay = this.overlayRef;
    this.cancelAutoFocus?.();
    this.cancelAutoFocus = null;
    this.mountedSubscription?.unsubscribe();
    this.closedSubscription?.unsubscribe();
    this.mountedSubscription = null;
    this.closedSubscription = null;
    this.overlayRef = null;
    this.#isOpen.set(false);
    this.#panelId.set(null);
    overlay?.destroy();
    this.syncOpenState(false);
    if (restoreFocus) this.focusRestorer?.restore();
    this.focusRestorer = null;
    this.closed.emit();
  }

  private syncOpenState(value: boolean): void {
    this.internalSync.set(true);
    this.openState.set(value);
    this.internalSync.set(false);
  }
}

/** Schedules `callback` for the next frame and returns a function that cancels it. */
function queueFrame(document: Document, callback: () => void): () => void {
  const view = document.defaultView;
  if (view?.requestAnimationFrame) {
    const id = view.requestAnimationFrame(callback);
    return () => view.cancelAnimationFrame(id);
  }
  callback();
  return () => undefined;
}
