import { DOCUMENT } from '@angular/common';
import {
  Directive,
  ElementRef,
  OnDestroy,
  afterRenderEffect,
  booleanAttribute,
  computed,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import {
  DEFAULT_BREAKPOINTS,
  ViewportService,
  createDismissController,
  createFocusRestorer,
  createFocusTrap,
  createScrollLock,
  focusInitialElement,
  type DismissController,
  type FocusRestorer,
  type FocusTrap,
} from '@quartz-headless/core';
import {
  DEFAULT_SIDEBAR_CONFIG,
  type SidebarBreakpoint,
  type SidebarFocusMode,
  type SidebarMode,
  type SidebarSide,
  type SidebarState,
} from './sidebar.types';
import type { SidebarPanelDirective } from './sidebar-panel.directive';
import type { SidebarTriggerDirective } from './sidebar-trigger.directive';

let sidebarId = 0;

@Directive({
  selector: '[qzSidebar]',
  exportAs: 'qzSidebar',
  standalone: true,
  host: {
    '[attr.data-qz-sidebar]': '""',
    '[attr.data-qz-open]': 'open() ? "" : null',
    '[attr.data-qz-collapsed]': 'collapsed() ? "" : null',
    '[attr.data-qz-state]': 'state()',
    '[attr.data-qz-mode]': 'currentMode()',
    '[attr.data-qz-side]': 'side()',
    '[attr.data-qz-responsive]': 'isDesktop() ? "desktop" : "mobile"',
    '[style.display]': '"grid"',
    '[style.grid-template-columns]': 'gridTemplateColumns()',
    '[style.min-width]': '"0"',
  },
})
export class SidebarDirective implements OnDestroy {
  private readonly document = inject(DOCUMENT);
  private readonly viewport = inject(ViewportService);
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly generatedId = `qz-sidebar-${++sidebarId}`;
  private readonly scrollLockController = createScrollLock(this.document);
  private readonly desktopOpen = signal(true);

  private readonly panel = signal<SidebarPanelDirective | null>(null);
  private triggers = new Set<SidebarTriggerDirective>();
  private dismissController: DismissController | null = null;
  private focusTrap: FocusTrap | null = null;
  private focusRestorer: FocusRestorer | null = null;
  private previousResponsive: 'desktop' | 'mobile' | null = null;

  readonly open = model(true);
  readonly collapsed = model(false);
  readonly mode = input<SidebarMode | null>(null);
  readonly desktopMode = input<SidebarMode>(DEFAULT_SIDEBAR_CONFIG.desktopMode);
  readonly mobileMode = input<SidebarMode>(DEFAULT_SIDEBAR_CONFIG.mobileMode);
  readonly breakpoint = input<SidebarBreakpoint>(DEFAULT_SIDEBAR_CONFIG.breakpoint);
  readonly side = input<SidebarSide>(DEFAULT_SIDEBAR_CONFIG.side);
  readonly scrollLock = input(DEFAULT_SIDEBAR_CONFIG.scrollLock, { transform: booleanAttribute });
  readonly focusMode = input<SidebarFocusMode>(DEFAULT_SIDEBAR_CONFIG.focusMode);
  readonly autoCloseOnMobile = input(DEFAULT_SIDEBAR_CONFIG.autoCloseOnMobile, {
    transform: booleanAttribute,
  });

  readonly isDesktop = computed(() => this.viewport.width() >= this.breakpointPx());
  readonly currentMode = computed(
    () => this.mode() ?? (this.isDesktop() ? this.desktopMode() : this.mobileMode()),
  );
  readonly state = computed<SidebarState>(() => {
    if (!this.open()) return 'closed';
    return this.collapsed() ? 'collapsed' : 'expanded';
  });
  readonly panelId = computed(() => this.panel()?.id ?? `${this.generatedId}-panel`);
  readonly isOverlayOpen = computed(() => this.currentMode() === 'overlay' && this.open());
  readonly gridTemplateColumns = computed(() => {
    if (this.currentMode() !== 'push') return 'minmax(0, 1fr)';
    const panel = this.open()
      ? this.collapsed()
        ? 'var(--qz-sidebar-collapsed-size, 4rem)'
        : 'var(--qz-sidebar-size, 16rem)'
      : '0px';
    return this.side() === 'inline-start' ? `${panel} minmax(0, 1fr)` : `minmax(0, 1fr) ${panel}`;
  });

  constructor() {
    afterRenderEffect(() => {
      this.syncResponsiveState();
      this.syncOverlayBehavior();
      this.updateTriggers();
    });
  }

  registerPanel(panel: SidebarPanelDirective): void {
    this.panel.set(panel);
    this.updateTriggers();
  }

  unregisterPanel(panel: SidebarPanelDirective): void {
    if (this.panel() === panel) {
      this.panel.set(null);
      this.teardownOverlayBehavior();
      this.updateTriggers();
    }
  }

  registerTrigger(trigger: SidebarTriggerDirective): void {
    this.triggers.add(trigger);
    trigger.setControlledPanelId(this.panelId());
  }

  unregisterTrigger(trigger: SidebarTriggerDirective): void {
    this.triggers.delete(trigger);
  }

  toggle(): void {
    this.open.update((open) => !open);
  }

  close(): void {
    this.open.set(false);
  }

  expand(): void {
    this.collapsed.set(false);
    this.open.set(true);
  }

  collapse(): void {
    this.collapsed.set(true);
    this.open.set(true);
  }

  handlePanelKeydown(event: KeyboardEvent): void {
    this.focusTrap?.handleKeydown(event);
  }

  ngOnDestroy(): void {
    this.teardownOverlayBehavior();
  }

  private breakpointPx(): number {
    const breakpoint = this.breakpoint();
    return typeof breakpoint === 'number' ? breakpoint : DEFAULT_BREAKPOINTS[breakpoint];
  }

  private syncResponsiveState(): void {
    const responsive = this.isDesktop() ? 'desktop' : 'mobile';
    if (this.previousResponsive === responsive) {
      if (responsive === 'desktop') this.desktopOpen.set(this.open());
      return;
    }

    if (this.previousResponsive === 'desktop' && responsive === 'mobile') {
      this.desktopOpen.set(this.open());
      if (this.autoCloseOnMobile() && this.currentMode() === 'overlay') this.open.set(false);
    }

    if (this.previousResponsive === 'mobile' && responsive === 'desktop') {
      this.open.set(this.desktopOpen());
    }

    this.previousResponsive = responsive;
  }

  private syncOverlayBehavior(): void {
    if (!this.isOverlayOpen() || !this.document.defaultView) {
      this.teardownOverlayBehavior();
      return;
    }

    const panelEl = this.panel()?.element() ?? null;
    if (!panelEl) return;

    if (!this.dismissController) {
      this.dismissController = createDismissController({
        document: this.document,
        escape: true,
        outsidePointer: true,
        rootElements: () => [panelEl],
        excludeElements: () => [...this.triggers].map((trigger) => trigger.element()),
        onDismiss: () => this.close(),
      });
    }

    if (this.scrollLock() && !this.scrollLockController.locked) {
      this.scrollLockController.lock();
    }

    const focusMode = this.focusMode();
    if (focusMode !== 'none' && !this.focusRestorer) {
      this.focusRestorer = createFocusRestorer(this.document);
      focusInitialElement(panelEl);
    }
    if (focusMode === 'trap' && !this.focusTrap) {
      this.focusTrap = createFocusTrap(panelEl, this.document);
    }
    if (focusMode !== 'trap') {
      this.focusTrap?.destroy();
      this.focusTrap = null;
    }
  }

  private teardownOverlayBehavior(): void {
    this.dismissController?.destroy();
    this.dismissController = null;
    this.focusTrap?.destroy();
    this.focusTrap = null;
    this.scrollLockController.unlock();
    this.focusRestorer?.restore();
    this.focusRestorer = null;
  }

  private updateTriggers(): void {
    for (const trigger of this.triggers) trigger.setControlledPanelId(this.panelId());
  }
}
