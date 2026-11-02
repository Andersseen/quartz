import type { DoqPlaygroundCode, DoqPlaygroundValues } from '@doqs/analog';
import { attr, bind, componentSource, el, flag, output, twoWay, usage } from './usage';

/**
 * Generated usage code for the playgrounds that show it. Every function takes the current control
 * values and returns Angular template (or component) source built with the serializer in `usage.ts`;
 * the unit test in `usage-code.spec.ts` runs each one against the registered definitions.
 *
 * Snippets are *structural*: they show the directives, inputs and outputs of the primitive and omit
 * the demo's Tailwind classes, which are styling and not behaviour. Each tab says so in its label.
 */

type Values = DoqPlaygroundValues;

const PRIMITIVES = '@quartz-headless/primitives';
const TEMPLATE = (
  label = 'Template (unstyled)',
): Pick<DoqPlaygroundCode, 'label' | 'language'> => ({
  label,
  language: 'html',
});
const COMPONENT: Pick<DoqPlaygroundCode, 'label' | 'language'> = {
  label: 'Component',
  language: 'ts',
};

const num = (value: unknown, fallback: number): number =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;
/** `orientation="vertical"` is only written when it differs from the horizontal default. */
const orientation = (v: Values) =>
  v['orientation'] === 'vertical' && attr('orientation', 'vertical');
const dir = (v: Values) => v['rtl'] === true && attr('dir', 'rtl');
const disabled = (v: Values) => flag('disabled', v['disabled'] === true);

// ---------------------------------------------------------------------------------------------
// Toolbar
// ---------------------------------------------------------------------------------------------

export const toolbarTemplate = (v: Values) =>
  usage(
    el(
      'div',
      ['qzToolbar', attr('aria-label', 'Formatting'), orientation(v), ...disabled(v), dir(v)],
      [
        el('button', ['qzToolbarItem'], ['Bold']),
        el('button', ['qzToolbarItem'], ['Italic']),
        el('button', ['qzToolbarItem', 'disabled'], ['Link']),
      ],
    ),
  );

export const toolbarCode: readonly DoqPlaygroundCode[] = [
  { ...TEMPLATE(), code: toolbarTemplate },
  {
    ...COMPONENT,
    code: (v) =>
      componentSource({
        selector: 'formatting-toolbar',
        importFrom: [{ names: ['ToolbarDirective', 'ToolbarItemDirective'], from: PRIMITIVES }],
        imports: ['ToolbarDirective', 'ToolbarItemDirective'],
        members: [],
        template: toolbarTemplate(v),
      }),
  },
];

// ---------------------------------------------------------------------------------------------
// ToggleGroup
// ---------------------------------------------------------------------------------------------

export const toggleGroupTemplate = (v: Values) => {
  const single = v['type'] !== 'multiple';
  return usage(
    el(
      'div',
      [
        'qzToggleGroup',
        attr('aria-label', 'Formatting'),
        attr('type', single ? 'single' : 'multiple'),
        single && v['allowDeselection'] === false && bind('allowDeselection', false),
        orientation(v),
        ...disabled(v),
        twoWay('value', 'formats'),
        output('valueChangeCommitted', 'onFormatsCommitted($event)'),
      ],
      ['bold', 'italic', 'underline'].map((item) =>
        el('button', [attr('qzToggleItem', item)], [item[0].toUpperCase() + item.slice(1)]),
      ),
    ),
  );
};

export const toggleGroupCode: readonly DoqPlaygroundCode[] = [
  { ...TEMPLATE(), code: toggleGroupTemplate },
  {
    ...COMPONENT,
    code: (v) =>
      componentSource({
        selector: 'format-toggles',
        importFrom: [{ names: ['ToggleGroupDirective', 'ToggleItemDirective'], from: PRIMITIVES }],
        imports: ['ToggleGroupDirective', 'ToggleItemDirective'],
        members:
          v['type'] === 'multiple'
            ? [
                "protected readonly formats = signal<readonly string[]>(['bold']);",
                'protected onFormatsCommitted(value: string | readonly string[] | null) {}',
              ]
            : [
                "protected readonly formats = signal<string | null>('bold');",
                'protected onFormatsCommitted(value: string | readonly string[] | null) {}',
              ],
        template: toggleGroupTemplate(v),
      }),
  },
];

// ---------------------------------------------------------------------------------------------
// Toggle
// ---------------------------------------------------------------------------------------------

export const toggleTemplate = (v: Values) =>
  usage(el('button', ['qzToggle', twoWay('pressed', 'bold'), ...disabled(v)], ['Bold']));

export const toggleCode: readonly DoqPlaygroundCode[] = [
  { ...TEMPLATE('Template'), code: toggleTemplate },
  {
    ...COMPONENT,
    code: (v) =>
      componentSource({
        selector: 'bold-toggle',
        importFrom: [{ names: ['ToggleDirective'], from: PRIMITIVES }],
        imports: ['ToggleDirective'],
        members: [`protected readonly bold = signal(${v['pressed'] === true});`],
        template: toggleTemplate(v),
      }),
  },
];

// ---------------------------------------------------------------------------------------------
// Slider
// ---------------------------------------------------------------------------------------------

export const sliderTemplate = (v: Values) =>
  usage(
    el(
      'div',
      [
        'qzSlider',
        twoWay('value', 'volume'),
        bind('min', num(v['min'], 0)),
        bind('max', num(v['max'], 100)),
        bind('step', num(v['step'], 1)),
        orientation(v),
        ...disabled(v),
        output('valueChangeCommitted', 'onVolumeCommitted($event)'),
      ],
      [
        el(
          'div',
          ['qzSliderTrack'],
          [
            el('div', ['qzSliderRange']),
            el('button', ['qzSliderThumb', attr('aria-label', 'Volume')]),
          ],
        ),
      ],
    ),
  );

export const sliderCode: readonly DoqPlaygroundCode[] = [
  { ...TEMPLATE(), code: sliderTemplate },
  {
    ...COMPONENT,
    code: (v) =>
      componentSource({
        selector: 'volume-slider',
        importFrom: [
          {
            names: [
              'SliderDirective',
              'SliderTrackDirective',
              'SliderRangeDirective',
              'SliderThumbDirective',
            ],
            from: PRIMITIVES,
          },
        ],
        imports: [
          'SliderDirective',
          'SliderTrackDirective',
          'SliderRangeDirective',
          'SliderThumbDirective',
        ],
        members: [
          `protected readonly volume = signal(${num(v['value'], 0)});`,
          'protected onVolumeCommitted(value: number) {}',
        ],
        template: sliderTemplate(v),
      }),
  },
];

// ---------------------------------------------------------------------------------------------
// RangeSlider
// ---------------------------------------------------------------------------------------------

export const rangeSliderTemplate = (v: Values) =>
  usage(
    el(
      'div',
      [
        'qzRangeSlider',
        twoWay('low', 'low'),
        twoWay('high', 'high'),
        bind('min', num(v['min'], 0)),
        bind('max', num(v['max'], 100)),
        bind('step', num(v['step'], 1)),
        num(v['minDistance'], 0) > 0 && bind('minDistance', num(v['minDistance'], 0)),
        orientation(v),
        ...disabled(v),
        output('valueChangeCommitted', 'onRangeCommitted($event)'),
      ],
      [
        el('div', ['qzRangeSliderTrack'], [el('div', ['qzRangeSliderRange'])]),
        el('button', [attr('qzRangeSliderThumb', 'low'), attr('aria-label', 'Minimum')]),
        el('button', [attr('qzRangeSliderThumb', 'high'), attr('aria-label', 'Maximum')]),
      ],
    ),
  );

export const rangeSliderCode: readonly DoqPlaygroundCode[] = [
  { ...TEMPLATE(), code: rangeSliderTemplate },
  {
    ...COMPONENT,
    code: (v) =>
      componentSource({
        selector: 'price-range',
        importFrom: [
          {
            names: [
              'RangeSliderDirective',
              'RangeSliderTrackDirective',
              'RangeSliderRangeDirective',
              'RangeSliderThumbDirective',
            ],
            from: PRIMITIVES,
          },
        ],
        imports: [
          'RangeSliderDirective',
          'RangeSliderTrackDirective',
          'RangeSliderRangeDirective',
          'RangeSliderThumbDirective',
        ],
        members: [
          `protected readonly low = signal(${num(v['low'], 0)});`,
          `protected readonly high = signal(${num(v['high'], 100)});`,
          'protected onRangeCommitted(range: { low: number; high: number }) {}',
        ],
        template: rangeSliderTemplate(v),
      }),
  },
];

// ---------------------------------------------------------------------------------------------
// Select
// ---------------------------------------------------------------------------------------------

export const selectTemplate = (v: Values) => {
  const option = (value: string, label: string) =>
    el('button', [attr('qzSelectOption', value)], [label]);
  const body =
    v['grouped'] === false
      ? [option('apple', 'Apple'), option('banana', 'Banana'), option('carrot', 'Carrot')]
      : [
          el(
            'div',
            ['qzSelectGroup'],
            [
              el('div', ['qzSelectGroupLabel'], ['Fruit']),
              option('apple', 'Apple'),
              option('banana', 'Banana'),
            ],
          ),
          el('div', ['qzSelectSeparator']),
          el(
            'div',
            ['qzSelectGroup'],
            [el('div', ['qzSelectGroupLabel'], ['Vegetables']), option('carrot', 'Carrot')],
          ),
        ];
  return usage(
    el(
      'div',
      [
        'qzSelect',
        ...flag('multiple', v['multiple'] === true),
        v['multiple'] === true ? twoWay('values', 'fruits') : twoWay('value', 'fruit'),
        bind('closeOnSelect', v['closeOnSelect'] === true),
        ...disabled(v),
        v['rtl'] === true && attr('dir', 'rtl'),
      ],
      [
        el('button', ['qzSelectTrigger', attr('aria-label', 'Fruit')], ['Pick fruit']),
        el('ng-template', ['qzSelectContent'], [el('div', ['qzSelectListbox'], body)]),
      ],
    ),
  );
};

export const selectCode: readonly DoqPlaygroundCode[] = [
  { ...TEMPLATE(), code: selectTemplate },
  {
    ...COMPONENT,
    code: (v) => {
      const names = [
        'SelectDirective',
        'SelectTriggerDirective',
        'SelectContentDirective',
        'SelectListboxDirective',
        'SelectOptionDirective',
        ...(v['grouped'] === false
          ? []
          : ['SelectGroupDirective', 'SelectGroupLabelDirective', 'SelectSeparatorDirective']),
      ];
      return componentSource({
        selector: 'fruit-select',
        importFrom: [{ names, from: PRIMITIVES }],
        imports: names,
        members:
          v['multiple'] === true
            ? ['protected readonly fruits = signal<readonly string[]>([]);']
            : ['protected readonly fruit = signal<string | null>(null);'],
        template: selectTemplate(v),
      });
    },
  },
];

// ---------------------------------------------------------------------------------------------
// InputOTP
// ---------------------------------------------------------------------------------------------

export const inputOtpTemplate = (v: Values) =>
  usage(
    el('qz-input-otp', [
      bind('length', num(v['length'], 6)),
      ...disabled(v),
      twoWay('value', 'code'),
      output('completed', 'onCodeEntered($event)'),
    ]),
  );

export const inputOtpCode: readonly DoqPlaygroundCode[] = [
  { ...TEMPLATE('Template'), code: inputOtpTemplate },
  {
    ...COMPONENT,
    code: (v) =>
      componentSource({
        selector: 'verify-code',
        importFrom: [{ names: ['InputOtpComponent'], from: PRIMITIVES }],
        imports: ['InputOtpComponent'],
        members: [
          "protected readonly code = signal('');",
          'protected onCodeEntered(code: string) {}',
        ],
        template: inputOtpTemplate(v),
      }),
  },
];

// ---------------------------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------------------------

/** Pages are written out literally; above this many the snippet shows the first ones and says so. */
const MAX_LISTED_PAGES = 10;

export const paginationTemplate = (v: Values) => {
  const count = Math.max(0, Math.floor(num(v['pageCount'], 5)));
  const listed = Math.min(count, MAX_LISTED_PAGES);
  return usage(
    el(
      'nav',
      [
        'qzPagination',
        attr('aria-label', 'Search results'),
        twoWay('page', 'page'),
        bind('pageCount', count),
        ...disabled(v),
      ],
      [
        el('button', ['qzPaginationFirst'], ['First']),
        el('button', ['qzPaginationPrevious'], ['Previous']),
        ...Array.from({ length: listed }, (_, i) =>
          el('button', [bind('qzPaginationPage', i + 1)], [String(i + 1)]),
        ),
        el('button', ['qzPaginationNext'], ['Next']),
        el('button', ['qzPaginationLast'], ['Last']),
      ],
    ),
  );
};

export const paginationCode: readonly DoqPlaygroundCode[] = [
  {
    label: 'Template',
    language: 'html',
    code: (v) =>
      Math.floor(num(v['pageCount'], 5)) > MAX_LISTED_PAGES
        ? `<!-- Illustrative: only the first ${MAX_LISTED_PAGES} page buttons are listed; render the rest with @for. -->\n${paginationTemplate(v)}`
        : paginationTemplate(v),
  },
];

// ---------------------------------------------------------------------------------------------
// NavigationMenu
// ---------------------------------------------------------------------------------------------

export const navigationMenuTemplate = (v: Values) => {
  const delay = (name: string) => num(v[name], 150) !== 150 && bind(name, num(v[name], 150));
  return usage(
    el(
      'nav',
      [
        'qzNavigationMenu',
        attr('aria-label', 'Main navigation'),
        twoWay('value', 'section'),
        orientation(v),
        delay('showDelay'),
        delay('hideDelay'),
        ...disabled(v),
        dir(v),
      ],
      [
        el(
          'ul',
          ['qzNavigationMenuList'],
          [
            el(
              'li',
              [attr('qzNavigationMenuItem', 'products')],
              [
                el('button', ['qzNavigationMenuTrigger'], ['Products']),
                el(
                  'ng-template',
                  ['qzNavigationMenuContent'],
                  [
                    el('a', ['qzNavigationMenuLink', attr('href', '#overview')], ['Overview']),
                    el('a', ['qzNavigationMenuLink', attr('href', '#security')], ['Security']),
                  ],
                ),
              ],
            ),
            el(
              'li',
              [attr('qzNavigationMenuItem', 'company')],
              [
                el('button', ['qzNavigationMenuTrigger'], ['Company']),
                el(
                  'ng-template',
                  ['qzNavigationMenuContent'],
                  [el('a', ['qzNavigationMenuLink', attr('href', '#about')], ['About'])],
                ),
              ],
            ),
          ],
        ),
      ],
    ),
  );
};

export const navigationMenuCode: readonly DoqPlaygroundCode[] = [
  { label: 'Template', language: 'html', code: navigationMenuTemplate },
];
