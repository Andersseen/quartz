// Quartz Headless - primitives for Angular

// Overlay
export { OverlayTriggerDirective, OverlayService, OverlayRef } from './lib/overlay';
export type { OverlayPlacement, OverlayConfig, OverlayPosition } from './lib/overlay';

// Dialog & Drawer
export { DialogService, DialogRef, type DialogPosition, type DialogConfig } from './lib/dialog';

// Splitter
export {
  SplitterContainerDirective,
  SplitterHandleDirective,
  SplitterPanelDirective,
  SplitterService,
  type SplitterOrientation,
  type SplitterState,
  type SplitterConfig,
} from './lib/splitter';

// Toast
export {
  ToastService,
  ToastComponent,
  ToastContainerComponent,
  type Toast,
  type ToastOptions,
  type ToastType,
  type ToastPosition,
  DEFAULT_TOAST_OPTIONS,
} from './lib/toast';

// Drag & Drop
export { DraggableDirective, DropZoneDirective, DragDropService } from './lib/drag-drop';
export type {
  DragDropConfig,
  DropZoneConfig,
  QzDragInfo,
  QzDragEndInfo,
  QzDropInfo,
  QzDragOverInfo,
  DragDropOrientation,
} from './lib/drag-drop';

// Tooltip
export { TooltipDirective, TooltipService, DEFAULT_TOOLTIP_CONFIG } from './lib/tooltip';
export type { TooltipConfig, TooltipPlacement } from './lib/tooltip';

// Tree
export { TreeComponent, TreeNodeComponent, TreeService, DEFAULT_TREE_CONFIG } from './lib/tree';
export type { TreeNode, TreeConfig, TreeNodeContext } from './lib/tree';

// Virtual Scroll
export { VirtualScrollDirective } from './lib/virtual-scroll';
export type { VirtualScrollConfig, VirtualScrollRow } from './lib/virtual-scroll';

// Viewport
export { ViewportService, ViewportMatchDirective, DEFAULT_BREAKPOINTS } from './lib/viewport';
export type { ViewportBreakpoint, ViewportBreakpoints, ViewportMatchResult } from './lib/viewport';
