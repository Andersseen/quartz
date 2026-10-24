import { formatDoqUsage, type DoqPlaygroundDefinition } from '@doqs/analog';
import {
  CheckboxPlaygroundComponent,
  RadioGroupPlaygroundComponent,
  SliderPlaygroundComponent,
  SwitchPlaygroundComponent,
  TabsPlaygroundComponent,
  ToggleGroupPlaygroundComponent,
} from './control-playgrounds';
import { ComboboxPlaygroundComponent } from './combobox-playground';
import { ListboxPlaygroundComponent } from './listbox-playground';
import { SelectPlaygroundComponent } from './select-playground';

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
  'quartz-toggle-group': {
    component: ToggleGroupPlaygroundComponent,
    title: 'ToggleGroup',
    description: 'A real qzToggleGroup.',
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
      orientation(),
      bool('disabled', 'Disabled'),
    ],
  },
  'quartz-slider': {
    component: SliderPlaygroundComponent,
    title: 'Slider',
    description: 'A real qzSlider.',
    controls: [
      { input: 'min', kind: 'number', label: 'Min', initial: 0 },
      { input: 'max', kind: 'number', label: 'Max', initial: 100 },
      { input: 'step', kind: 'number', label: 'Step', initial: 5, min: 1 },
      bool('disabled', 'Disabled'),
    ],
  },
};
