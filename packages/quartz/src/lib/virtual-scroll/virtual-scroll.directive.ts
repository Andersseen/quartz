import {
  Directive,
  ElementRef,
  input,
  computed,
  signal,
  OnDestroy,
  inject,
  afterNextRender,
} from '@angular/core';
import type { VirtualScrollRow } from './virtual-scroll.types';

/**
 * Virtual scroll directive that calculates which items should be rendered
 * based on the viewport size and scroll position.
 *
 * Apply it to the scrollable container. The consumer is responsible for
 * rendering the items using `visibleItems()` and setting the content height.
 *
 * @usage
 * ```html
 * <div qzVirtualScroll [items]="items" [itemSize]="50" #vs="qzVirtualScroll" class="viewport">
 *   <div class="content" [style.height.px]="vs.contentHeight()">
 *     @for (row of vs.visibleItems(); track row.index) {
 *       <div class="item" [style.top.px]="row.offset">
 *         {{ row.item.name }}
 *       </div>
 *     }
 *   </div>
 * </div>
 * ```
 */
@Directive({
  selector: '[qzVirtualScroll]',
  exportAs: 'qzVirtualScroll',
  standalone: true,
})
export class VirtualScrollDirective<T> implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);

  /** Full array of items to virtualize. */
  readonly items = input.required<T[]>();

  /** Fixed pixel height of each item. */
  readonly itemSize = input.required<number>();

  /** Extra items to render outside the viewport (default 5). */
  readonly buffer = input<number>(5);

  /** Current scroll top position of the viewport. */
  #scrollTop = signal(0);

  /** Measured height of the viewport element. */
  #viewportHeight = signal(0);

  /** Total scrollable content height. */
  readonly contentHeight = computed(() => {
    const count = this.items().length;
    const size = this.itemSize();
    return count * size;
  });

  /** First index that should be rendered. */
  readonly startIndex = computed(() => {
    const size = this.itemSize();
    if (size <= 0) return 0;

    const scrollTop = this.#scrollTop();
    const buffer = this.buffer();
    const rawIndex = Math.floor(scrollTop / size);
    return Math.max(0, rawIndex - buffer);
  });

  /** Last index that should be rendered. */
  readonly endIndex = computed(() => {
    const size = this.itemSize();
    if (size <= 0) return 0;

    const scrollTop = this.#scrollTop();
    const viewportHeight = this.#viewportHeight();
    const buffer = this.buffer();
    const count = this.items().length;
    const rawIndex = Math.ceil((scrollTop + viewportHeight) / size);
    return Math.min(count - 1, rawIndex + buffer);
  });

  /** Items currently visible (plus buffer) with their pixel offsets. */
  readonly visibleItems = computed<VirtualScrollRow<T>[]>(() => {
    const items = this.items();
    const size = this.itemSize();
    const start = this.startIndex();
    const end = this.endIndex();

    if (size <= 0 || start > end || items.length === 0) return [];

    const result: VirtualScrollRow<T>[] = [];
    for (let i = start; i <= end; i++) {
      if (i < 0 || i >= items.length) continue;
      result.push({
        item: items[i],
        index: i,
        offset: i * size,
      });
    }
    return result;
  });

  /** Number of items in the data set. */
  readonly count = computed(() => this.items().length);

  #onResize = (): void => this.#measure();

  constructor() {
    const host = this.elementRef.nativeElement;

    // Listen to scroll events
    host.addEventListener('scroll', this.#onScroll, { passive: true });

    // Measure after first paint to ensure layout is computed
    afterNextRender(() => this.#measure());

    // Re-measure on window resize (container may change size via CSS media queries)
    window.addEventListener('resize', this.#onResize);
  }

  ngOnDestroy(): void {
    const host = this.elementRef.nativeElement;
    host.removeEventListener('scroll', this.#onScroll);
    window.removeEventListener('resize', this.#onResize);
  }

  /** Scroll the viewport so that the item at index is visible. */
  scrollToIndex(index: number, behavior: ScrollBehavior = 'smooth'): void {
    const size = this.itemSize();
    const host = this.elementRef.nativeElement;
    host.scrollTo({ top: index * size, behavior });
  }

  /** Scroll to a specific pixel offset. */
  scrollToOffset(offset: number, behavior: ScrollBehavior = 'smooth'): void {
    const host = this.elementRef.nativeElement;
    host.scrollTo({ top: offset, behavior });
  }

  #onScroll = (): void => {
    this.#scrollTop.set(this.elementRef.nativeElement.scrollTop);
  };

  #measure(): void {
    const host = this.elementRef.nativeElement;
    const rect = host.getBoundingClientRect();
    // Fallback chain: border-box height → clientHeight → 320 (sensible default)
    const h = rect.height || host.clientHeight || 320;
    this.#viewportHeight.set(h);
  }
}
