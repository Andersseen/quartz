import { describe, expect, it, vi } from 'vitest';
import type { DoqPlaygroundControl, DoqPlaygroundValues } from '@doqs/analog';
import { DOC_PLAYGROUNDS } from './registry';
import { attr, bind, componentSource, el, usage } from './usage';

// The registry's definitions (controls, outputs, code) are what is under test. The playground
// components are replaced by inert classes: they need the Angular compiler and the primitives.
const stub = vi.hoisted(
  () => (names: string[]) => Object.fromEntries(names.map((name) => [name, class Stub {}])),
);
vi.mock('./combobox-playground', () => stub(['ComboboxPlaygroundComponent']));
vi.mock('./control-playgrounds', () =>
  stub([
    'CheckboxPlaygroundComponent',
    'SwitchPlaygroundComponent',
    'RadioGroupPlaygroundComponent',
    'TabsPlaygroundComponent',
    'TogglePlaygroundComponent',
    'ToggleGroupPlaygroundComponent',
    'SliderPlaygroundComponent',
    'RangeSliderPlaygroundComponent',
  ]),
);
vi.mock('./date-playgrounds', () =>
  stub(['DatePickerPlaygroundComponent', 'DateRangePickerPlaygroundComponent']),
);
vi.mock('./feedback-playgrounds', () =>
  stub([
    'ProgressPlaygroundComponent',
    'MeterPlaygroundComponent',
    'AvatarPlaygroundComponent',
    'ToastPlaygroundComponent',
  ]),
);
vi.mock('./floating-playgrounds', () =>
  stub([
    'DrawerPlaygroundComponent',
    'ResizablePlaygroundComponent',
    'TooltipArrowPlaygroundComponent',
    'PopoverArrowPlaygroundComponent',
  ]),
);
vi.mock('./input-otp-playground', () => stub(['InputOtpPlaygroundComponent']));
vi.mock('./listbox-playground', () => stub(['ListboxPlaygroundComponent']));
vi.mock('./navigation-playgrounds', () =>
  stub([
    'ToolbarPlaygroundComponent',
    'NavigationMenuPlaygroundComponent',
    'PaginationPlaygroundComponent',
    'AccordionPlaygroundComponent',
    'SidebarPlaygroundComponent',
  ]),
);
vi.mock('./select-playground', () => stub(['SelectPlaygroundComponent']));

const defaults = (id: string): DoqPlaygroundValues =>
  Object.fromEntries(
    (DOC_PLAYGROUNDS[id].controls ?? []).map((c: DoqPlaygroundControl) => [c.input, c.initial]),
  );

const snippets = (id: string, change: DoqPlaygroundValues = {}) => {
  const values = { ...defaults(id), ...change };
  return Object.fromEntries(
    (DOC_PLAYGROUNDS[id].code ?? []).map((entry) => [
      entry.label,
      typeof entry.code === 'function' ? entry.code(values) : entry.code,
    ]),
  );
};
const template = (id: string, change: DoqPlaygroundValues = {}) =>
  Object.values(snippets(id, change))[0];

describe('usage serializer', () => {
  it('keeps nested markup as markup and escapes text', () => {
    expect(usage(el('div', ['qzA'], [el('b', [], ['1 < 2 & 3 > 2'])]))).toBe(
      '<div qzA>\n  <b>1 &lt; 2 &amp; 3 &gt; 2</b>\n</div>',
    );
  });

  it('escapes braces in text so Angular does not read them as syntax', () => {
    expect(usage(el('p', [], ['{{ x }} @if'])).includes('{{')).toBe(false);
  });

  it('treats a string child as text even when it looks like markup', () => {
    expect(usage(el('p', [], ['<script>alert(1)</script>']))).toBe(
      '<p>&lt;script&gt;alert(1)&lt;/script&gt;</p>',
    );
  });

  it('escapes attribute values once and keeps the quotes', () => {
    expect(attr('aria-label', 'A "quoted" <b> & more')).toBe(
      'aria-label="A &quot;quoted&quot; &lt;b> &amp; more"',
    );
    expect(attr('aria-label', 'Tom &amp; Jerry')).toBe('aria-label="Tom &amp;amp; Jerry"');
  });

  it('turns interpolation-looking attribute values into a bound string', () => {
    expect(attr('title', 'a {{ b }}')).toBe(`[title]="'a {{ b }}'"`);
  });

  it('rejects names that are not template-safe', () => {
    expect(() => attr('x" onload="1', 'v')).toThrow();
    expect(() => el('div onload=1')).toThrow();
    expect(() => bind('a b', 1)).toThrow();
  });

  it('binds only finite numbers and booleans', () => {
    expect(bind('min', 0)).toBe('[min]="0"');
    expect(bind('disabled', false)).toBe('[disabled]="false"');
    expect(bind('min', NaN)).toBeUndefined();
    expect(bind('min', 'x' as unknown)).toBeUndefined();
  });

  it('self-closes components and wraps long attribute lists', () => {
    expect(usage(el('qz-input-otp', ['a']))).toBe('<qz-input-otp a />');
    const long = usage(el('div', ['qzSlider', `[x]="${'1'.repeat(80)}"`, 'y']));
    expect(long.split('\n').length).toBeGreaterThan(2);
  });

  it('wraps a template in a standalone component', () => {
    const source = componentSource({
      selector: 'demo-thing',
      importFrom: [{ names: ['A'], from: '@quartz-headless/primitives' }],
      imports: ['A'],
      members: ['x = signal(1);'],
      template: '<div a></div>',
    });
    expect(source).toContain("import { A } from '@quartz-headless/primitives';");
    expect(source).toContain('export class DemoThingComponent {');
    expect(source).toContain('    <div a></div>');
  });
});

describe('registered playground code', () => {
  const withCode = Object.entries(DOC_PLAYGROUNDS).filter(([, d]) => d.code?.length);

  it('has code for the families this milestone fixed', () => {
    expect(withCode.map(([id]) => id).sort()).toEqual(
      [
        'quartz-input-otp',
        'quartz-navigation-menu',
        'quartz-pagination',
        'quartz-range-slider',
        'quartz-select',
        'quartz-slider',
        'quartz-toggle',
        'quartz-toggle-group',
        'quartz-toolbar',
      ].sort(),
    );
  });

  it.each(withCode)(
    '%s never leaks escaped markup in its default or any single change',
    (id, def) => {
      const variants: DoqPlaygroundValues[] = [{}];
      for (const control of def.controls ?? []) {
        if (control.kind === 'boolean') variants.push({ [control.input]: !control.initial });
        if (control.kind === 'select')
          for (const option of control.options) variants.push({ [control.input]: option.value });
        if (control.kind === 'number')
          variants.push({ [control.input]: 7 }, { [control.input]: 0 }, { [control.input]: -1 });
      }
      for (const change of variants) {
        for (const [label, text] of Object.entries(snippets(id, change))) {
          const where = `${id} / ${label} / ${JSON.stringify(change)}`;
          expect(text, where).not.toMatch(/&lt;|&gt;|&quot;|&amp;lt;/);
          expect(text, where).not.toMatch(/undefined|NaN|\[object/);
          // Balanced element structure: every opening tag of a nested element is closed.
          const opens = (text.match(/<(?!\/|!--)[a-z][\w-]*/g) ?? []).length;
          const closes =
            (text.match(/<\/[a-z][\w-]*>/g) ?? []).length + (text.match(/\/>/g) ?? []).length;
          if (label !== 'Component') expect(closes, where).toBe(opens);
        }
      }
    },
  );

  it('Slider: nested track markup is real markup and the controls change the code', () => {
    const initial = template('quartz-slider');
    expect(initial).toContain('<div qzSliderTrack>');
    expect(initial).toContain('<button qzSliderThumb aria-label="Volume"></button>');
    expect(initial).toContain('[(value)]="volume"');
    expect(initial).toContain('[min]="0"');
    expect(initial).toContain('[step]="5"');
    expect(initial).not.toContain('orientation');
    expect(initial).not.toContain('disabled');
    const changed = template('quartz-slider', {
      orientation: 'vertical',
      disabled: true,
      min: 10,
      max: 50,
      step: 0.5,
    });
    expect(changed).toContain('orientation="vertical"');
    expect(changed).toContain('disabled');
    expect(changed).toContain('[min]="10"');
    expect(changed).toContain('[max]="50"');
    expect(changed).toContain('[step]="0.5"');
    expect(changed).toContain('(valueChangeCommitted)="onVolumeCommitted($event)"');
  });

  it('RangeSlider: both thumbs, two-way low/high and optional minDistance', () => {
    const initial = template('quartz-range-slider');
    expect(initial).toContain('<div qzRangeSliderTrack>');
    expect(initial).toContain('qzRangeSliderThumb="low"');
    expect(initial).toContain('qzRangeSliderThumb="high"');
    expect(initial).toContain('[(low)]="low"');
    expect(initial).toContain('[(high)]="high"');
    expect(initial).not.toContain('minDistance');
    expect(template('quartz-range-slider', { minDistance: 10 })).toContain('[minDistance]="10"');
  });

  it('Toolbar: items, orientation, disabled and RTL come from the controls', () => {
    const initial = template('quartz-toolbar');
    expect(initial).toContain('<button qzToolbarItem>Bold</button>');
    expect(initial).not.toMatch(/orientation|dir=/);
    const changed = template('quartz-toolbar', {
      orientation: 'vertical',
      rtl: true,
      disabled: true,
    });
    expect(changed).toContain('orientation="vertical"');
    expect(changed).toContain('dir="rtl"');
    expect(changed).toMatch(/\bdisabled\b/);
  });

  it('ToggleGroup: single/multiple, deselection only in single mode', () => {
    const single = template('quartz-toggle-group', { allowDeselection: false });
    expect(single).toContain('type="single"');
    expect(single).toContain('[allowDeselection]="false"');
    expect(single).toContain('<button qzToggleItem="bold">Bold</button>');
    const multiple = template('quartz-toggle-group', { type: 'multiple', allowDeselection: false });
    expect(multiple).toContain('type="multiple"');
    expect(multiple).not.toContain('allowDeselection');
    expect(snippets('quartz-toggle-group', { type: 'multiple' })['Component']).toContain(
      'signal<readonly string[]>',
    );
  });

  it('Select: single binds value, multiple binds values; groups toggle', () => {
    const single = template('quartz-select');
    expect(single).toContain('[(value)]="fruit"');
    expect(single).toContain('[closeOnSelect]="false"');
    expect(single).toContain('<div qzSelectGroup>');
    const multiple = template('quartz-select', {
      multiple: true,
      closeOnSelect: true,
      grouped: false,
      disabled: true,
      rtl: true,
    });
    expect(multiple).toContain('multiple');
    expect(multiple).toContain('[(values)]="fruits"');
    expect(multiple).toContain('[closeOnSelect]="true"');
    expect(multiple).not.toContain('qzSelectGroup');
    expect(multiple).toContain('dir="rtl"');
  });

  it('InputOTP, Toggle and Pagination reflect their controls', () => {
    expect(template('quartz-input-otp', { length: 4, disabled: true })).toBe(
      '<qz-input-otp\n  [length]="4"\n  disabled\n  [(value)]="code"\n  (completed)="onCodeEntered($event)"\n/>',
    );
    expect(snippets('quartz-toggle', { pressed: true })['Component']).toContain('signal(true)');
    const pagination = template('quartz-pagination', { pageCount: 3, disabled: true });
    expect(pagination).toContain('[qzPaginationPage]="3"');
    expect(pagination).not.toContain('[qzPaginationPage]="4"');
    expect(pagination).toContain('disabled');
    expect(template('quartz-pagination', { pageCount: 25 })).toMatch(/^<!-- Illustrative/);
  });

  it('NavigationMenu: only non-default delays and options appear', () => {
    expect(template('quartz-navigation-menu')).not.toMatch(/showDelay|hideDelay/);
    expect(template('quartz-navigation-menu', { showDelay: 0, hideDelay: 300 })).toMatch(
      /\[showDelay\]="0"[\s\S]*\[hideDelay\]="300"/,
    );
  });

  it('survives invalid control values without printing garbage', () => {
    const bad = {
      min: NaN,
      max: undefined,
      step: 'x',
      value: null,
    } as unknown as DoqPlaygroundValues;
    for (const id of ['quartz-slider', 'quartz-range-slider']) {
      const text = template(id, bad);
      expect(text).not.toMatch(/NaN|undefined|null/);
    }
  });
});
