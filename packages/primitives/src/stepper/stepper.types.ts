export type StepperOrientation = 'horizontal' | 'vertical';
export type StepperActivationMode = 'manual' | 'automatic';
export type StepState = 'active' | 'inactive' | 'completed' | 'disabled';

export interface StepperConfig<T> {
  orientation: StepperOrientation;
  activationMode: StepperActivationMode;
  linear: boolean;
  compareWith: (a: T, b: T) => boolean;
}

export const DEFAULT_STEPPER_CONFIG: StepperConfig<unknown> = {
  orientation: 'horizontal',
  activationMode: 'manual',
  linear: false,
  compareWith: Object.is,
};
