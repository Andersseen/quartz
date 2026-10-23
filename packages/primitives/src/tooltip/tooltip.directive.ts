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
  untracked,
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
  resolveDirection,
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
  private cancelFrame: (() => void) | null = null;
  // Interaction sources are tracked separately so one ending (pointer leaves, focus leaves)
  // cannot hide a tooltip the other source still asks for.
  private hovered = false;
  private focused = false;
  // The id this tooltip appended to the host's `aria-describedby` (removed again on teardown).
  private describedId: string | null = null;

  readonly tooltipId = signal<string | null>(null);

  // ── Host bindings ────────────────────────────────────────────────────────

  constructor() {
    effect(() => {
      const content = this.qzTooltip();
      const disabled = this.tooltipDisabled();
      untracked(() => {
        // Losing the content — or being disabled while open — must take the tooltip down.
        if (!content || disabled) {
          this.hideImmediately();
          return;
        }
        // Content changed while visible: swap it in place rather than showing stale text.
        if (this.isVisible()) this.render();
      });
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

    // One pending hide at a time: a second call must not orphan the first timer.
    this.clearHideTimer();
    this.hideTimer = view.setTimeout(() => {
      this.hideTimer = null;
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
    const el = this.tooltipService.createTextElement(text);
    this.textTooltipEl = el;
    el.id = el.id || this.generateId();
    this.tooltipId.set(el.id);
    this.addDescription(el.id);

    // Hidden until measured, otherwise it flashes at the viewport origin for a frame.
    el.style.visibility = 'hidden';
    this.cancelFrame = this.queueFrame(() => {
      this.cancelFrame = null;
      if (this.textTooltipEl !== el) return;
      const view = this.document.defaultView;
      const pos = calculatePosition(
        this.elementRef.nativeElement.getBoundingClientRect(),
        el,
        this.tooltipPlacement(),
        this.tooltipOffset(),
        true,
        'main',
        view ? { width: view.innerWidth, height: view.innerHeight } : undefined,
        resolveDirection(this.elementRef.nativeElement),
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
      child.id = child.id || this.generateId();
      this.tooltipId.set(child.id);
      this.addDescription(child.id);
      child.setAttribute('role', 'tooltip');
      this.templateTooltipChild = child;
    });

    this.overlayRef.open();
    this.attachDismissListeners();
  }

  private destroyTooltip(): void {
    this.cancelFrame?.();
    this.cancelFrame = null;
    this.removeDescription();
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

  /** Schedules `callback` for the next frame and returns a function that cancels it. */
  private queueFrame(callback: () => void): () => void {
    const view = this.document.defaultView;
    if (view?.requestAnimationFrame) {
      const id = view.requestAnimationFrame(callback);
      return () => view.cancelAnimationFrame(id);
    }
    callback();
    return () => undefined;
  }

  /** Appends `id` to the host's `aria-describedby`, keeping any descriptions it already has. */
  private addDescription(id: string): void {
    this.removeDescription();
    const host: HTMLElement = this.elementRef.nativeElement;
    const tokens = (host.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    if (!tokens.includes(id)) tokens.push(id);
    host.setAttribute('aria-describedby', tokens.join(' '));
    this.describedId = id;
  }

  /** Removes only this tooltip's id; the attribute goes away only if nothing else remains. */
  private removeDescription(): void {
    if (this.describedId === null) return;
    const host: HTMLElement = this.elementRef.nativeElement;
    const tokens = (host.getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter((token) => token && token !== this.describedId);
    if (tokens.length) host.setAttribute('aria-describedby', tokens.join(' '));
    else host.removeAttribute('aria-describedby');
    this.describedId = null;
  }

  // ── Host event handlers (declared in host to avoid decorator bloat) ──────

  /** @internal */
  onMouseEnter(): void {
    this.hovered = true;
    this.show();
  }

  /** @internal */
  onMouseLeave(): void {
    this.hovered = false;
    if (!this.focused) this.hide();
  }

  /** @internal */
  onFocus(): void {
    this.focused = true;
    this.show();
  }

  /** @internal */
  onBlur(): void {
    this.focused = false;
    if (!this.hovered) this.hide();
  }
}
