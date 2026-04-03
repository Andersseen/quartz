// Quartz UI - Headless primitives for Angular
export const VERSION = '0.0.1';

// Overlay
export { OverlayTriggerDirective, OverlayService, OverlayRef } from './lib/overlay';
export type { OverlayPlacement, OverlayConfig, OverlayPosition } from './lib/overlay';

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
