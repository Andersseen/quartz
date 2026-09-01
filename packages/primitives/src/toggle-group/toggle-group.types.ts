export type ToggleGroupType = 'single' | 'multiple';
export type ToggleGroupOrientation = 'horizontal' | 'vertical';

export interface ToggleGroupConfig<T> {
  type: ToggleGroupType;
  orientation: ToggleGroupOrientation;
  loop: boolean;
  compareWith: (a: T, b: T) => boolean;
}

export const DEFAULT_TOGGLE_GROUP_CONFIG: ToggleGroupConfig<unknown> = {
  type: 'single',
  orientation: 'horizontal',
  loop: true,
  compareWith: Object.is,
};
