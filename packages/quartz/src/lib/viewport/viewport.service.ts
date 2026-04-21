import { computed, Injectable, signal, type Signal } from '@angular/core';
import { DEFAULT_BREAKPOINTS, type ViewportMatchResult } from './viewport.types';

/**
 * Root-level service that tracks viewport dimensions and media-query matches
 * using reactive signals. Tree-shakeable and side-effect free.
 */
@Injectable({ providedIn: 'root' })
export class ViewportService {
  /** Current viewport width in pixels. */
  readonly width = signal(0);

  /** Current viewport height in pixels. */
  readonly height = signal(0);

  /** Aspect ratio (width / height). */
  readonly aspectRatio = computed(() => {
    const h = this.height();
    return h > 0 ? this.width() / h : 0;
  });

  /** Viewport width is below 768px. */
  readonly isMobile = computed(() => this.width() < DEFAULT_BREAKPOINTS.md);

  /** Viewport width is between 768px and 1023px. */
  readonly isTablet = computed(() => {
    const w = this.width();
    return w >= DEFAULT_BREAKPOINTS.md && w < DEFAULT_BREAKPOINTS.lg;
  });

  /** Viewport width is 1024px or greater. */
  readonly isDesktop = computed(() => this.width() >= DEFAULT_BREAKPOINTS.lg);

  /** Match result for default breakpoints. */
  readonly match = computed<ViewportMatchResult>(() => {
    const w = this.width();
    return {
      xs: w >= DEFAULT_BREAKPOINTS.xs,
      sm: w >= DEFAULT_BREAKPOINTS.sm,
      md: w >= DEFAULT_BREAKPOINTS.md,
      lg: w >= DEFAULT_BREAKPOINTS.lg,
      xl: w >= DEFAULT_BREAKPOINTS.xl,
    };
  });

  private readonly mediaMatchers = new Map<string, MediaQueryList>();
  private readonly mediaListeners = new Map<string, (e: MediaQueryListEvent) => void>();
  private readonly mediaSignals = new Map<string, Signal<boolean>>();

  private resizeObserver: ResizeObserver | null = null;
  private observing = false;

  constructor() {
    // SSR-safe initialization: only access window in browser
    if (typeof window !== 'undefined') {
      this.#init();
    }
  }

  /**
   * Observe a custom media query string and receive a reactive signal.
   * The signal updates automatically when the query matches/unmatches.
   */
  observe(query: string): Signal<boolean> {
    const existing = this.mediaSignals.get(query);
    if (existing) return existing;

    const mql = window.matchMedia(query);
    const s = signal(mql.matches);

    const handler = (e: MediaQueryListEvent) => s.set(e.matches);
    mql.addEventListener('change', handler);

    this.mediaMatchers.set(query, mql);
    this.mediaListeners.set(query, handler);
    this.mediaSignals.set(query, s.asReadonly());

    return s.asReadonly();
  }

  /**
   * Check if viewport width is greater than or equal to a pixel value.
   */
  minWidth(px: number): Signal<boolean> {
    return this.observe(`(min-width: ${px}px)`);
  }

  /**
   * Check if viewport width is less than a pixel value.
   */
  maxWidth(px: number): Signal<boolean> {
    return this.observe(`(max-width: ${px - 1}px)`);
  }

  /**
   * Check if viewport width is within a range (inclusive).
   */
  between(min: number, max: number): Signal<boolean> {
    return this.observe(`(min-width: ${min}px) and (max-width: ${max}px)`);
  }

  /** Clean up all observers. Useful for testing. */
  destroy(): void {
    this.resizeObserver?.disconnect();
    this.observing = false;

    for (const [query, mql] of this.mediaMatchers) {
      const listener = this.mediaListeners.get(query);
      if (listener) mql.removeEventListener('change', listener);
    }
    this.mediaMatchers.clear();
    this.mediaListeners.clear();
    this.mediaSignals.clear();
  }

  #init(): void {
    const updateSize = () => {
      this.width.set(window.innerWidth);
      this.height.set(window.innerHeight);
    };

    updateSize();

    if (typeof ResizeObserver !== 'undefined') {
      // Observe documentElement for size changes (includes zoom, devicePixelRatio changes)
      this.resizeObserver = new ResizeObserver(() => updateSize());
      this.resizeObserver.observe(document.documentElement);
      this.observing = true;
    } else {
      window.addEventListener('resize', updateSize);
    }
  }
}
