import { DOCUMENT } from '@angular/common';
import {
  Directive,
  ElementRef,
  OnDestroy,
  TemplateRef,
  ViewContainerRef,
  booleanAttribute,
  computed,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import {
  OverlayRef,
  OverlayService,
  createFocusRestorer,
  focusSafely,
  type FocusRestorer,
  type OverlayFlipAxis,
  type OverlayPlacement,
} from '@quartz-headless/core';
import { MenuService } from './menu.service';
import { QZ_MENU_SERVICE_PROPERTY } from './menu.directive';

let menuTriggerId = 0;

@Directive({
  selector: '[qzMenuTrigger]',
  exportAs: 'qzMenuTrigger',
  standalone: true,
  host: {
    '[attr.aria-haspopup]': '"menu"',
    '[attr.aria-expanded]': 'isOpen()',
    '[attr.aria-controls]': 'panelId()',
    '[attr.data-qz-open]': 'isOpen() ? "" : null',
    '(click)': 'toggle()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class MenuTriggerDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly overlayService = inject(OverlayService);
  private readonly document = inject(DOCUMENT);
  private overlayRef: OverlayRef | null = null;
  private mountedSubscription: Subscription | null = null;
  private closedSubscription: Subscription | null = null;
  private menuService: MenuService | null = null;
  private focusRestorer: FocusRestorer | null = null;

  readonly menu = input.required<TemplateRef<unknown>>();
  readonly placement = input<OverlayPlacement>('bottom-start');
  readonly offset = input(4);
  readonly flip = input(true, { transform: booleanAttribute });
  readonly flipAxis = input<OverlayFlipAxis>('main');
  readonly matchAnchorWidth = input(false, { transform: booleanAttribute });
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly opened = output<void>();
  readonly closed = output<void>();

  readonly #isOpen = signal(false);
  readonly #panelId = signal<string | null>(null);
  readonly isOpen = this.#isOpen.asReadonly();
  readonly panelId = computed(() => (this.isOpen() ? this.#panelId() : null));

  open(options: { focus?: 'first' | 'last' } = { focus: 'first' }): void {
    if (this.disabled() || this.isOpen()) return;
    if (!this.document.defaultView) return;

    focusSafely(this.elementRef.nativeElement);
    this.focusRestorer = createFocusRestorer(this.document);
    this.overlayRef = this.overlayService.create(
      this.menu(),
      this.viewContainerRef,
      this.elementRef.nativeElement,
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
      const id = panel.id || `qz-menu-panel-${++menuTriggerId}`;
      panel.id = id;
      this.#panelId.set(id);
      this.menuService = getMenuService(panel);
      this.menuService?.registerPanel(panel);
      this.menuService?.registerRootClose(this.closeFromService);
      if (options.focus === 'last') this.menuService?.focusLast();
      else this.menuService?.focusFirst();
      queueFrame(this.document, () => {
        if (!this.isOpen()) return;
        if (options.focus === 'last') this.menuService?.focusLast();
        else this.menuService?.focusFirst();
      });
    });
    this.closedSubscription = this.overlayRef.closed$.subscribe(() => this.finishClose(true));
    this.overlayRef.open();
    this.#isOpen.set(true);
    this.opened.emit();
  }

  close(restoreFocus = true): void {
    if (!this.isOpen()) return;
    this.finishClose(restoreFocus);
  }

  toggle(): void {
    this.isOpen() ? this.close(true) : this.open({ focus: 'first' });
  }

  onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.open({ focus: 'first' });
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.open({ focus: 'last' });
    }
  }

  ngOnDestroy(): void {
    this.finishClose(false);
  }

  private readonly closeFromService = (restoreFocus: boolean): void => {
    this.finishClose(restoreFocus);
  };

  private finishClose(restoreFocus: boolean): void {
    if (!this.overlayRef && !this.#isOpen()) return;
    const overlay = this.overlayRef;
    const panel = overlay
      ? (this.document.getElementById(this.#panelId() ?? '') as HTMLElement | null)
      : null;
    this.menuService?.closeOpenSubmenu();
    if (panel) this.menuService?.unregisterPanel(panel);
    this.menuService?.unregisterRootClose(this.closeFromService);
    this.menuService = null;
    this.mountedSubscription?.unsubscribe();
    this.closedSubscription?.unsubscribe();
    this.mountedSubscription = null;
    this.closedSubscription = null;
    this.overlayRef = null;
    this.#isOpen.set(false);
    this.#panelId.set(null);
    overlay?.destroy();
    if (restoreFocus) this.focusRestorer?.restore();
    this.focusRestorer = null;
    this.closed.emit();
  }
}

function getMenuService(panel: HTMLElement): MenuService | null {
  return (
    (panel as unknown as Record<string, MenuService | undefined>)[QZ_MENU_SERVICE_PROPERTY] ?? null
  );
}

function queueFrame(document: Document, callback: () => void): void {
  const view = document.defaultView;
  if (view?.requestAnimationFrame) view.requestAnimationFrame(callback);
  else callback();
}
