/**
 * The website's capability catalogue. It is a *projection* of what already exists, not a second
 * API inventory: every entry points at a documentation route, and `catalogue.spec.ts` proves that
 * (a) each route has a Markdown page under `src/content/docs`, (b) each documentation page of the
 * Core and Primitives groups is reachable from here, and (c) every named export exists in the
 * generated public-API snapshots (`docs/api/snapshots`, the authoritative export registry).
 */

export type CatalogueLayer = 'core' | 'primitives';

/**
 * - `export`: a family of public exports in this package.
 * - `alias`: documented under another name; the behaviour is the linked Core API.
 * - `composition`: a recipe built from native HTML and existing Quartz pieces; no Quartz export.
 */
export type CatalogueKind = 'export' | 'alias' | 'composition';

export type CategoryId = 'foundations' | 'floating' | 'selection' | 'navigation' | 'feedback';

export interface Category {
  id: CategoryId;
  label: string;
  summary: string;
}

export interface CatalogueEntry {
  name: string;
  layer: CatalogueLayer;
  category: CategoryId;
  kind: CatalogueKind;
  /** Documentation route; the page is the source of truth for behaviour. */
  path: string;
  description: string;
  keywords: readonly string[];
  /** Public exports that back the entry (checked against the API snapshots). */
  exports: readonly string[];
  /** For `alias` and `composition` entries: what it is really built from. */
  note?: string;
  /** For `alias` entries: the documentation route of the API that actually provides it. */
  backedBy?: string;
}

export const CATEGORIES: readonly Category[] = [
  {
    id: 'foundations',
    label: 'Core foundations',
    summary: 'Interaction infrastructure the primitives are built on.',
  },
  {
    id: 'floating',
    label: 'Floating & overlays',
    summary: 'Layered surfaces: positioning, dismissal, focus and scroll.',
  },
  {
    id: 'selection',
    label: 'Selection & forms',
    summary: 'Controls, pickers and form composition.',
  },
  {
    id: 'navigation',
    label: 'Navigation & layout',
    summary: 'Disclosure, wayfinding and resizable structure.',
  },
  {
    id: 'feedback',
    label: 'Data & feedback',
    summary: 'Status, measurement, identity and large data.',
  },
];

const core = (
  name: string,
  slug: string,
  category: CategoryId,
  description: string,
  keywords: string[],
  exports: string[],
): CatalogueEntry => ({
  name,
  layer: 'core',
  category,
  kind: 'export',
  path: `/docs/core/${slug}`,
  description,
  keywords,
  exports,
});

const primitive = (
  name: string,
  slug: string,
  category: CategoryId,
  description: string,
  keywords: string[],
  exports: string[],
  extra: Partial<Pick<CatalogueEntry, 'kind' | 'note' | 'backedBy'>> = {},
): CatalogueEntry => ({
  name,
  layer: 'primitives',
  category,
  kind: 'export',
  path: `/docs/primitives/${slug}`,
  description,
  keywords,
  exports,
  ...extra,
});

export const CATALOGUE: readonly CatalogueEntry[] = [
  // ── Core ──────────────────────────────────────────────────────────────────────
  core(
    'Collection',
    'collection',
    'foundations',
    'Item registration in DOM order with roving focus, typeahead and disabled skipping.',
    ['roving tabindex', 'keyboard', 'typeahead', 'registry', 'active item'],
    ['CollectionStore'],
  ),
  core(
    'Focus',
    'focus',
    'foundations',
    'Focus trap, initial focus and safe focus restoration helpers.',
    ['trap', 'restore', 'modal', 'tab order', 'inert'],
    ['createFocusTrap', 'createFocusRestorer'],
  ),
  core(
    'Dismiss',
    'dismiss',
    'foundations',
    'One controller for Escape, outside pointer, focus-outside and scroll dismissal.',
    ['escape', 'click outside', 'close', 'layer stack'],
    ['createDismissController'],
  ),
  core(
    'Directionality',
    'directionality',
    'foundations',
    'LTR/RTL resolution and direction-aware inline keys.',
    ['rtl', 'ltr', 'bidi', 'arrow keys', 'dir'],
    ['DirectionalityService'],
  ),
  core(
    'ScrollLock',
    'scroll-lock',
    'foundations',
    'Document-scoped body scroll coordination for modal layers.',
    ['body scroll', 'modal', 'overflow', 'lock'],
    ['createScrollLock'],
  ),
  core(
    'Viewport',
    'viewport',
    'foundations',
    'Reactive breakpoint and size matching as signals.',
    ['breakpoint', 'media query', 'responsive', 'mobile', 'resize'],
    ['ViewportService', 'ViewportMatchDirective'],
  ),
  core(
    'DragDrop',
    'drag-drop',
    'foundations',
    'Native pointer-based drag sources and drop zones, including sortable lists.',
    ['draggable', 'dropzone', 'sortable', 'reorder', 'pointer'],
    ['DraggableDirective', 'DropZoneDirective', 'DragDropService'],
  ),
  core(
    'Overlay',
    'overlay',
    'floating',
    'Portal rendering with placement, auto-flip, arrows and anchor tracking.',
    ['portal', 'positioning', 'dropdown', 'flip', 'anchor', 'floating'],
    ['OverlayService', 'OverlayTriggerDirective'],
  ),
  core(
    'Splitter',
    'splitter',
    'navigation',
    'Container, panels and a keyboard- and pointer-operable separator handle.',
    ['resize', 'panes', 'separator', 'split view', 'resizable'],
    ['SplitterContainerDirective', 'SplitterPanelDirective', 'SplitterHandleDirective'],
  ),
  core(
    'VirtualScroll',
    'virtual-scroll',
    'feedback',
    'Windowed rendering so very long lists only mount what is visible.',
    ['long list', 'windowing', 'performance', 'infinite', 'rows'],
    ['VirtualScrollDirective'],
  ),

  // ── Primitives: floating & overlays ───────────────────────────────────────────
  primitive(
    'Dialog',
    'dialog',
    'floating',
    'Modal dialog with backdrop, focus trap, scroll lock and focus restoration.',
    ['modal', 'alert dialog', 'confirm', 'portal', 'escape'],
    ['DialogService'],
  ),
  primitive(
    'Drawer',
    'drawer',
    'floating',
    'Edge-anchored modal panel on Dialog, with writing-direction-aware sides and exit transitions.',
    ['sheet', 'side panel', 'slide over', 'off-canvas', 'bottom sheet'],
    ['DrawerService'],
  ),
  primitive(
    'Popover',
    'popover',
    'floating',
    'Non-modal floating surface for interactive content; no focus trap.',
    ['floating', 'dropdown', 'non-modal', 'panel'],
    ['PopoverDirective'],
  ),
  primitive(
    'Tooltip',
    'tooltip',
    'floating',
    'Hover and focus descriptions with delays, placement and rich templates.',
    ['hint', 'description', 'hover', 'aria-describedby'],
    ['TooltipDirective'],
  ),
  primitive(
    'Menu',
    'menu',
    'floating',
    'Dropdown menus with submenus, checkable items, radio groups and typeahead.',
    ['dropdown', 'context menu', 'submenu', 'actions', 'menuitem'],
    ['MenuDirective', 'MenuTriggerDirective'],
  ),

  // ── Primitives: selection & forms ─────────────────────────────────────────────
  primitive(
    'Select',
    'select',
    'selection',
    'Button-triggered select, single or multiple, with groups and a listbox popup.',
    ['dropdown', 'picker', 'choose', 'single', 'multiple'],
    ['SelectDirective'],
  ),
  primitive(
    'Listbox',
    'listbox',
    'selection',
    'Inline WAI-ARIA listbox for single and multiple selection.',
    ['options', 'list', 'selection', 'multi-select'],
    ['ListboxDirective'],
  ),
  primitive(
    'Combobox',
    'combobox',
    'selection',
    'Editable combobox with filtering, active-descendant suggestions and async-safe queries.',
    ['autocomplete', 'typeahead', 'search', 'suggestions', 'input'],
    ['ComboboxDirective'],
  ),
  primitive(
    'Checkbox',
    'checkbox',
    'selection',
    'Button-based checkbox with checked, unchecked and mixed state.',
    ['boolean', 'indeterminate', 'mixed', 'tri-state'],
    ['CheckboxDirective'],
  ),
  primitive(
    'RadioGroup',
    'radio-group',
    'selection',
    'Standalone radio group with roving focus, orientation and RTL.',
    ['radio', 'single choice', 'options'],
    ['RadioGroupDirective'],
  ),
  primitive(
    'Switch',
    'switch',
    'selection',
    'Button-based boolean switch for settings that apply immediately.',
    ['toggle', 'on off', 'setting', 'boolean'],
    ['SwitchDirective'],
  ),
  primitive(
    'Toggle',
    'toggle',
    'selection',
    'Pressed/unpressed button state with aria-pressed.',
    ['button', 'pressed', 'bold', 'aria-pressed'],
    ['ToggleDirective'],
  ),
  primitive(
    'ToggleGroup',
    'toggle-group',
    'selection',
    'Single or multiple pressed items with roving focus and explicit deselection.',
    ['segmented control', 'button group', 'formatting'],
    ['ToggleGroupDirective'],
  ),
  primitive(
    'Slider',
    'slider',
    'selection',
    'Single-thumb slider with decimal-safe stepping, RTL and vertical geometry.',
    ['range', 'volume', 'number', 'thumb', 'step'],
    ['SliderDirective'],
  ),
  primitive(
    'RangeSlider',
    'range-slider',
    'selection',
    'Two-thumb range with non-crossing thumbs, minimum distance and { low, high } forms value.',
    ['two thumbs', 'price range', 'min max', 'interval'],
    ['RangeSliderDirective'],
  ),
  primitive(
    'DatePicker',
    'date-picker',
    'selection',
    'Inline calendar for one local civil date with locale-aware names and keyboard grid.',
    ['calendar', 'date', 'day', 'month'],
    ['DatePickerDirective'],
  ),
  primitive(
    'DateRangePicker',
    'date-range-picker',
    'selection',
    'Inline calendar for date ranges with partial selection and hover preview.',
    ['calendar', 'range', 'start end', 'booking'],
    ['DateRangePickerDirective'],
  ),
  primitive(
    'InputOTP',
    'input-otp',
    'selection',
    'One-time-code input: one real text field with presentational slots.',
    ['otp', 'verification code', 'pin', '2fa', 'one-time'],
    ['InputOtpComponent'],
  ),
  primitive(
    'FormField',
    'form-field',
    'selection',
    'Stable labels, descriptions and errors for native and Quartz controls.',
    ['label', 'error', 'validation', 'aria-describedby', 'angular forms'],
    ['FormFieldDirective'],
  ),
  primitive(
    'FileUpload',
    'file-upload',
    'selection',
    'Native file picker and dropzone filtering; no upload service.',
    ['file input', 'dropzone', 'drag and drop', 'accept', 'attachments'],
    ['FileUploadDirective', 'FileDropzoneDirective'],
  ),
  primitive(
    'Autofill',
    'autofill',
    'selection',
    'Best-effort detection of browser autofill transitions on native inputs.',
    ['autocomplete', 'browser fill', 'credentials', 'address'],
    ['AutofillDirective'],
  ),
  primitive(
    'Search',
    'search-composition',
    'selection',
    'A recipe: native input + Angular Forms + a clear button. There is no Search export.',
    ['search box', 'clear', 'input', 'filter', 'native html'],
    [],
    {
      kind: 'composition',
      note: 'Native HTML composition, not a Quartz primitive.',
    },
  ),

  // ── Primitives: navigation & layout ───────────────────────────────────────────
  primitive(
    'Tabs',
    'tabs',
    'navigation',
    'Tablist and panels with roving focus, manual or automatic activation.',
    ['tablist', 'panels', 'tabpanel', 'orientation'],
    ['TabsDirective'],
  ),
  primitive(
    'Accordion',
    'accordion',
    'navigation',
    'Disclosure sections: single, collapsible or multiple open.',
    ['disclosure', 'collapse', 'expand', 'faq'],
    ['AccordionDirective'],
  ),
  primitive(
    'Stepper',
    'stepper',
    'navigation',
    'Sequential flow with linear navigation, completed and disabled steps.',
    ['wizard', 'steps', 'progress flow', 'multi-step'],
    ['StepperDirective'],
  ),
  primitive(
    'Tree',
    'tree',
    'navigation',
    'Expandable hierarchical list with keyboard navigation and selection.',
    ['file explorer', 'nested', 'treeview', 'hierarchy'],
    ['TreeComponent'],
  ),
  primitive(
    'Sidebar',
    'sidebar',
    'navigation',
    'Push and overlay sidebar behaviour with collapsed state and responsive switching.',
    ['app shell', 'drawer navigation', 'collapse', 'layout'],
    ['SidebarDirective'],
  ),
  primitive(
    'Navbar',
    'navbar',
    'navigation',
    'Sticky, scrolled and reveal state with responsive mobile menu control.',
    ['header', 'sticky', 'scroll direction', 'mobile menu'],
    ['NavbarDirective'],
  ),
  primitive(
    'NavigationMenu',
    'navigation-menu',
    'navigation',
    'Site navigation links with one keyboard-accessible flyout panel.',
    ['mega menu', 'links', 'flyout', 'site nav'],
    ['NavigationMenuDirective'],
  ),
  primitive(
    'Pagination',
    'pagination',
    'navigation',
    'Bounded page navigation with current-page semantics and focus recovery.',
    ['pages', 'next previous', 'paging'],
    ['PaginationDirective'],
  ),
  primitive(
    'Toolbar',
    'toolbar',
    'navigation',
    'Action toolbar with roving focus and direction-aware keys.',
    ['actions', 'buttons', 'roving focus', 'editor'],
    ['ToolbarDirective'],
  ),
  primitive(
    'Resizable',
    'resizable',
    'navigation',
    'Resizable panels. Documented as its own page, but it is the Core Splitter.',
    ['split view', 'panes', 'drag handle', 'separator'],
    [],
    {
      kind: 'alias',
      backedBy: '/docs/core/splitter',
      note: 'Backed by Core Splitter; there is no separate Resizable export.',
    },
  ),

  // ── Primitives: data & feedback ───────────────────────────────────────────────
  primitive(
    'Toast',
    'toast',
    'feedback',
    'Transient, non-interrupting notifications with live-region semantics.',
    ['notification', 'snackbar', 'alert', 'live region', 'status'],
    ['ToastService', 'ToastContainerComponent'],
  ),
  primitive(
    'Progress',
    'progress',
    'feedback',
    'Progressbar semantics for work moving toward completion.',
    ['progressbar', 'loading', 'determinate', 'indeterminate'],
    ['ProgressDirective'],
  ),
  primitive(
    'Meter',
    'meter',
    'feedback',
    'Scalar measurement within a known range (not task progress).',
    ['gauge', 'usage', 'level', 'measurement'],
    ['MeterDirective'],
  ),
  primitive(
    'Avatar',
    'avatar',
    'feedback',
    'Image loading with consumer-supplied fallback and SSR-safe state.',
    ['profile picture', 'image', 'initials', 'fallback'],
    ['AvatarComponent'],
  ),
];

const kebab = (name: string): string => name.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();

/**
 * Route of the generated API reference page for the entry's primary export (Doqs generates one
 * page per export under `reference/api/<package>/`). Aliases point at the API that backs them;
 * recipes have no export and therefore no API page.
 */
export function apiPath(entry: CatalogueEntry): string | null {
  if (entry.kind === 'alias' && entry.backedBy) {
    const backing = CATALOGUE.find((candidate) => candidate.path === entry.backedBy);
    return backing ? apiPath(backing) : null;
  }
  const primary = entry.exports[0];
  return primary ? `/docs/reference/api/${entry.layer}/${kebab(primary)}` : null;
}

export interface CatalogueQuery {
  text?: string;
  category?: CategoryId | 'all';
  layer?: CatalogueLayer | 'all';
}

const normalise = (value: string) =>
  value
    .normalize('NFKD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

const haystack = (entry: CatalogueEntry): string =>
  normalise(
    [
      entry.name,
      entry.description,
      entry.note ?? '',
      entry.layer,
      entry.kind,
      CATEGORIES.find((c) => c.id === entry.category)?.label ?? '',
      ...entry.keywords,
      ...entry.exports,
    ].join(' '),
  );

const HAYSTACKS = new Map<CatalogueEntry, string>();

/**
 * Simple local filtering: every whitespace-separated term of the query must occur in the entry's
 * name, category, keywords, exports or description. No fuzzy matching, no dependency.
 */
export function filterCatalogue(
  query: CatalogueQuery,
  entries: readonly CatalogueEntry[] = CATALOGUE,
): CatalogueEntry[] {
  const terms = normalise(query.text ?? '')
    .split(/\s+/)
    .filter(Boolean);
  return entries.filter((entry) => {
    if (query.category && query.category !== 'all' && entry.category !== query.category) {
      return false;
    }
    if (query.layer && query.layer !== 'all' && entry.layer !== query.layer) return false;
    if (terms.length === 0) return true;
    let text = HAYSTACKS.get(entry);
    if (text === undefined) HAYSTACKS.set(entry, (text = haystack(entry)));
    return terms.every((term) => text.includes(term));
  });
}

export interface CatalogueCounts {
  coreApis: number;
  primitiveFamilies: number;
  aliases: number;
  compositions: number;
  documentedPrimitivePages: number;
}

/** Counts derived from the catalogue so no page hard-codes a number. */
export function catalogueCounts(entries: readonly CatalogueEntry[] = CATALOGUE): CatalogueCounts {
  const primitives = entries.filter((entry) => entry.layer === 'primitives');
  return {
    coreApis: entries.filter((entry) => entry.layer === 'core').length,
    primitiveFamilies: primitives.filter((entry) => entry.kind === 'export').length,
    aliases: primitives.filter((entry) => entry.kind === 'alias').length,
    compositions: primitives.filter((entry) => entry.kind === 'composition').length,
    documentedPrimitivePages: primitives.length,
  };
}
