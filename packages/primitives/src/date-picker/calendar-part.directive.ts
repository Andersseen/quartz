import { computed, Directive, inject, input } from '@angular/core';
import { dateDomKey, withLocale } from './date-operations';
import { CALENDAR_CONTEXT } from './calendar-context';
import type { CalendarDay } from './date-picker.types';

/** Adds grid semantics and a live month label to a consumer-owned calendar grid. */
@Directive({
  selector: '[qzCalendarGrid]',
  standalone: true,
  host: {
    role: 'grid',
    '[attr.aria-label]': 'calendar.monthLabel()',
    '[attr.aria-rowcount]': '7',
    '[attr.aria-colcount]': '7',
    '(pointerleave)': 'calendar.setPreview(null)',
  },
})
export class CalendarGridDirective {
  protected readonly calendar = inject(CALENDAR_CONTEXT);
}

@Directive({ selector: '[qzCalendarRow]', standalone: true, host: { role: 'row' } })
export class CalendarRowDirective {}

/** Gridcell semantics and state hooks for one `CalendarDay`. */
@Directive({
  selector: '[qzCalendarCell]',
  standalone: true,
  host: {
    role: 'gridcell',
    '[attr.aria-selected]': 'day().selected ? "true" : "false"',
    '[attr.aria-disabled]': 'day().disabled || calendar.disabled() ? "true" : null',
    '[attr.data-qz-today]': 'day().today ? "" : null',
    '[attr.data-qz-selected]': 'day().selected ? "" : null',
    '[attr.data-qz-disabled]': 'day().disabled || calendar.disabled() ? "" : null',
    '[attr.data-qz-outside-month]': '!day().inCurrentMonth ? "" : null',
    '[attr.data-qz-range-start]': 'day().rangeStart ? "" : null',
    '[attr.data-qz-range-end]': 'day().rangeEnd ? "" : null',
    '[attr.data-qz-in-range]': 'day().inRange ? "" : null',
    '[attr.data-qz-range-preview]': 'day().preview ? "" : null',
  },
})
export class CalendarCellDirective {
  protected readonly calendar = inject(CALENDAR_CONTEXT);
  readonly day = input.required<CalendarDay>({ alias: 'qzCalendarCell' });
}

/** Roving-focus native date button with APG keyboard behavior and date semantics. */
@Directive({
  selector: 'button[qzCalendarDateButton]',
  exportAs: 'qzCalendarDateButton',
  standalone: true,
  host: {
    type: 'button',
    '[attr.aria-label]': 'accessibleName()',
    '[attr.aria-pressed]': 'day().selected ? "true" : "false"',
    '[attr.aria-disabled]': 'day().disabled || calendar.disabled() ? "true" : null',
    '[attr.tabindex]': 'calendar.isFocused(day().date) ? 0 : -1',
    '[attr.data-qz-focused]': 'calendar.isFocused(day().date) ? "" : null',
    '[attr.data-qz-today]': 'day().today ? "" : null',
    '[attr.data-qz-selected]': 'day().selected ? "" : null',
    '[attr.data-qz-disabled]': 'day().disabled || calendar.disabled() ? "" : null',
    '[attr.data-qz-outside-month]': '!day().inCurrentMonth ? "" : null',
    '[attr.data-qz-range-start]': 'day().rangeStart ? "" : null',
    '[attr.data-qz-range-end]': 'day().rangeEnd ? "" : null',
    '[attr.data-qz-in-range]': 'day().inRange ? "" : null',
    '[attr.data-qz-range-preview]': 'day().preview ? "" : null',
    '[attr.data-qz-date]': 'dateKey(day().date)',
    '(focus)': 'calendar.moveFocus(day().date)',
    '(keydown)': 'calendar.onDateButtonKeydown(day().date, $event)',
    '(click)': 'calendar.chooseDate(day().date)',
    '(pointerenter)': 'calendar.setPreview(day().date)',
  },
})
export class CalendarDateButtonDirective {
  protected readonly calendar = inject(CALENDAR_CONTEXT);
  readonly day = input.required<CalendarDay>({ alias: 'qzCalendarDateButton' });
  readonly locale = input('en');
  /** Override the default full-date name when the application has additional date context. */
  readonly dateLabel = input<((date: Date, locale: string) => string) | null>(null);
  readonly accessibleName = computed(
    () =>
      this.dateLabel()?.(this.day().date, this.locale()) ??
      withLocale(this.locale(), this.day().date),
  );
  sameDate(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
  dateKey(date: Date): string {
    return dateDomKey(date);
  }
}

/** Month heading text that announces navigation without introducing a second live region. */
@Directive({
  selector: '[qzCalendarMonthLabel]',
  standalone: true,
  host: { 'aria-live': 'polite', 'aria-atomic': 'true', '[textContent]': 'calendar.monthLabel()' },
})
export class CalendarMonthLabelDirective {
  protected readonly calendar = inject(CALENDAR_CONTEXT);
}

@Directive({
  selector: 'button[qzCalendarPreviousMonth]',
  standalone: true,
  host: {
    type: 'button',
    '[attr.aria-label]': 'label()',
    '[attr.disabled]': 'calendar.disabled() ? "" : null',
    '(click)': 'calendar.previousMonth()',
  },
})
export class CalendarPreviousMonthDirective {
  protected readonly calendar = inject(CALENDAR_CONTEXT);
  readonly label = input('Previous month', { alias: 'qzCalendarPreviousMonth' });
}

@Directive({
  selector: 'button[qzCalendarNextMonth]',
  standalone: true,
  host: {
    type: 'button',
    '[attr.aria-label]': 'label()',
    '[attr.disabled]': 'calendar.disabled() ? "" : null',
    '(click)': 'calendar.nextMonth()',
  },
})
export class CalendarNextMonthDirective {
  protected readonly calendar = inject(CALENDAR_CONTEXT);
  readonly label = input('Next month', { alias: 'qzCalendarNextMonth' });
}
