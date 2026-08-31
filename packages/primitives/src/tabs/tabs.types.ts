export type TabsOrientation = 'horizontal' | 'vertical';
export type TabsActivationMode = 'automatic' | 'manual';

export interface TabsConfig<T> {
  orientation: TabsOrientation;
  activationMode: TabsActivationMode;
  compareWith: (a: T, b: T) => boolean;
}

export const DEFAULT_TABS_CONFIG: TabsConfig<unknown> = {
  orientation: 'horizontal',
  activationMode: 'automatic',
  compareWith: Object.is,
};
