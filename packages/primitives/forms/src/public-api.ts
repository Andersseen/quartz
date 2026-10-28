export { CheckboxControlDirective } from './checkbox-control.directive';
export { SwitchControlDirective } from './switch-control.directive';
export { RadioGroupControlDirective } from './radio-group-control.directive';
export { SelectControlDirective } from './select-control.directive';
export { ListboxControlDirective } from './listbox-control.directive';
export { ComboboxControlDirective } from './combobox-control.directive';
export { SliderControlDirective } from './slider-control.directive';
export { RangeSliderControlDirective } from './range-slider-control.directive';
export { ToggleControlDirective } from './toggle-control.directive';
export { ToggleGroupControlDirective } from './toggle-group-control.directive';
export { DatePickerControlDirective } from './date-picker-control.directive';
export { DateRangePickerControlDirective } from './date-range-picker-control.directive';
export { FormFieldStateDirective } from './form-field-state.directive';
export { InputOtpControlDirective } from './input-otp-control.directive';

import { CheckboxControlDirective } from './checkbox-control.directive';
import { SwitchControlDirective } from './switch-control.directive';
import { RadioGroupControlDirective } from './radio-group-control.directive';
import { SelectControlDirective } from './select-control.directive';
import { ListboxControlDirective } from './listbox-control.directive';
import { ComboboxControlDirective } from './combobox-control.directive';
import { SliderControlDirective } from './slider-control.directive';
import { RangeSliderControlDirective } from './range-slider-control.directive';
import { ToggleControlDirective } from './toggle-control.directive';
import { ToggleGroupControlDirective } from './toggle-group-control.directive';
import { DatePickerControlDirective } from './date-picker-control.directive';
import { DateRangePickerControlDirective } from './date-range-picker-control.directive';
import { FormFieldStateDirective } from './form-field-state.directive';
import { InputOtpControlDirective } from './input-otp-control.directive';

/** Import this in a standalone component's `imports` to enable Forms on every Quartz control. */
export const QUARTZ_FORMS = [
  CheckboxControlDirective,
  SwitchControlDirective,
  RadioGroupControlDirective,
  SelectControlDirective,
  ListboxControlDirective,
  ComboboxControlDirective,
  SliderControlDirective,
  RangeSliderControlDirective,
  ToggleControlDirective,
  ToggleGroupControlDirective,
  DatePickerControlDirective,
  DateRangePickerControlDirective,
  FormFieldStateDirective,
  InputOtpControlDirective,
] as const;
