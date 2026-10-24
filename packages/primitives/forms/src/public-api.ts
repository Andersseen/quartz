export { CheckboxControlDirective } from './checkbox-control.directive';
export { SwitchControlDirective } from './switch-control.directive';
export { RadioGroupControlDirective } from './radio-group-control.directive';
export { SelectControlDirective } from './select-control.directive';
export { ListboxControlDirective } from './listbox-control.directive';
export { ComboboxControlDirective } from './combobox-control.directive';

import { CheckboxControlDirective } from './checkbox-control.directive';
import { SwitchControlDirective } from './switch-control.directive';
import { RadioGroupControlDirective } from './radio-group-control.directive';
import { SelectControlDirective } from './select-control.directive';
import { ListboxControlDirective } from './listbox-control.directive';
import { ComboboxControlDirective } from './combobox-control.directive';

/** Import this in a standalone component's `imports` to enable Forms on every Quartz control. */
export const QUARTZ_FORMS = [
  CheckboxControlDirective,
  SwitchControlDirective,
  RadioGroupControlDirective,
  SelectControlDirective,
  ListboxControlDirective,
  ComboboxControlDirective,
] as const;
