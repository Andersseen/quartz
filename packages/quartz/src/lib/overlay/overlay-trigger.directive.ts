import {
  Directive,
  ElementRef,
  ViewContainerRef,
  inject,
  input,
  output,
  OnDestroy,
  TemplateRef,
  signal,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { OverlayService } from './overlay.service';
import { OverlayRef } from './overlay-ref';
import { OverlayConfig, OverlayFlipAxis, OverlayPlacement } from './overlay.types';

/**
 * Mark a <ng-template> inside your component as the overlay content.
 *
 * Usage:
 * ```html
 * <button qzOverlayTrigger [overlayTemplate]="tpl" placement="bottom-start">
 *   Open
 * </button>
 *
 * <ng-template #tpl>
 *   <div class="my-dropdown">...</div>
 * </ng-template>
 * ```
 *
 * Or pass a TemplateRef programmatically via [overlayTemplate].
 */
@Directive({
  selector: '[qzOverlayTrigger]',
  exportAs: 'qzOverlay',
  standalone: true,
  host: {
    '[class.qz-overlay-trigger]': 'true',
    '[class.qz-overlay-trigger--open]': 'isOpen()',
    '[attr.aria-expanded]': 'isOpen()',
    '[attr.aria-haspopup]': '"true"',
    '(click)': 'toggle()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class OverlayTriggerDirective implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly viewContainerRef = inject(ViewContainerRef);
  private readonly overlayService = inject(OverlayService);

  // ── Inputs ──────────────────────────────────────────────────────────────

  /** The template to render inside the overlay */
  readonly overlayTemplate = input<TemplateRef<unknown> | null>(null);

  readonly placement = input<OverlayPlacement>('bottom-start');
  readonly offset = input<number>(4);
  readonly flip = input<boolean>(true);
  readonly flipAxis = input<OverlayFlipAxis>('main');
  readonly closeOnClickOutside = input<boolean>(true);
  readonly closeOnEscape = input<boolean>(true);
  readonly closeOnScroll = input<boolean>(true);
  readonly matchAnchorWidth = input<boolean>(false);

  // ── Outputs ─────────────────────────────────────────────────────────────

  readonly opened = output<void>();
  readonly closed = output<void>();

  // ── State ────────────────────────────────────────────────────────────────

  private overlayRef: OverlayRef | null = null;
  private closedSub: Subscription | null = null;

  private readonly _isOpen = signal(false);
  readonly isOpen = this._isOpen.asReadonly();

  // ── Public API ───────────────────────────────────────────────────────────

  open(): void {
    const tpl = this.overlayTemplate();
    if (!tpl || this.overlayRef?.isOpen) return;

    // Recreate ref with current config so inputs are always fresh
    this.unsubscribeClosed();
    this.overlayRef?.destroy();
    this.overlayRef = this.overlayService.create(
      tpl,
      this.viewContainerRef,
      this.elementRef.nativeElement,
      this.buildConfig(),
    );

    this.closedSub = this.overlayRef.closed$.subscribe(() => {
      this._isOpen.set(false);
      this.closed.emit();
    });

    this.overlayRef.open();
    this._isOpen.set(true);
    this.opened.emit();
  }

  close(): void {
    this.overlayRef?.close();
  }

  toggle(): void {
    this.isOpen() ? this.close() : this.open();
  }

  /**
   * Keyboard activation for non-native hosts. Native `<button>`/`<a href>`
   * already synthesize a click from Enter/Space, so we skip them to avoid a
   * double toggle. The host must be focusable (e.g. `tabindex="0"`) to receive
   * these events.
   * @internal
   */
  onKeydown(event: KeyboardEvent): void {
    if (this.isNativelyActivatable()) return;
    if (event.key === 'Enter' || event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault();
      this.toggle();
    }
  }

  /** Recompute position (e.g. after content changes size) */
  updatePosition(): void {
    this.overlayRef?.updatePosition();
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────

  ngOnDestroy(): void {
    this.unsubscribeClosed();
    this.overlayRef?.destroy();
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private unsubscribeClosed(): void {
    this.closedSub?.unsubscribe();
    this.closedSub = null;
  }

  /** True when the host element already activates on Enter/Space natively. */
  private isNativelyActivatable(): boolean {
    const el = this.elementRef.nativeElement;
    if (el.tagName === 'BUTTON') return true;
    if (el.tagName === 'A' && el.hasAttribute('href')) return true;
    return false;
  }

  // ── Private ──────────────────────────────────────────────────────────────

  private buildConfig(): Partial<OverlayConfig> {
    return {
      placement: this.placement(),
      offset: this.offset(),
      flip: this.flip(),
      flipAxis: this.flipAxis(),
      closeOnClickOutside: this.closeOnClickOutside(),
      closeOnEscape: this.closeOnEscape(),
      closeOnScroll: this.closeOnScroll(),
      matchAnchorWidth: this.matchAnchorWidth(),
    };
  }
}
