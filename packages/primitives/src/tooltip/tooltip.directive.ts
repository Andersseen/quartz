import {
  Directive,
  ElementRef,
  TemplateRef,
  ViewContainerRef,
  inject,
  input,
  OnDestroy,
  signal,
  effect,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { Subscription } from 'rxjs';
import { TooltipService } from './tooltip.service';
import { TooltipPlacement, DEFAULT_TOOLTIP_CONFIG } from './tooltip.types';
import {
  OverlayRef,
  calculatePosition,
  createDismissController,
  getScrollParents,
  type DismissController,
} from '@quartz-headless/core';

let tooltipIdCounter = 0;

/**
 * Headless tooltip directive. Attach to any element to show a tooltip on hover/focus.
 *
 * Usage with string:
 * ```html
 * <button qzTooltip="Save changes" tooltipPlacement="bottom">Save</button>
 * ```
 *
 * Usage with template:
 * ```html
 * <button [qzTooltip]="richTpl" tooltipPlacement="right">Info</button>
 * <ng-template #richTpl>
 *   <div class="my-tooltip"><strong>Rich</strong> content</div>
 * </ng-template>
 * ```
 */
@Directive({
  selector: '[qzTooltip]',
  exportAs: 'qzTooltip',
  standalone: true,
  host: {
    '[attr.aria-describedby]': 'tooltipId()',
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()',
    '(focus)': 'onFocus()',
    '(blur)': 'onBlur()',
  },
})
export class TooltipDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly tooltipService = inject(TooltipService);
  private readonly document = inject(DOCUMENT);

  // ── Inputs ──────────────────────────────────────────────────────────────

  /** Tooltip content — plain string or TemplateRef for rich HTML */
  readonly qzTooltip = input<string | TemplateRef<unknown>>('');

  readonly tooltipPlacement = input<TooltipPlacement>('top');
  readonly tooltipDelay = input<number>(DEFAULT_TOOLTIP_CONFIG.showDelay);
  readonly tooltipHideDelay = input<number>(DEFAULT_TOOLTIP_CONFIG.hideDelay);
  readonly tooltipOffset = input<number>(DEFAULT_TOOLTIP_CONFIG.offset);
  readonly tooltipDisabled = input<boolean>(false);

  // ── State ────────────────────────────────────────────────────────────────

  private overlayRef: OverlayRef | null = null;
  private textTooltipEl: HTMLElement | null = null;
  private templateTooltipChild: HTMLElement | null = null;
  private showTimer: number | null = null;
  private hideTimer: number | null = null;
  private overlayMountedSubscription: Subscription | null = null;
  private dismissController: DismissController | null = null;

  readonly tooltipId = signal<string | null>(null);

  // ── Host bindings ────────────────────────────────────────────────────────

  constructor() {
    effect(() => {
      // Losing the content — or being disabled while open — must take the tooltip down.
      if (!this.qzTooltip() || this.tooltipDisabled()) {
        this.hideImmediately();
      }
    });
  }

  // ── Public API ───────────────────────────────────────────────────────────

  /** Programmatically show the tooltip */
  show(): void {
    if (this.tooltipDisabled()) return;
    this.clearHideTimer();
    if (this.isVisible()) return;

    const view = this.document.defaultView;
    if (!view) return;

    // Drop any pending show so repeated hovers cannot stack up timers.
    this.clearShowTimer();
    this.showTimer = view.setTimeout(() => {
      this.showTimer = null;
      this.render();
    }, this.tooltipDelay());
  }

  /** Programmatically hide the tooltip */
  hide(): void {
    this.clearShowTimer();
    if (!this.isVisible()) return;

    const view = this.document.defaultView;
    if (!view) {
      this.destroyTooltip();
      return;
    }

    this.hideTimer = view.setTimeout(() => {
      this.destroyTooltip();
    }, this.tooltipHideDelay());
  }

  ngOnDestroy(): void {
    this.hideImmediately();
  }

  /** Tear the tooltip down now, skipping the hide delay (Escape, destroy, disable). */
  private hideImmediately(): void {
    this.clearShowTimer();
    this.clearHideTimer();
    this.destroyTooltip();
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private isVisible(): boolean {
    return this.overlayRef?.isOpen === true || this.textTooltipEl !== null;
  }

  private render(): void {
    const content = this.qzTooltip();
    if (!content) return;

    if (typeof content === 'string') {
      this.renderText(content);
    } else {
      this.renderTemplate(content);
    }
  }

  private renderText(text: string): void {
    this.destroyTooltip();
    this.textTooltipEl = this.tooltipService.createTextElement(text);
    this.tooltipId.set(this.textTooltipEl.id || this.generateId());
    this.textTooltipEl.id = this.tooltipId()!;

    // Hidden until measured, otherwise it flashes at the viewport origin for a frame.
    this.textTooltipEl.style.visibility = 'hidden';
    this.queueFrame(() => {
      const el = this.textTooltipEl;
      if (!el) return;
      const anchorRect = this.elementRef.nativeElement.getBoundingClientRect();
      const pos = calculatePosition(
        anchorRect,
        el,
        this.tooltipPlacement(),
        this.tooltipOffset(),
        true,
      );
      el.style.transform = `translate(${pos.left}px, ${pos.top}px)`;
      el.style.visibility = 'visible';
    });

    // Close on scroll / Escape
    this.attachDismissListeners();
  }

  private renderTemplate(templateRef: TemplateRef<unknown>): void {
    this.destroyTooltip();

    this.overlayRef = this.tooltipService.create(
      templateRef,
      this.viewContainerRef,
      this.elementRef.nativeElement,
      {
        placement: this.tooltipPlacement(),
        offset: this.tooltipOffset(),
      },
    );

    this.overlayMountedSubscription = this.overlayRef.mounted$.subscribe((child) => {
      child.id = this.generateId();
      this.tooltipId.set(child.id);
      child.setAttribute('role', 'tooltip');
      this.templateTooltipChild = child;
    });

    this.overlayRef.open();
    this.attachDismissListeners();
  }

  private destroyTooltip(): void {
    this.overlayMountedSubscription?.unsubscribe();
    this.overlayMountedSubscription = null;

    if (this.textTooltipEl) {
      this.textTooltipEl.remove();
      this.textTooltipEl = null;
    }

    this.templateTooltipChild = null;

    if (this.overlayRef) {
      this.overlayRef.close();
      this.overlayRef = null;
    }

    this.detachDismissListeners();
    this.tooltipId.set(null);
  }

  private attachDismissListeners(): void {
    this.dismissController?.destroy();
    this.dismissController = createDismissController({
      document: this.document,
      escape: true,
      scroll: true,
      scrollTargets: () => getScrollParents(this.elementRef.nativeElement, this.document),
      rootElements: () => [this.textTooltipEl, this.templateTooltipChild],
      excludeElements: () => [this.elementRef.nativeElement],
      onDismiss: () => this.hideImmediately(),
    });
  }

  private detachDismissListeners(): void {
    this.dismissController?.destroy();
    this.dismissController = null;
  }

  private clearShowTimer(): void {
    if (this.showTimer !== null) {
      clearTimeout(this.showTimer);
      this.showTimer = null;
    }
  }

  private clearHideTimer(): void {
    if (this.hideTimer !== null) {
      clearTimeout(this.hideTimer);
      this.hideTimer = null;
    }
  }

  private generateId(): string {
    return `qz-tooltip-${++tooltipIdCounter}`;
  }

  private queueFrame(callback: () => void): void {
    const view = this.document.defaultView;
    if (view?.requestAnimationFrame) {
      view.requestAnimationFrame(callback);
      return;
    }

    callback();
  }

  // ── Host event handlers (declared in host to avoid decorator bloat) ──────

  /** @internal */
  onMouseEnter(): void {
    this.show();
  }

  /** @internal */
  onMouseLeave(): void {
    this.hide();
  }

  /** @internal */
  onFocus(): void {
    this.show();
  }

  /** @internal */
  onBlur(): void {
    this.hide();
  }
}
