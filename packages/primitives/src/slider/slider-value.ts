import { DEFAULT_SLIDER_CONFIG } from './slider.types';

export type SliderRounding = 'nearest' | 'floor' | 'ceil';

/**
 * Deterministic numeric contract shared by Slider and RangeSlider.
 *
 * - Non-finite or swapped bounds are repaired (`NaN` → default, `min > max` → swapped).
 * - A step that is not a positive finite number falls back to `1`.
 * - The value grid is `min + n * step` **plus `max` itself**, so a range that is not a multiple of
 *   the step (`0..10` step `3`) can still reach its maximum.
 * - Arithmetic is done on integers scaled by the largest decimal count of `min` and `step`, so
 *   repeated `0.1` steps never accumulate floating-point drift.
 * - `NaN` snaps to `min`, `±Infinity` clamps to the matching bound.
 */
export function resolveSliderBounds(min: number, max: number): { min: number; max: number } {
  const lo = Number.isFinite(min) ? min : DEFAULT_SLIDER_CONFIG.min;
  const hi = Number.isFinite(max) ? max : DEFAULT_SLIDER_CONFIG.max;
  return lo <= hi ? { min: lo, max: hi } : { min: hi, max: lo };
}

export function resolveSliderStep(step: number): number {
  return Number.isFinite(step) && step > 0 ? step : DEFAULT_SLIDER_CONFIG.step;
}

export function snapSliderValue(
  value: number,
  min: number,
  max: number,
  step: number,
  rounding: SliderRounding = 'nearest',
): number {
  const bounds = resolveSliderBounds(min, max);
  const stepSize = resolveSliderStep(step);
  if (Number.isNaN(value)) return bounds.min;
  if (value <= bounds.min) return bounds.min;
  if (value >= bounds.max) return bounds.max;

  const factor = 10 ** Math.min(12, Math.max(decimalPlaces(bounds.min), decimalPlaces(stepSize)));
  const scaledMin = Math.round(bounds.min * factor);
  const scaledStep = Math.round(stepSize * factor);
  if (scaledStep <= 0) return rounding === 'ceil' ? bounds.max : bounds.min;

  const range = Math.round(bounds.max * factor) - scaledMin;
  const lastIndex = Math.floor(range / scaledStep + 1e-9);
  const position = (value * factor - scaledMin) / scaledStep;
  const lowerIndex = Math.min(lastIndex, Math.max(0, Math.floor(position + 1e-9)));
  const lower = (scaledMin + lowerIndex * scaledStep) / factor;
  const upper =
    lowerIndex < lastIndex ? (scaledMin + (lowerIndex + 1) * scaledStep) / factor : bounds.max;

  if (Math.abs(value - lower) <= (scaledStep / factor) * 1e-9) return lower;
  if (rounding === 'floor') return lower;
  if (rounding === 'ceil') return upper;
  return value - lower < upper - value ? lower : upper;
}

export function normalizeSliderValue(
  value: number,
  min: number,
  max: number,
  step: number,
): number {
  return snapSliderValue(value, min, max, step, 'nearest');
}

export function sliderPercent(value: number, min: number, max: number): number {
  const bounds = resolveSliderBounds(min, max);
  if (bounds.min === bounds.max) return 0;
  const percent = ((value - bounds.min) / (bounds.max - bounds.min)) * 100;
  return Math.min(100, Math.max(0, percent));
}

export function valueFromPercent(percent: number, min: number, max: number, step: number): number {
  const bounds = resolveSliderBounds(min, max);
  return normalizeSliderValue(
    bounds.min + (bounds.max - bounds.min) * (percent / 100),
    bounds.min,
    bounds.max,
    step,
  );
}

/** Keyboard step for PageUp/PageDown: a tenth of the range, never smaller than one step. */
export function sliderPageStep(min: number, max: number, step: number): number {
  const bounds = resolveSliderBounds(min, max);
  return Math.max(resolveSliderStep(step), (bounds.max - bounds.min) / 10);
}

function decimalPlaces(value: number): number {
  const text = String(Math.abs(value));
  const exponent = /e-(\d+)$/.exec(text);
  const mantissa = text.replace(/e[-+]\d+$/, '');
  const fraction = mantissa.includes('.') ? (mantissa.split('.')[1]?.length ?? 0) : 0;
  return fraction + (exponent ? Number(exponent[1]) : 0);
}
