// Quartz Core — low-level interaction infrastructure (Angular CDK equivalent).
// No entry in this file (or anywhere under this package) may import from
// @quartz-headless/primitives — enforced by eslint.config.js and core-boundary.spec.ts.

// Foundations
export {
  CollectionStore,
  DEFAULT_COLLECTION_CONFIG,
  compareDomOrder,
  findByTypeahead,
  findRelativeItem,
  firstItem,
  getElement,
  getLabel,
  isDisabled,
  lastItem,
  sortByDomOrder,
  type CollectionConfig,
  type CollectionFocusStrategy,
  type CollectionItem,
  type CollectionNavigationResult,
  type CollectionOrientation,
} from './collection';
export {
  FOCUSABLE_SELECTOR,
  createFocusRestorer,
  createFocusTrap,
  focusInitialElement,
  focusSafely,
  getFocusableElements,
  isFocusable,
  type FocusRestorer,
  type FocusTrap,
} from './focus';
export {
  createDismissController,
  type DismissConfig,
  type DismissController,
  type DismissReason,
} from './dismiss';

// Overlay
export {
  OverlayTriggerDirective,
  OverlayService,
  OverlayRef,
  calculatePosition,
  DEFAULT_OVERLAY_CONFIG,
} from './overlay';
export type {
  OverlayAnchor,
  OverlayPlacement,
  OverlayConfig,
  OverlayPosition,
  OverlayVirtualAnchor,
  OverlayFlipAxis,
} from './overlay';

// Splitter
export {
  SplitterContainerDirective,
  SplitterHandleDirective,
  SplitterPanelDirective,
  SplitterService,
  DEFAULT_SPLITTER_CONFIG,
  type SplitterOrientation,
  type SplitterState,
  type SplitterConfig,
} from './splitter';

// Drag & Drop
export { DraggableDirective, DropZoneDirective, DragDropService } from './drag-drop';
export type {
  DragDropConfig,
  DropZoneConfig,
  QzDragInfo,
  QzDragEndInfo,
  QzDropInfo,
  QzDragOverInfo,
} from './drag-drop';

// Virtual Scroll
export { VirtualScrollDirective } from './virtual-scroll';
export type { VirtualScrollConfig, VirtualScrollRow } from './virtual-scroll';

// Viewport
export { ViewportService, ViewportMatchDirective, DEFAULT_BREAKPOINTS } from './viewport';
export type { ViewportBreakpoint, ViewportBreakpoints, ViewportMatchResult } from './viewport';
