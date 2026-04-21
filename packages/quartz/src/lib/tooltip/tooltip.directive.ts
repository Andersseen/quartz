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
  ChangeDetectorRef,
} from '@angular/core';
import { OverlayRef } from '../overlay';
import { TooltipService } from './tooltip.service';
import { TooltipPlacement, DEFAULT_TOOLTIP_CONFIG } from './tooltip.types';
import { calculatePosition } from '../overlay';

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
  private readonly cdr = inject(ChangeDetectorRef);

  // ── Inputs ──────────────────────────────────────────────────────────────

  /** Tooltip content — plain string or TemplateRef for rich HTML */
  readonly qzTooltip = input<string | TemplateRef<unknown>>('');

  readonly tooltipPlacement = input<TooltipPlacement>('top');
  readonly tooltipDelay = input<number>(DEFAULT_TOOLTIP_CONFIG.showDelay);
  readonly tooltipHideDelay = input<number>(DEFAULT_TOOLTIP_CONFIG.hideDelay);
  readonly tooltipOffset = input<number>(DEFAULT_TOOLTIP_CONFIG.offset);
  readonly tooltipDisabled = input<boolean>(false);
  readonly tooltipInteractive = input<boolean>(false);

  // ── State ────────────────────────────────────────────────────────────────

  private overlayRef: OverlayRef | null = null;
  private textTooltipEl: HTMLElement | null = null;
  private showTimer: number | null = null;
  private hideTimer: number | null = null;
  private isHoveringTooltip = false;
  private scrollListeners: Array<{ target: EventTarget; handler: EventListener }> = [];

  readonly tooltipId = signal<string | null>(null);

  // ── Host bindings ────────────────────────────────────────────────────────

  constructor() {
    effect(() => {
      const content = this.qzTooltip();
      if (!content) {
        this.hide();
      }
    });
  }

  // ── Public API ───────────────────────────────────────────────────────────

  /** Programmatically show the tooltip */
  show(): void {
    if (this.tooltipDisabled()) return;
    this.clearHideTimer();
    if (this.isVisible()) return;

    this.showTimer = window.setTimeout(() => {
      this.render();
    }, this.tooltipDelay());
  }

  /** Programmatically hide the tooltip */
  hide(): void {
    this.clearShowTimer();
    if (!this.isVisible()) return;

    const delay =
      this.tooltipInteractive() && this.isHoveringTooltip ? 200 : this.tooltipHideDelay();

    this.hideTimer = window.setTimeout(() => {
      if (this.tooltipInteractive() && this.isHoveringTooltip) return;
      this.destroyTooltip();
    }, delay);
  }

  ngOnDestroy(): void {
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
    this.cdr.markForCheck();

    // Position
    requestAnimationFrame(() => {
      if (!this.textTooltipEl) return;
      const anchorRect = this.elementRef.nativeElement.getBoundingClientRect();
      const pos = calculatePosition(
        anchorRect,
        this.textTooltipEl,
        this.tooltipPlacement(),
        this.tooltipOffset(),
        true,
      );
      this.textTooltipEl!.style.transform = `translate(${pos.left}px, ${pos.top}px)`;
    });

    // Close on scroll
    this.attachScrollListeners();

    // Interactive mode — allow hovering tooltip
    if (this.tooltipInteractive()) {
      this.textTooltipEl.addEventListener('mouseenter', this.onTooltipMouseEnter);
      this.textTooltipEl.addEventListener('mouseleave', this.onTooltipMouseLeave);
    }
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

    const wrapper = this.overlayRef['wrapperEl'] as HTMLElement | null;
    if (wrapper?.firstElementChild) {
      const child = wrapper.firstElementChild as HTMLElement;
      child.id = this.generateId();
      this.tooltipId.set(child.id);
      child.setAttribute('role', 'tooltip');
      this.cdr.markForCheck();
    }

    this.overlayRef.open();
  }

  private destroyTooltip(): void {
    if (this.textTooltipEl) {
      this.textTooltipEl.removeEventListener('mouseenter', this.onTooltipMouseEnter);
      this.textTooltipEl.removeEventListener('mouseleave', this.onTooltipMouseLeave);
      this.textTooltipEl.remove();
      this.textTooltipEl = null;
    }

    if (this.overlayRef) {
      this.overlayRef.close();
      this.overlayRef = null;
    }

    this.detachScrollListeners();
    this.tooltipId.set(null);
    this.isHoveringTooltip = false;
  }

  private attachScrollListeners(): void {
    this.detachScrollListeners();

    const onScroll = (): void => {
      this.destroyTooltip();
    };

    // Listen on scrollable parents + window
    const parents = getScrollParents(this.elementRef.nativeElement);
    for (const parent of parents) {
      parent.addEventListener('scroll', onScroll, { passive: true });
      this.scrollListeners.push({ target: parent, handler: onScroll });
    }
  }

  private detachScrollListeners(): void {
    for (const { target, handler } of this.scrollListeners) {
      target.removeEventListener('scroll', handler);
    }
    this.scrollListeners = [];
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
    return 'qz-tooltip-' + Math.random().toString(36).substring(2, 9);
  }

  private onTooltipMouseEnter = (): void => {
    this.isHoveringTooltip = true;
    this.clearHideTimer();
  };

  private onTooltipMouseLeave = (): void => {
    this.isHoveringTooltip = false;
    this.hide();
  };

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

// ── Helpers ────────────────────────────────────────────────────────────────

function getScrollParents(el: HTMLElement): (Element | Document)[] {
  const parents: (Element | Document)[] = [];
  let current: Element | null = el.parentElement;

  while (current && current !== document.body) {
    const { overflow, overflowX, overflowY } = getComputedStyle(current);
    if (/auto|scroll|overlay/.test(overflow + overflowX + overflowY)) {
      parents.push(current);
    }
    current = current.parentElement;
  }

  parents.push(globalThis.document);
  return parents;
}
