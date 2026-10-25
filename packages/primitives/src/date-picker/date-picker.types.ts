/** An incomplete or complete calendar date range. Values are local civil dates. */
export interface DateRange {
  start: Date | null;
  end: Date | null;
}

export interface CalendarDay {
  /** The local civil date represented by this cell, normalized to noon. */
  date: Date;
  day: number;
  inCurrentMonth: boolean;
  disabled: boolean;
  today: boolean;
  selected: boolean;
  rangeStart: boolean;
  rangeEnd: boolean;
  inRange: boolean;
  preview: boolean;
}

export type DateDisabled = (date: Date) => boolean;

export interface DatePickerConfig {
  firstDayOfWeek: number;
  locale: string;
}

export const DEFAULT_DATE_PICKER_CONFIG: DatePickerConfig = {
  firstDayOfWeek: 0,
  locale: 'en',
};
