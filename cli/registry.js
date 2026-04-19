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
    peerDeps: ['@angular/cdk'],
    docs: 'https://quartz-ui.pages.dev/overlay',
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
    docs: 'https://quartz-ui.pages.dev/dialog',
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
    docs: 'https://quartz-ui.pages.dev/splitter',
  },
  toast: {
    description: 'Lightweight toast notification system',
    files: [
      'toast/toast.service.ts',
      'toast/toast.component.ts',
      'toast/toast-container.component.ts',
      'toast/toast.model.ts',
      'toast/index.ts',
    ],
    docs: 'https://quartz-ui.pages.dev/toast',
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
    docs: 'https://quartz-ui.pages.dev/drag-drop',
  },
  tooltip: {
    description: 'Accessible tooltip with configurable placement (coming soon)',
    soon: true,
    files: [],
    deps: ['overlay'],
    docs: 'https://quartz-ui.pages.dev/tooltip',
  },
  listbox: {
    description: 'WAI-ARIA listbox with keyboard navigation and selection (coming soon)',
    soon: true,
    files: [],
    docs: 'https://quartz-ui.pages.dev/listbox',
  },
};

module.exports = { REGISTRY };
