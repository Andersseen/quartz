export function normalizeSliderValue(
  value: number,
  min: number,
  max: number,
  step: number,
): number {
  const low = Math.min(min, max);
  const high = Math.max(min, max);
  const clamped = Math.min(high, Math.max(low, Number.isFinite(value) ? value : low));
  const positiveStep = Number.isFinite(step) && step > 0 ? step : 1;
  const steps = Math.round((clamped - low) / positiveStep);
  return clampToPrecision(low + steps * positiveStep, low, high, decimalPlaces(positiveStep));
}

export function sliderPercent(value: number, min: number, max: number): number {
  if (min === max) return 0;
  return ((value - min) / (max - min)) * 100;
}

export function valueFromPercent(percent: number, min: number, max: number, step: number): number {
  return normalizeSliderValue(min + (max - min) * (percent / 100), min, max, step);
}

function clampToPrecision(value: number, min: number, max: number, precision: number): number {
  const rounded = Number(value.toFixed(Math.min(precision, 12)));
  return Math.min(max, Math.max(min, rounded));
}

function decimalPlaces(value: number): number {
  const text = String(value);
  if (!text.includes('.')) return 0;
  return text.split('.')[1]?.length ?? 0;
}
