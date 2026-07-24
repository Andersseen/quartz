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
import { OverlayRef } from '../overlay';
import { TooltipService } from './tooltip.service';
import { TooltipPlacement, DEFAULT_TOOLTIP_CONFIG } from './tooltip.types';
import { calculatePosition } from '../overlay';

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
  readonly tooltipInteractive = input<boolean>(false);

  // ── State ────────────────────────────────────────────────────────────────

  private overlayRef: OverlayRef | null = null;
  private textTooltipEl: HTMLElement | null = null;
  private templateTooltipChild: HTMLElement | null = null;
  private showTimer: number | null = null;
  private hideTimer: number | null = null;
  private isHoveringTooltip = false;
  private scrollListeners: Array<{
    target: EventTarget;
    handler: EventListener;
    options: AddEventListenerOptions;
  }> = [];
  private overlayMountedSubscription: Subscription | null = null;

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

    const view = this.document.defaultView;
    if (!view) return;

    this.showTimer = view.setTimeout(() => {
      this.render();
    }, this.tooltipDelay());
  }

  /** Programmatically hide the tooltip */
  hide(): void {
    this.clearShowTimer();
    if (!this.isVisible()) return;

    const delay =
      this.tooltipInteractive() && this.isHoveringTooltip ? 200 : this.tooltipHideDelay();

    const view = this.document.defaultView;
    if (!view) {
      this.destroyTooltip();
      return;
    }

    this.hideTimer = view.setTimeout(() => {
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

    this.queueFrame(() => {
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

    this.overlayMountedSubscription = this.overlayRef.mounted$.subscribe((child) => {
      child.id = this.generateId();
      this.tooltipId.set(child.id);
      child.setAttribute('role', 'tooltip');
      this.templateTooltipChild = child;

      if (this.tooltipInteractive()) {
        child.addEventListener('mouseenter', this.onTooltipMouseEnter);
        child.addEventListener('mouseleave', this.onTooltipMouseLeave);
      }
    });

    this.overlayRef.open();
  }

  private destroyTooltip(): void {
    this.overlayMountedSubscription?.unsubscribe();
    this.overlayMountedSubscription = null;

    if (this.textTooltipEl) {
      this.textTooltipEl.removeEventListener('mouseenter', this.onTooltipMouseEnter);
      this.textTooltipEl.removeEventListener('mouseleave', this.onTooltipMouseLeave);
      this.textTooltipEl.remove();
      this.textTooltipEl = null;
    }

    if (this.templateTooltipChild) {
      this.templateTooltipChild.removeEventListener('mouseenter', this.onTooltipMouseEnter);
      this.templateTooltipChild.removeEventListener('mouseleave', this.onTooltipMouseLeave);
      this.templateTooltipChild = null;
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
    const parents = getScrollParents(this.elementRef.nativeElement, this.document);
    const options: AddEventListenerOptions = { passive: true };
    for (const parent of parents) {
      parent.addEventListener('scroll', onScroll, options);
      this.scrollListeners.push({ target: parent, handler: onScroll, options });
    }
  }

  private detachScrollListeners(): void {
    for (const { target, handler, options } of this.scrollListeners) {
      target.removeEventListener('scroll', handler, options);
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

function getScrollParents(el: HTMLElement, document: Document): (Element | Document)[] {
  const parents: (Element | Document)[] = [];
  let current: Element | null = el.parentElement;

  while (current && current !== document.body) {
    const style = document.defaultView?.getComputedStyle(current);
    if (!style) break;

    const { overflow, overflowX, overflowY } = style;
    if (/auto|scroll|overlay/.test(overflow + overflowX + overflowY)) {
      parents.push(current);
    }
    current = current.parentElement;
  }

  parents.push(document);
  return parents;
}
