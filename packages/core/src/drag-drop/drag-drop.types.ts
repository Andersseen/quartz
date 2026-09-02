export interface DragDropConfig {
  /** Data to transfer during drag */
  data?: unknown;
  /** Whether the element is draggable */
  disabled?: boolean;
  /** Drag handle selector */
  handle?: string;
}

export interface DropZoneConfig {
  /** Acceptable drag types */
  accept?: string[];
  /** Whether drop is disabled */
  disabled?: boolean;
  /** Whether to allow sorting/reordering */
  sortable?: boolean;
  /**
   * Explicit layout axis for before/after drop-position and sortable-index calculation.
   * When unset, falls back to measuring `getBoundingClientRect().width > height` — a
   * heuristic that can misjudge square-ish zones, short vertical lists in wide containers,
   * or wrapping layouts. Set this explicitly whenever the dropzone's aspect ratio doesn't
   * reliably reflect its scroll/item axis.
   */
  orientation?: 'horizontal' | 'vertical';
}

export interface QzDragInfo {
  data: unknown;
  element: HTMLElement;
  event: DragEvent;
}

export interface QzDragEndInfo {
  data: unknown;
  element: HTMLElement;
  event: DragEvent;
  dropped: boolean;
}

export interface QzDropInfo {
  data: unknown;
  source: HTMLElement;
  target: HTMLElement;
  event: DragEvent;
  index?: number;
}

export interface QzDragOverInfo {
  data: unknown;
  element: HTMLElement;
  event: DragEvent;
  position: 'before' | 'after' | 'inside';
}
