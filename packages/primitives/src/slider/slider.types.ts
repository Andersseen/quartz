export type SliderOrientation = 'horizontal' | 'vertical';

export interface SliderConfig {
  min: number;
  max: number;
  step: number;
  orientation: SliderOrientation;
}

export const DEFAULT_SLIDER_CONFIG: SliderConfig = {
  min: 0,
  max: 100,
  step: 1,
  orientation: 'horizontal',
};
