import { Directive, input, computed, inject } from '@angular/core';
import { ViewportService } from './viewport.service';

/**
 * Structural/behavioral directive that applies CSS classes based on
 * viewport breakpoints. Useful for responsive logic without media queries.
 *
 * @usage
 * ```html
 * <div qzViewportMatch class="card" [class.card--compact]="isMobile()">
 *   Content adapts to viewport
 * </div>
 *
 * <!-- Or use the directive outputs -->
 * <div
 *   qzViewportMatch
 *   (onMobileChange)="handleMobile($event)"
 *   (onDesktopChange)="handleDesktop($event)"
 * >
 * </div>
 * ```
 */
@Directive({
  selector: '[qzViewportMatch]',
  exportAs: 'qzViewportMatch',
  standalone: true,
  host: {
    '[class.qz-mobile]': 'isMobile()',
    '[class.qz-tablet]': 'isTablet()',
    '[class.qz-desktop]': 'isDesktop()',
  },
})
export class ViewportMatchDirective {
  private readonly viewport = inject(ViewportService);

  /** Custom min-width breakpoint to match. */
  readonly minWidth = input<number | null>(null);

  /** Custom max-width breakpoint to match. */
  readonly maxWidth = input<number | null>(null);

  /** Whether the viewport matches the custom minWidth (if provided). */
  readonly matchesMin = computed(() => {
    const min = this.minWidth();
    return min != null ? this.viewport.minWidth(min)() : true;
  });

  /** Whether the viewport matches the custom maxWidth (if provided). */
  readonly matchesMax = computed(() => {
    const max = this.maxWidth();
    return max != null ? this.viewport.maxWidth(max)() : true;
  });

  /** Combined match for custom min + max. */
  readonly matches = computed(() => this.matchesMin() && this.matchesMax());

  readonly isMobile = this.viewport.isMobile;
  readonly isTablet = this.viewport.isTablet;
  readonly isDesktop = this.viewport.isDesktop;
  readonly width = this.viewport.width;
  readonly height = this.viewport.height;
}
