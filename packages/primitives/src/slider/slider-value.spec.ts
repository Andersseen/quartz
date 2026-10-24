import { describe, expect, it } from 'vitest';
import {
  normalizeSliderValue as norm,
  resolveSliderBounds,
  sliderPercent,
  snapSliderValue,
} from './slider-value';

describe('slider numeric contract', () => {
  it('snaps decimal steps without floating-point drift', () => {
    let value = 0;
    for (let i = 0; i < 10; i++) value = norm(value + 0.1, 0, 1, 0.1);
    expect(value).toBe(1);
    expect(norm(0.1 + 0.2, 0, 1, 0.1)).toBe(0.3);
    expect(norm(0.26, 0, 1, 0.1)).toBe(0.3);
    expect(norm(1.005, 0, 2, 0.001)).toBe(1.005);
    expect(norm(0.00000031, 0, 1, 1e-7)).toBe(3e-7);
  });

  it('handles non-zero minimum and negative ranges', () => {
    expect(norm(7, 5, 15, 2)).toBe(7);
    expect(norm(8, 5, 15, 2)).toBe(9);
    expect(norm(-0.3, -1, 1, 0.5)).toBe(-0.5);
    expect(norm(-50, -20, -10, 5)).toBe(-20);
  });

  it('keeps max reachable when the range is not a multiple of the step', () => {
    expect(norm(10, 0, 10, 3)).toBe(10);
    expect(norm(9.4, 0, 10, 3)).toBe(9);
    expect(norm(9.6, 0, 10, 3)).toBe(10);
    expect(snapSliderValue(9.5, 0, 10, 3, 'floor')).toBe(9);
    expect(snapSliderValue(9.5, 0, 10, 3, 'ceil')).toBe(10);
    expect(snapSliderValue(6, 0, 10, 3, 'ceil')).toBe(6);
    expect(snapSliderValue(6, 0, 10, 3, 'floor')).toBe(6);
  });

  it('repairs invalid step, bounds and values', () => {
    expect(norm(5.4, 0, 10, 0)).toBe(5);
    expect(norm(5.4, 0, 10, -1)).toBe(5);
    expect(norm(5.4, 0, 10, NaN)).toBe(5);
    expect(norm(5, 10, 0, 1)).toBe(5);
    expect(resolveSliderBounds(NaN, Infinity)).toEqual({ min: 0, max: 100 });
    expect(norm(3, 7, 7, 1)).toBe(7);
    expect(sliderPercent(7, 7, 7)).toBe(0);
    expect(norm(NaN, 2, 8, 1)).toBe(2);
    expect(norm(Infinity, 2, 8, 1)).toBe(8);
    expect(norm(-Infinity, 2, 8, 1)).toBe(2);
  });
});
