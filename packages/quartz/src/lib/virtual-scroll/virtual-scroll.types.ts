/**
 * Represents a single visible row in the virtual viewport.
 */
export interface VirtualScrollRow<T> {
  /** The original data item. */
  item: T;
  /** The flat index in the original items array. */
  index: number;
  /** Pixel offset from the top of the content container. */
  offset: number;
}

/**
 * Configuration object for virtual scroll.
 */
export interface VirtualScrollConfig {
  /** Height of each item in pixels (fixed-size mode). */
  itemSize: number;
  /** Extra items to render above and below the viewport (default 5). */
  buffer?: number;
  /** Function to compute item height at runtime (variable-size mode). */
  itemSizeFn?: (index: number, item: unknown) => number;
}
