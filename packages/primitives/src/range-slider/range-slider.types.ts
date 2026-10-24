import type { SliderOrientation } from '../slider/slider.types';

export type RangeSliderOrientation = SliderOrientation;
export type RangeSliderThumbName = 'low' | 'high';

/** Canonical range value (also the Angular Forms value): `low <= high`, both within `min..max`. */
export interface RangeSliderValue {
  low: number;
  high: number;
}

export interface RangeSliderConfig {
  min: number;
  max: number;
  step: number;
  minDistance: number;
  orientation: RangeSliderOrientation;
}

export const DEFAULT_RANGE_SLIDER_CONFIG: RangeSliderConfig = {
  min: 0,
  max: 100,
  step: 1,
  minDistance: 0,
  orientation: 'horizontal',
};
