// Quartz UI - Headless primitives for Angular
export const VERSION = '0.0.1';

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
