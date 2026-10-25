import { describe, expect, it } from 'vitest';
import {
  addDays,
  addMonths,
  compareDays,
  createMonthGrid,
  formatDay,
  makeDate,
  normalizeDate,
  weekdayNames,
} from './date-operations';

describe('calendar date operations', () => {
  it('normalizes time while retaining the local civil day and rejects invalid dates', () => {
    const value = new Date(2024, 2, 10, 1, 30);
    expect(normalizeDate(value)?.getHours()).toBe(12);
    expect(compareDays(value, new Date(2024, 2, 10, 23, 59))).toBe(0);
    expect(normalizeDate(new Date(Number.NaN))).toBeNull();
  });
  it('clamps month arithmetic across leap and non-leap February and year boundaries', () => {
    expect(addMonths(makeDate(2024, 0, 31), 1)).toEqual(makeDate(2024, 1, 29));
    expect(addMonths(makeDate(2023, 0, 31), 1)).toEqual(makeDate(2023, 1, 28));
    expect(addMonths(makeDate(2024, 11, 31), 1)).toEqual(makeDate(2025, 0, 31));
  });
  it('preserves literal years from 0 through 99', () => {
    const date = makeDate(15, 0, 31);
    expect(date.getFullYear()).toBe(15);
    expect(addMonths(date, 1)).toEqual(makeDate(15, 1, 28));
  });
  it('adds calendar days over month boundaries without time drift', () => {
    expect(addDays(makeDate(2024, 2, 9), 1)).toEqual(makeDate(2024, 2, 10));
    expect(addDays(makeDate(2024, 11, 31), 1)).toEqual(makeDate(2025, 0, 1));
  });
  it('generates six complete weeks from the configured week start and marks constraints', () => {
    const grid = createMonthGrid(
      makeDate(2024, 1, 1),
      1,
      makeDate(2024, 1, 29),
      null,
      makeDate(2024, 1, 5),
      null,
      (date) => date.getDate() === 14,
    );
    expect(grid).toHaveLength(42);
    expect(grid[0].date.getDay()).toBe(1);
    expect(grid.find((day) => day.day === 4 && day.date.getMonth() === 1)?.disabled).toBe(true);
    expect(grid.find((day) => day.day === 14 && day.date.getMonth() === 1)?.disabled).toBe(true);
    expect(grid.find((day) => day.day === 29 && day.date.getMonth() === 1)?.today).toBe(true);
  });
  it('formats localized accessible labels and weekday order', () => {
    expect(formatDay(makeDate(2024, 0, 2), 'fr-FR')).toContain('janvier');
    expect(weekdayNames(1, 'en-US')).toHaveLength(7);
    expect(weekdayNames(1, 'en-US')[0]).toBe('Mon');
  });
});
