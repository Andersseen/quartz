import { formatDoqUsage, type DoqPlaygroundDefinition } from '@doqs/analog';
import {
  CheckboxPlaygroundComponent,
  RangeSliderPlaygroundComponent,
  RadioGroupPlaygroundComponent,
  SliderPlaygroundComponent,
  SwitchPlaygroundComponent,
  TabsPlaygroundComponent,
  ToggleGroupPlaygroundComponent,
  TogglePlaygroundComponent,
} from './control-playgrounds';
import { ComboboxPlaygroundComponent } from './combobox-playground';
import { ListboxPlaygroundComponent } from './listbox-playground';
import { SelectPlaygroundComponent } from './select-playground';
import {
  DatePickerPlaygroundComponent,
  DateRangePickerPlaygroundComponent,
} from './date-playgrounds';
import {
  AccordionPlaygroundComponent,
  NavigationMenuPlaygroundComponent,
  PaginationPlaygroundComponent,
  SidebarPlaygroundComponent,
  ToolbarPlaygroundComponent,
} from './navigation-playgrounds';

const orientation = (label = 'Orientation') => ({
  input: 'orientation',
  kind: 'select' as const,
  label,
  initial: 'horizontal',
  options: [
    { label: 'Horizontal', value: 'horizontal' },
    { label: 'Vertical', value: 'vertical' },
  ],
});
const bool = (input: string, label: string, initial = false) => ({
  input,
  kind: 'boolean' as const,
  label,
  initial,
});

/**
 * Interactive playgrounds (`::playground[id]`). Each wraps the real Quartz primitive; Doqs binds
 * the inputs, lists the outputs and prints the usage code. Kept out of `doq.paths.ts`, which must
 * stay free of Angular components.
 */
export const DOC_PLAYGROUNDS: Record<string, DoqPlaygroundDefinition> = {
  'quartz-toolbar': {
    component: ToolbarPlaygroundComponent,
    title: 'Toolbar',
    description: 'Roving focus toolbar with orientation, RTL and disabled-state controls.',
    controls: [orientation(), bool('rtl', 'RTL'), bool('disabled', 'Disabled')],
    code: [
      {
        label: 'Template',
        language: 'html',
        code: (v) =>
          formatDoqUsage(
            'div',
            {},
            {
              attributes: [
                'qzToolbar',
                'aria-label="Formatting"',
                ...(v['orientation'] === 'vertical' ? ['orientation="vertical"'] : []),
                ...(v['disabled'] ? ['disabled'] : []),
              ],
              text: '<button qzToolbarItem>Bold</button>…',
            },
          ),
      },
    ],
  },
  'quartz-navigation-menu': {
    component: NavigationMenuPlaygroundComponent,
    title: 'NavigationMenu',
    description: 'Site navigation with one hover- and keyboard-controlled flyout.',
    controls: [
      orientation(),
      { input: 'showDelay', kind: 'number', label: 'Show delay (ms)', initial: 150, min: 0 },
      { input: 'hideDelay', kind: 'number', label: 'Hide delay (ms)', initial: 150, min: 0 },
      bool('disabled', 'Disabled'),
      bool('rtl', 'RTL'),
    ],
    code: [
      {
        label: 'Template',
        language: 'html',
        code: () =>
          '<nav qzNavigationMenu aria-label="Main navigation"><ul qzNavigationMenuList><li qzNavigationMenuItem="products"><button qzNavigationMenuTrigger>Products</button><ng-template qzNavigationMenuContent>…</ng-template></li></ul></nav>',
      },
    ],
  },
  'quartz-pagination': {
    component: PaginationPlaygroundComponent,
    title: 'Pagination',
    description: 'Bounded page model with current-page semantics and boundary focus recovery.',
    controls: [
      { input: 'page', kind: 'number', label: 'Page', initial: 2, min: 1 },
      { input: 'pageCount', kind: 'number', label: 'Page count', initial: 5, min: 0 },
      bool('disabled', 'Disabled'),
    ],
    code: [
      {
        label: 'Template',
        language: 'html',
        code: (v) =>
          `<nav qzPagination aria-label="Search results" [(page)]="page" [pageCount]="${v['pageCount']}"${v['disabled'] ? ' disabled' : ''}>…</nav>`,
      },
    ],
  },
  'quartz-accordion': {
    component: AccordionPlaygroundComponent,
    title: 'Accordion',
    description:
      'Disclosure sections with single/multiple values, orientation, disabled and collapsible states.',
    controls: [
      orientation('Header orientation'),
      {
        input: 'type',
        kind: 'select',
        label: 'Type',
        initial: 'single',
        options: [
          { label: 'Single', value: 'single' },
          { label: 'Multiple', value: 'multiple' },
        ],
      },
      bool('disabled', 'Disabled'),
      bool('collapsible', 'Collapsible'),
    ],
  },
  'quartz-sidebar': {
    component: SidebarPlaygroundComponent,
    title: 'Sidebar',
    description: 'Responsive sidebar state with layout mode, breakpoint and logical side controls.',
    controls: [
      bool('open', 'Open', true),
      bool('collapsed', 'Collapsed'),
      {
        input: 'mode',
        kind: 'select',
        label: 'Mode',
        initial: 'push',
        options: [
          { label: 'Push', value: 'push' },
          { label: 'Overlay', value: 'overlay' },
        ],
      },
      { input: 'breakpoint', kind: 'number', label: 'Breakpoint (px)', initial: 768, min: 0 },
      {
        input: 'side',
        kind: 'select',
        label: 'Side',
        initial: 'inline-start',
        options: [
          { label: 'Inline start', value: 'inline-start' },
          { label: 'Inline end', value: 'inline-end' },
        ],
      },
    ],
  },
  'quartz-select': {
    component: SelectPlaygroundComponent,
    title: 'Select',
    description:
      'A real qzSelect. Toggle multiple selection, groups, closeOnSelect, disabled and RTL.',
    controls: [
      bool('multiple', 'Multiple'),
      bool('closeOnSelect', 'Close on select'),
      bool('grouped', 'Groups', true),
      bool('disabled', 'Disabled'),
      bool('rtl', 'RTL'),
    ],
    outputs: [{ event: 'selection', label: 'Selected option' }],
    code: [
      {
        label: 'Template',
        language: 'html',
        code: (v) =>
          formatDoqUsage(
            'div',
            {},
            {
              attributes: [
                'qzSelect',
                ...(v['multiple'] ? ['multiple', '[(values)]="fruits"'] : ['[(value)]="fruit"']),
                ...(v['closeOnSelect'] ? ['[closeOnSelect]="true"'] : []),
                ...(v['disabled'] ? ['disabled'] : []),
              ],
              text: '…',
            },
          ),
      },
    ],
  },
  'quartz-listbox': {
    component: ListboxPlaygroundComponent,
    title: 'Listbox',
    description: 'A real qzListbox with sections: single or multiple selection, disabled.',
    controls: [
      bool('multiple', 'Multiple'),
      bool('grouped', 'Sections', true),
      bool('disabled', 'Disabled'),
    ],
    outputs: [{ event: 'committed', label: 'Committed value' }],
  },
  'quartz-combobox': {
    component: ComboboxPlaygroundComponent,
    title: 'Combobox',
    description: 'A real qzCombobox: query is separate from the committed value.',
    controls: [
      bool('multiple', 'Multiple'),
      bool('allowDeselect', 'Allow deselect'),
      bool('allowFreeform', 'Allow freeform'),
      bool('loading', 'Loading'),
      bool('disabled', 'Disabled'),
    ],
    outputs: [
      { event: 'query', label: 'Query' },
      { event: 'committed', label: 'Committed value' },
    ],
  },
  'quartz-checkbox': {
    component: CheckboxPlaygroundComponent,
    title: 'Checkbox',
    description: 'A real qzCheckbox, starting in the mixed state.',
    controls: [bool('disabled', 'Disabled')],
    outputs: [{ event: 'committed', label: 'Committed state' }],
  },
  'quartz-switch': {
    component: SwitchPlaygroundComponent,
    title: 'Switch',
    description: 'A real qzSwitch.',
    controls: [bool('disabled', 'Disabled')],
    outputs: [{ event: 'committed', label: 'Committed state' }],
  },
  'quartz-radio-group': {
    component: RadioGroupPlaygroundComponent,
    title: 'RadioGroup',
    description: 'A real qzRadioGroup with roving focus.',
    controls: [orientation(), bool('loop', 'Loop', true), bool('disabled', 'Disabled')],
    outputs: [{ event: 'committed', label: 'Committed value' }],
  },
  'quartz-tabs': {
    component: TabsPlaygroundComponent,
    title: 'Tabs',
    description: 'A real qzTabs.',
    controls: [
      orientation(),
      {
        input: 'activationMode',
        kind: 'select',
        label: 'Activation',
        initial: 'automatic',
        options: [
          { label: 'Automatic', value: 'automatic' },
          { label: 'Manual', value: 'manual' },
        ],
      },
      bool('disabled', 'Disabled'),
    ],
  },
  'quartz-toggle': {
    component: TogglePlaygroundComponent,
    title: 'Toggle',
    description: 'A real qzToggle. The pressed control sets the state; clicks commit once each.',
    controls: [bool('pressed', 'Pressed'), bool('disabled', 'Disabled')],
    outputs: [{ event: 'committed', label: 'Committed state' }],
    code: [
      {
        label: 'Template',
        language: 'html',
        code: (v) =>
          formatDoqUsage(
            'button',
            {},
            {
              attributes: [
                'qzToggle',
                '[(pressed)]="bold"',
                ...(v['disabled'] ? ['disabled'] : []),
              ],
              text: 'Bold',
            },
          ),
      },
    ],
  },
  'quartz-toggle-group': {
    component: ToggleGroupPlaygroundComponent,
    title: 'ToggleGroup',
    description:
      'A real qzToggleGroup. allowDeselection applies to single mode; the committed output is the new value.',
    controls: [
      {
        input: 'type',
        kind: 'select',
        label: 'Type',
        initial: 'single',
        options: [
          { label: 'Single', value: 'single' },
          { label: 'Multiple', value: 'multiple' },
        ],
      },
      bool('allowDeselection', 'Allow deselection', true),
      orientation(),
      bool('disabled', 'Disabled'),
    ],
    outputs: [{ event: 'committed', label: 'Committed value' }],
    code: [
      {
        label: 'Template',
        language: 'html',
        code: (v) =>
          formatDoqUsage(
            'div',
            {},
            {
              attributes: [
                'qzToggleGroup',
                'aria-label="Formatting"',
                `type="${v['type']}"`,
                ...(v['type'] === 'single' && !v['allowDeselection']
                  ? ['[allowDeselection]="false"']
                  : []),
                ...(v['orientation'] === 'vertical' ? ['orientation="vertical"'] : []),
                ...(v['disabled'] ? ['disabled'] : []),
                '[(value)]="formats"',
              ],
              text: '<button qzToggleItem="bold">Bold</button> …',
            },
          ),
      },
    ],
  },
  'quartz-slider': {
    component: SliderPlaygroundComponent,
    title: 'Slider',
    description:
      'A real qzSlider. The value control sets the value; dragging and keys override it. Committed fires per user change.',
    controls: [
      { input: 'value', kind: 'number', label: 'Value', initial: 40 },
      { input: 'min', kind: 'number', label: 'Min', initial: 0 },
      { input: 'max', kind: 'number', label: 'Max', initial: 100 },
      { input: 'step', kind: 'number', label: 'Step', initial: 5, min: 0.1 },
      orientation(),
      bool('disabled', 'Disabled'),
    ],
    outputs: [{ event: 'committed', label: 'Committed value' }],
    code: [
      {
        label: 'Template',
        language: 'html',
        code: (v) =>
          formatDoqUsage(
            'div',
            {},
            {
              attributes: [
                'qzSlider',
                '[(value)]="volume"',
                `[min]="${v['min']}"`,
                `[max]="${v['max']}"`,
                `[step]="${v['step']}"`,
                ...(v['orientation'] === 'vertical' ? ['orientation="vertical"'] : []),
                ...(v['disabled'] ? ['disabled'] : []),
              ],
              text: '<div qzSliderTrack>…<button qzSliderThumb aria-label="Volume"></button></div>',
            },
          ),
      },
    ],
  },
  'quartz-range-slider': {
    component: RangeSliderPlaygroundComponent,
    title: 'RangeSlider',
    description:
      'A real qzRangeSlider. Thumbs never cross; minDistance keeps them apart. Committed is the { low, high } object.',
    controls: [
      { input: 'low', kind: 'number', label: 'Low', initial: 20 },
      { input: 'high', kind: 'number', label: 'High', initial: 70 },
      { input: 'min', kind: 'number', label: 'Min', initial: 0 },
      { input: 'max', kind: 'number', label: 'Max', initial: 100 },
      { input: 'step', kind: 'number', label: 'Step', initial: 5, min: 0.1 },
      { input: 'minDistance', kind: 'number', label: 'Min distance', initial: 0, min: 0 },
      orientation(),
      bool('disabled', 'Disabled'),
    ],
    outputs: [{ event: 'committed', label: 'Committed value' }],
    code: [
      {
        label: 'Template',
        language: 'html',
        code: (v) =>
          formatDoqUsage(
            'div',
            {},
            {
              attributes: [
                'qzRangeSlider',
                '[(low)]="low"',
                '[(high)]="high"',
                `[min]="${v['min']}"`,
                `[max]="${v['max']}"`,
                `[step]="${v['step']}"`,
                ...(Number(v['minDistance']) > 0 ? [`[minDistance]="${v['minDistance']}"`] : []),
                ...(v['orientation'] === 'vertical' ? ['orientation="vertical"'] : []),
                ...(v['disabled'] ? ['disabled'] : []),
              ],
              text: '<button qzRangeSliderThumb="low" aria-label="Minimum"></button> …',
            },
          ),
      },
    ],
  },
  'quartz-date-picker': {
    component: DatePickerPlaygroundComponent,
    title: 'DatePicker',
    description:
      'A real inline qzDatePicker. Change the civil date, bounds, locale, week start and direction.',
    controls: [
      {
        input: 'month',
        kind: 'select',
        label: 'Displayed month',
        initial: '2024-02',
        options: [
          { label: 'February 2024', value: '2024-02' },
          { label: 'March 2024', value: '2024-03' },
          { label: 'December 2024', value: '2024-12' },
        ],
      },
      {
        input: 'selectedDay',
        kind: 'number',
        label: 'Selected day (0 clears)',
        initial: 15,
        min: 0,
        max: 28,
      },
      {
        input: 'minDay',
        kind: 'number',
        label: 'Minimum day (0 none)',
        initial: 0,
        min: 0,
        max: 28,
      },
      {
        input: 'maxDay',
        kind: 'number',
        label: 'Maximum day (0 none)',
        initial: 0,
        min: 0,
        max: 28,
      },
      {
        input: 'firstDayOfWeek',
        kind: 'select',
        label: 'Week starts',
        initial: 1,
        options: [
          { label: 'Sunday', value: 0 },
          { label: 'Monday', value: 1 },
          { label: 'Saturday', value: 6 },
        ],
      },
      {
        input: 'locale',
        kind: 'select',
        label: 'Locale',
        initial: 'en-US',
        options: [
          { label: 'English', value: 'en-US' },
          { label: 'French', value: 'fr-FR' },
          { label: 'Arabic', value: 'ar-EG' },
        ],
      },
      bool('disabled', 'Disabled'),
      bool('rtl', 'RTL'),
    ],
    outputs: [{ event: 'selection', label: 'Committed date' }],
  },
  'quartz-date-range-picker': {
    component: DateRangePickerPlaygroundComponent,
    title: 'DateRangePicker',
    description:
      'A real inline qzDateRangePicker. Start-only selection previews a range; blocked dates prevent crossing.',
    controls: [
      {
        input: 'month',
        kind: 'select',
        label: 'Displayed month',
        initial: '2024-02',
        options: [
          { label: 'February 2024', value: '2024-02' },
          { label: 'March 2024', value: '2024-03' },
          { label: 'December 2024', value: '2024-12' },
        ],
      },
      {
        input: 'startDay',
        kind: 'number',
        label: 'Start day (0 none)',
        initial: 0,
        min: 0,
        max: 28,
      },
      { input: 'endDay', kind: 'number', label: 'End day (0 none)', initial: 0, min: 0, max: 28 },
      {
        input: 'minDay',
        kind: 'number',
        label: 'Minimum day (0 none)',
        initial: 0,
        min: 0,
        max: 28,
      },
      {
        input: 'maxDay',
        kind: 'number',
        label: 'Maximum day (0 none)',
        initial: 0,
        min: 0,
        max: 28,
      },
      {
        input: 'firstDayOfWeek',
        kind: 'select',
        label: 'Week starts',
        initial: 1,
        options: [
          { label: 'Sunday', value: 0 },
          { label: 'Monday', value: 1 },
          { label: 'Saturday', value: 6 },
        ],
      },
      {
        input: 'locale',
        kind: 'select',
        label: 'Locale',
        initial: 'en-US',
        options: [
          { label: 'English', value: 'en-US' },
          { label: 'French', value: 'fr-FR' },
          { label: 'Arabic', value: 'ar-EG' },
        ],
      },
      bool('disabled', 'Disabled'),
      bool('rtl', 'RTL'),
    ],
    outputs: [{ event: 'selection', label: 'Committed range' }],
  },
};
