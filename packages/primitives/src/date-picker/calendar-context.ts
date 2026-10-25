import { InjectionToken } from '@angular/core';
import type { CalendarDay } from './date-picker.types';

/** Shared behavior contract used by the calendar grid and date-button directives. */
export abstract class CalendarContext {
  abstract readonly monthLabel: () => string;
  abstract readonly weekdays: () => string[];
  abstract readonly days: () => CalendarDay[];
  abstract readonly weeks: () => CalendarDay[][];
  abstract readonly focusedDate: () => Date | null;
  abstract readonly disabled: () => boolean;
  abstract isFocused(date: Date): boolean;
  abstract moveFocus(date: Date): void;
  abstract onDateButtonKeydown(date: Date, event: KeyboardEvent): void;
  abstract chooseDate(date: Date): void;
  abstract setPreview(date: Date | null): void;
  abstract previousMonth(): void;
  abstract nextMonth(): void;
}

export const CALENDAR_CONTEXT = new InjectionToken<CalendarContext>('QZ_CALENDAR_CONTEXT');
