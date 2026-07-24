// Component registry — maps CLI name → source files (relative to packages/quartz/src/lib)
// Each entry lists only the files a consumer needs; test specs are excluded.

const REGISTRY = {
  overlay: {
    description: 'Portal-based positioning system for dropdowns, menus, and popovers',
    files: [
      'overlay/overlay.service.ts',
      'overlay/overlay-trigger.directive.ts',
      'overlay/overlay-ref.ts',
      'overlay/overlay-position.ts',
      'overlay/overlay.types.ts',
      'overlay/index.ts',
    ],
    docs: 'https://quartz-headless.pages.dev/overlay',
  },
  dialog: {
    description: 'Service-driven dialog and drawer with portal rendering',
    files: [
      'dialog/dialog.service.ts',
      'dialog/dialog-ref.ts',
      'dialog/dialog.types.ts',
      'dialog/index.ts',
    ],
    deps: ['overlay'],
    docs: 'https://quartz-headless.pages.dev/dialog',
  },
  splitter: {
    description: 'Resizable panel system with keyboard navigation and touch support',
    files: [
      'splitter/splitter-container.directive.ts',
      'splitter/splitter-handle.directive.ts',
      'splitter/splitter-panel.directive.ts',
      'splitter/splitter.service.ts',
      'splitter/splitter.types.ts',
      'splitter/index.ts',
    ],
    docs: 'https://quartz-headless.pages.dev/splitter',
  },
  toast: {
    description: 'Lightweight toast notification system',
    files: [
      'toast/toast.service.ts',
      'toast/toast.component.ts',
      'toast/toast-container.component.ts',
      'toast/toast.types.ts',
      'toast/index.ts',
    ],
    docs: 'https://quartz-headless.pages.dev/toast',
  },
  'drag-drop': {
    description: 'Accessible drag and drop with keyboard support',
    files: [
      'drag-drop/draggable.directive.ts',
      'drag-drop/drop-zone.directive.ts',
      'drag-drop/drag-drop.service.ts',
      'drag-drop/drag-drop.types.ts',
      'drag-drop/index.ts',
    ],
    docs: 'https://quartz-headless.pages.dev/drag-drop',
  },
  tooltip: {
    description: 'Accessible tooltip with configurable placement',
    files: [
      'tooltip/tooltip.directive.ts',
      'tooltip/tooltip.service.ts',
      'tooltip/tooltip.types.ts',
      'tooltip/index.ts',
    ],
    deps: ['overlay'],
    docs: 'https://quartz-headless.pages.dev/tooltip',
  },
  tree: {
    description: 'Collapsible tree with keyboard navigation and selection',
    files: [
      'tree/tree.component.ts',
      'tree/tree-node.component.ts',
      'tree/tree.service.ts',
      'tree/tree.types.ts',
      'tree/index.ts',
    ],
    docs: 'https://quartz-headless.pages.dev/tree',
  },
  'virtual-scroll': {
    description: 'Windowed rendering for long lists',
    files: [
      'virtual-scroll/virtual-scroll.directive.ts',
      'virtual-scroll/virtual-scroll.types.ts',
      'virtual-scroll/index.ts',
    ],
    docs: 'https://quartz-headless.pages.dev/virtual-scroll',
  },
  viewport: {
    description: 'Reactive breakpoint service with viewport match directive',
    files: [
      'viewport/viewport.service.ts',
      'viewport/viewport-match.directive.ts',
      'viewport/viewport.types.ts',
      'viewport/index.ts',
    ],
    docs: 'https://quartz-headless.pages.dev/viewport',
  },
};

module.exports = { REGISTRY };
