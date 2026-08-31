// Component registry — maps CLI name → source files.
// Each entry lists only the files a consumer needs; test specs are excluded.
//
// `layer` says which real package a component's source lives in (see
// docs/ai/ARCHITECTURE.md): 'core' entries are copied from @quartz-headless/core's source,
// 'primitives' entries from @quartz-headless/primitives's source — `files` are relative to
// that package's own src/.
//
// Core components stay pure copy-source: `deps` lists sibling Core folders to also copy
// (Core has zero npm dependencies). Primitives now depend on Core as a real installed
// package rather than copied source — `peerDeps` lists the npm package(s) the CLI tells
// the consumer to install instead of copying.

const REGISTRY = {
  collection: {
    description: 'Interactive collection foundation',
    layer: 'core',
    internal: true,
    files: ['collection/collection.ts', 'collection/collection.types.ts', 'collection/index.ts'],
    deps: ['directionality'],
    docs: 'https://quartz-headless.pages.dev/docs',
  },
  focus: {
    description: 'Focus management foundation',
    layer: 'core',
    internal: true,
    files: ['focus/focus.ts', 'focus/index.ts'],
    docs: 'https://quartz-headless.pages.dev/docs',
  },
  dismiss: {
    description: 'Dismissal foundation',
    layer: 'core',
    internal: true,
    files: ['dismiss/dismiss.ts', 'dismiss/index.ts'],
    docs: 'https://quartz-headless.pages.dev/docs',
  },
  directionality: {
    description: 'LTR/RTL direction resolution and logical (inline-start/end) helpers',
    layer: 'core',
    internal: true,
    files: [
      'directionality/directionality.ts',
      'directionality/directionality.service.ts',
      'directionality/directionality.types.ts',
      'directionality/index.ts',
    ],
    docs: 'https://quartz-headless.pages.dev/directionality',
  },
  overlay: {
    description: 'Portal-based positioning system for dropdowns, menus, and popovers',
    layer: 'core',
    files: [
      'overlay/overlay.service.ts',
      'overlay/overlay-trigger.directive.ts',
      'overlay/overlay-ref.ts',
      'overlay/overlay-position.ts',
      'overlay/overlay.types.ts',
      'overlay/index.ts',
    ],
    deps: ['dismiss', 'directionality'],
    docs: 'https://quartz-headless.pages.dev/overlay',
  },
  splitter: {
    description: 'Resizable panel system with keyboard navigation and touch support',
    layer: 'core',
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
  'drag-drop': {
    description: 'Native HTML drag and drop with sortable drop zones',
    layer: 'core',
    files: [
      'drag-drop/draggable.directive.ts',
      'drag-drop/drop-zone.directive.ts',
      'drag-drop/drag-drop.service.ts',
      'drag-drop/drag-drop.types.ts',
      'drag-drop/index.ts',
    ],
    docs: 'https://quartz-headless.pages.dev/drag-drop',
  },
  'virtual-scroll': {
    description: 'Windowed rendering for long lists',
    layer: 'core',
    files: [
      'virtual-scroll/virtual-scroll.directive.ts',
      'virtual-scroll/virtual-scroll.types.ts',
      'virtual-scroll/index.ts',
    ],
    docs: 'https://quartz-headless.pages.dev/virtual-scroll',
  },
  viewport: {
    description: 'Reactive breakpoint service with viewport match directive',
    layer: 'core',
    files: [
      'viewport/viewport.service.ts',
      'viewport/viewport-match.directive.ts',
      'viewport/viewport.types.ts',
      'viewport/index.ts',
    ],
    docs: 'https://quartz-headless.pages.dev/viewport',
  },
  dialog: {
    description: 'Service-driven dialog and drawer with portal rendering',
    layer: 'primitives',
    files: [
      'dialog/dialog.service.ts',
      'dialog/dialog-ref.ts',
      'dialog/dialog.types.ts',
      'dialog/index.ts',
    ],
    peerDeps: ['@quartz-headless/core'],
    docs: 'https://quartz-headless.pages.dev/dialog',
  },
  toast: {
    description: 'Lightweight toast notification system',
    layer: 'primitives',
    files: [
      'toast/toast.service.ts',
      'toast/toast.component.ts',
      'toast/toast-container.component.ts',
      'toast/toast.types.ts',
      'toast/index.ts',
    ],
    docs: 'https://quartz-headless.pages.dev/toast',
  },
  tooltip: {
    description: 'Accessible tooltip with configurable placement',
    layer: 'primitives',
    files: [
      'tooltip/tooltip.directive.ts',
      'tooltip/tooltip.service.ts',
      'tooltip/tooltip.types.ts',
      'tooltip/index.ts',
    ],
    peerDeps: ['@quartz-headless/core'],
    docs: 'https://quartz-headless.pages.dev/tooltip',
  },
  tree: {
    description: 'Collapsible tree with keyboard navigation and selection',
    layer: 'primitives',
    files: [
      'tree/tree.component.ts',
      'tree/tree-node.component.ts',
      'tree/tree.service.ts',
      'tree/tree.types.ts',
      'tree/index.ts',
    ],
    peerDeps: ['@quartz-headless/core'],
    docs: 'https://quartz-headless.pages.dev/tree',
  },
  listbox: {
    description: 'Accessible single and multi-select listbox with keyboard navigation',
    layer: 'primitives',
    files: [
      'listbox/listbox.directive.ts',
      'listbox/listbox-option.directive.ts',
      'listbox/listbox.service.ts',
      'listbox/listbox.types.ts',
      'listbox/index.ts',
    ],
    peerDeps: ['@quartz-headless/core'],
    docs: 'https://quartz-headless.pages.dev/listbox',
  },
  menu: {
    description: 'Dropdown menu with keyboard navigation, submenus, checkbox and radio items',
    layer: 'primitives',
    files: [
      'menu/menu.directive.ts',
      'menu/menu-trigger.directive.ts',
      'menu/menu-item.directive.ts',
      'menu/menu-separator.directive.ts',
      'menu/menu-checkbox-item.directive.ts',
      'menu/menu-radio-group.directive.ts',
      'menu/menu-radio-item.directive.ts',
      'menu/menu.service.ts',
      'menu/menu.types.ts',
      'menu/index.ts',
    ],
    peerDeps: ['@quartz-headless/core'],
    docs: 'https://quartz-headless.pages.dev/menu',
  },
  popover: {
    description: 'Non-modal interactive floating surface built on Overlay',
    layer: 'primitives',
    files: [
      'popover/popover.directive.ts',
      'popover/popover-trigger.directive.ts',
      'popover/popover.types.ts',
      'popover/index.ts',
    ],
    peerDeps: ['@quartz-headless/core'],
    docs: 'https://quartz-headless.pages.dev/popover',
  },
  combobox: {
    description: 'Editable suggestions combobox with active-descendant navigation',
    layer: 'primitives',
    files: [
      'combobox/combobox.directive.ts',
      'combobox/combobox-input.directive.ts',
      'combobox/combobox-content.directive.ts',
      'combobox/combobox-listbox.directive.ts',
      'combobox/combobox-option.directive.ts',
      'combobox/combobox-trigger.directive.ts',
      'combobox/combobox.types.ts',
      'combobox/index.ts',
    ],
    peerDeps: ['@quartz-headless/core'],
    docs: 'https://quartz-headless.pages.dev/combobox',
  },
};

module.exports = { REGISTRY };
