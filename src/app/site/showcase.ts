/**
 * What each component page shows: the live examples (`DOC_DEMOS` ids) and the interactive
 * playground (`DOC_PLAYGROUNDS` id), keyed by catalogue slug. It mirrors the `::demo[...]` and
 * `::playground[...]` directives of the matching documentation page, in the same order;
 * `showcase.spec.ts` fails when the two drift apart. Core APIs without visual output (Collection,
 * Dismiss, Focus) have no entry.
 */
export interface Showcase {
  demos: readonly string[];
  playground?: string;
}

export const SHOWCASE: Readonly<Record<string, Showcase>> = {
  // Core
  directionality: { demos: ['directionality'] },
  'drag-drop': { demos: ['drag-drop'] },
  overlay: { demos: ['overlay'] },
  'scroll-lock': { demos: ['scroll-lock'] },
  splitter: { demos: ['splitter'] },
  viewport: { demos: ['viewport'] },
  'virtual-scroll': { demos: ['virtual-scroll'] },
  // Primitives
  accordion: { demos: ['accordion'], playground: 'quartz-accordion' },
  autofill: { demos: ['controls-text-files'] },
  avatar: { demos: ['avatar'], playground: 'quartz-avatar' },
  checkbox: { demos: ['checkbox'], playground: 'quartz-checkbox' },
  combobox: { demos: ['combobox'], playground: 'quartz-combobox' },
  'date-picker': { demos: ['date-forms', 'date-picker'], playground: 'quartz-date-picker' },
  'date-range-picker': { demos: ['date-range-picker'], playground: 'quartz-date-range-picker' },
  dialog: { demos: ['dialog'] },
  drawer: { demos: ['drawer'], playground: 'quartz-drawer' },
  'file-upload': { demos: ['controls-text-files'] },
  'form-field': { demos: ['controls-text-files'] },
  'input-otp': { demos: ['controls-text-files'], playground: 'quartz-input-otp' },
  listbox: { demos: ['listbox'], playground: 'quartz-listbox' },
  menu: { demos: ['menu', 'menu-groups'] },
  meter: { demos: ['meter'], playground: 'quartz-meter' },
  navbar: { demos: ['navbar'] },
  'navigation-menu': { demos: ['navigation-menu'], playground: 'quartz-navigation-menu' },
  pagination: { demos: ['pagination'], playground: 'quartz-pagination' },
  popover: { demos: ['popover', 'popover-arrow'], playground: 'quartz-popover-arrow' },
  progress: { demos: ['progress'], playground: 'quartz-progress' },
  'radio-group': { demos: ['radio-group'], playground: 'quartz-radio-group' },
  'range-slider': { demos: ['range-slider'], playground: 'quartz-range-slider' },
  resizable: { demos: ['resizable'], playground: 'quartz-resizable' },
  'search-composition': { demos: ['controls-text-files'] },
  select: { demos: ['select'], playground: 'quartz-select' },
  sidebar: { demos: ['sidebar'], playground: 'quartz-sidebar' },
  slider: { demos: ['slider'], playground: 'quartz-slider' },
  stepper: { demos: ['stepper'] },
  switch: { demos: ['switch'], playground: 'quartz-switch' },
  tabs: { demos: ['tabs'], playground: 'quartz-tabs' },
  toast: { demos: ['toast'], playground: 'quartz-toast' },
  'toggle-group': { demos: ['toggle-group'], playground: 'quartz-toggle-group' },
  toggle: { demos: ['toggle'], playground: 'quartz-toggle' },
  toolbar: { demos: ['toolbar'], playground: 'quartz-toolbar' },
  tooltip: { demos: ['tooltip', 'tooltip-arrow'], playground: 'quartz-tooltip-arrow' },
  tree: { demos: ['tree'] },
};

/** Readable titles for example ids that are not simply the component name. */
const DEMO_TITLES: Readonly<Record<string, string>> = {
  'controls-text-files': 'Text, file and form controls',
  'date-forms': 'With Angular Forms',
  'menu-groups': 'Groups and labels',
  'popover-arrow': 'With an arrow',
  'tooltip-arrow': 'With an arrow',
};

export function demoTitle(id: string, componentName: string): string {
  return DEMO_TITLES[id] ?? componentName;
}
