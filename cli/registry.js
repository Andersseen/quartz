// Component registry — maps CLI name → source files (relative to packages/quartz/src)
// Each entry lists only the files a consumer needs; test specs are excluded.
//
// `layer` mirrors the library's Core / Headless Primitives split (see
// docs/ai/ARCHITECTURE.md): 'core' entries carry only low-level interaction
// infrastructure, 'primitives' entries are accessible UI patterns built on Core. The CLI
// copies each component into `<output>/<layer>/<name>/` so relative imports between a
// primitive and its Core deps resolve without any path rewriting.

const REGISTRY = {
  collection: {
    description: 'Interactive collection foundation',
    layer: 'core',
    internal: true,
    files: [
      'core/collection/collection.ts',
      'core/collection/collection.types.ts',
      'core/collection/index.ts',
    ],
    docs: 'https://quartz-headless.pages.dev/docs',
  },
  focus: {
    description: 'Focus management foundation',
    layer: 'core',
    internal: true,
    files: ['core/focus/focus.ts', 'core/focus/index.ts'],
    docs: 'https://quartz-headless.pages.dev/docs',
  },
  dismiss: {
    description: 'Dismissal foundation',
    layer: 'core',
    internal: true,
    files: ['core/dismiss/dismiss.ts', 'core/dismiss/index.ts'],
    docs: 'https://quartz-headless.pages.dev/docs',
  },
  overlay: {
    description: 'Portal-based positioning system for dropdowns, menus, and popovers',
    layer: 'core',
    files: [
      'core/overlay/overlay.service.ts',
      'core/overlay/overlay-trigger.directive.ts',
      'core/overlay/overlay-ref.ts',
      'core/overlay/overlay-position.ts',
      'core/overlay/overlay.types.ts',
      'core/overlay/index.ts',
    ],
    docs: 'https://quartz-headless.pages.dev/overlay',
  },
  splitter: {
    description: 'Resizable panel system with keyboard navigation and touch support',
    layer: 'core',
    files: [
      'core/splitter/splitter-container.directive.ts',
      'core/splitter/splitter-handle.directive.ts',
      'core/splitter/splitter-panel.directive.ts',
      'core/splitter/splitter.service.ts',
      'core/splitter/splitter.types.ts',
      'core/splitter/index.ts',
    ],
    docs: 'https://quartz-headless.pages.dev/splitter',
  },
  'drag-drop': {
    description: 'Native HTML drag and drop with sortable drop zones',
    layer: 'core',
    files: [
      'core/drag-drop/draggable.directive.ts',
      'core/drag-drop/drop-zone.directive.ts',
      'core/drag-drop/drag-drop.service.ts',
      'core/drag-drop/drag-drop.types.ts',
      'core/drag-drop/index.ts',
    ],
    docs: 'https://quartz-headless.pages.dev/drag-drop',
  },
  'virtual-scroll': {
    description: 'Windowed rendering for long lists',
    layer: 'core',
    files: [
      'core/virtual-scroll/virtual-scroll.directive.ts',
      'core/virtual-scroll/virtual-scroll.types.ts',
      'core/virtual-scroll/index.ts',
    ],
    docs: 'https://quartz-headless.pages.dev/virtual-scroll',
  },
  viewport: {
    description: 'Reactive breakpoint service with viewport match directive',
    layer: 'core',
    files: [
      'core/viewport/viewport.service.ts',
      'core/viewport/viewport-match.directive.ts',
      'core/viewport/viewport.types.ts',
      'core/viewport/index.ts',
    ],
    docs: 'https://quartz-headless.pages.dev/viewport',
  },
  dialog: {
    description: 'Service-driven dialog and drawer with portal rendering',
    layer: 'primitives',
    files: [
      'primitives/dialog/dialog.service.ts',
      'primitives/dialog/dialog-ref.ts',
      'primitives/dialog/dialog.types.ts',
      'primitives/dialog/index.ts',
    ],
    deps: ['focus', 'dismiss'],
    docs: 'https://quartz-headless.pages.dev/dialog',
  },
  toast: {
    description: 'Lightweight toast notification system',
    layer: 'primitives',
    files: [
      'primitives/toast/toast.service.ts',
      'primitives/toast/toast.component.ts',
      'primitives/toast/toast-container.component.ts',
      'primitives/toast/toast.types.ts',
      'primitives/toast/index.ts',
    ],
    docs: 'https://quartz-headless.pages.dev/toast',
  },
  tooltip: {
    description: 'Accessible tooltip with configurable placement',
    layer: 'primitives',
    files: [
      'primitives/tooltip/tooltip.directive.ts',
      'primitives/tooltip/tooltip.service.ts',
      'primitives/tooltip/tooltip.types.ts',
      'primitives/tooltip/index.ts',
    ],
    deps: ['overlay', 'dismiss'],
    docs: 'https://quartz-headless.pages.dev/tooltip',
  },
  tree: {
    description: 'Collapsible tree with keyboard navigation and selection',
    layer: 'primitives',
    files: [
      'primitives/tree/tree.component.ts',
      'primitives/tree/tree-node.component.ts',
      'primitives/tree/tree.service.ts',
      'primitives/tree/tree.types.ts',
      'primitives/tree/index.ts',
    ],
    deps: ['collection'],
    docs: 'https://quartz-headless.pages.dev/tree',
  },
  listbox: {
    description: 'Accessible single and multi-select listbox with keyboard navigation',
    layer: 'primitives',
    files: [
      'primitives/listbox/listbox.directive.ts',
      'primitives/listbox/listbox-option.directive.ts',
      'primitives/listbox/listbox.service.ts',
      'primitives/listbox/listbox.types.ts',
      'primitives/listbox/index.ts',
    ],
    deps: ['collection'],
    docs: 'https://quartz-headless.pages.dev/listbox',
  },
};

module.exports = { REGISTRY };
