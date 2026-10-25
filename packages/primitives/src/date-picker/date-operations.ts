import type { CalendarDay, DateDisabled } from './date-picker.types';

const formatterCache = new Map<string, Intl.DateTimeFormat>();

/** Valid Date values become local civil dates at noon; invalid values become null. */
export function normalizeDate(value: Date | null | undefined): Date | null {
  if (!(value instanceof Date) || !Number.isFinite(value.getTime())) return null;
  return makeDate(value.getFullYear(), value.getMonth(), value.getDate());
}

export function makeDate(year: number, month: number, day: number): Date {
  const date = new Date(0, 0, 1, 12);
  date.setFullYear(year, month, day);
  return date;
}

export function dateKey(value: Date): number {
  return value.getFullYear() * 10000 + (value.getMonth() + 1) * 100 + value.getDate();
}

export function dateDomKey(value: Date): string {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`;
}

export function compareDays(a: Date, b: Date): number {
  return Math.sign(dateKey(a) - dateKey(b));
}

export function addDays(value: Date, amount: number): Date {
  const result = normalizeDate(value)!;
  result.setDate(result.getDate() + amount);
  return result;
}

export function addMonths(value: Date, amount: number): Date {
  const date = normalizeDate(value)!;
  const day = date.getDate();
  const first = makeDate(date.getFullYear(), date.getMonth() + amount, 1);
  const last = makeDate(first.getFullYear(), first.getMonth() + 1, 0).getDate();
  first.setDate(Math.min(day, last));
  return first;
}

export function startOfMonth(value: Date): Date {
  return makeDate(value.getFullYear(), value.getMonth(), 1);
}

export function endOfMonth(value: Date): Date {
  return makeDate(value.getFullYear(), value.getMonth() + 1, 0);
}

export function sameDay(a: Date | null, b: Date | null): boolean {
  return !!a && !!b && compareDays(a, b) === 0;
}

function formatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}:${JSON.stringify(options)}`;
  let result = formatterCache.get(key);
  if (!result) {
    try {
      result = new Intl.DateTimeFormat(locale, options);
    } catch {
      result = new Intl.DateTimeFormat('en', options);
    }
    formatterCache.set(key, result);
  }
  return result;
}

export function formatDay(value: Date, locale: string): string {
  return formatter(locale, {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(value);
}

export function formatMonth(value: Date, locale: string): string {
  return formatter(locale, { month: 'long', year: 'numeric' }).format(value);
}

export function weekdayNames(firstDayOfWeek: number, locale: string): string[] {
  const sunday = new Date(2023, 0, 1, 12); // Sunday; constructed numerically and independent of now.
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(sunday);
    date.setDate(1 + ((firstDayOfWeek + index) % 7));
    return formatter(locale, { weekday: 'short' }).format(date);
  });
}

export function createMonthGrid(
  month: Date,
  firstDayOfWeek: number,
  today: Date,
  selected: Date | null,
  min: Date | null,
  max: Date | null,
  disabledDate: DateDisabled | null,
): CalendarDay[] {
  const first = startOfMonth(month);
  const offset = (first.getDay() - firstDayOfWeek + 7) % 7;
  const gridStart = addDays(first, -offset);
  return Array.from({ length: 42 }, (_, index) => {
    const date = addDays(gridStart, index);
    const disabled =
      (!!min && compareDays(date, min) < 0) ||
      (!!max && compareDays(date, max) > 0) ||
      !!disabledDate?.(date);
    return {
      date,
      day: date.getDate(),
      inCurrentMonth: date.getMonth() === month.getMonth(),
      disabled,
      today: sameDay(date, today),
      selected: sameDay(date, selected),
      rangeStart: false,
      rangeEnd: false,
      inRange: false,
      preview: false,
    };
  });
}

export function withLocale(locale: string, date: Date): string {
  try {
    return formatDay(date, locale);
  } catch {
    return formatDay(date, 'en');
  }
}
