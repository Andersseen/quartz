export type RadioGroupOrientation = 'horizontal' | 'vertical';

export interface RadioGroupConfig<T> {
  orientation: RadioGroupOrientation;
  loop: boolean;
  compareWith: (a: T, b: T) => boolean;
}

export const DEFAULT_RADIO_GROUP_CONFIG: RadioGroupConfig<unknown> = {
  orientation: 'vertical',
  loop: true,
  compareWith: Object.is,
};
