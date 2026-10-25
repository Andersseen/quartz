import { forwardRef } from '@angular/core';
import {
  booleanAttribute,
  computed,
  Directive,
  effect,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { CalendarContext, CALENDAR_CONTEXT } from './calendar-context';
import {
  addDays,
  addMonths,
  compareDays,
  createMonthGrid,
  dateDomKey,
  formatMonth,
  makeDate,
  normalizeDate,
  startOfMonth,
  weekdayNames,
} from './date-operations';
import type { CalendarDay, DateDisabled, DateRange } from './date-picker.types';

/** Inline range calendar. Picking a new start clears the previous end; the second pick commits a sorted range. */
@Directive({
  selector: '[qzDateRangePicker]',
  exportAs: 'qzDateRangePicker',
  standalone: true,
  providers: [
    { provide: CALENDAR_CONTEXT, useExisting: forwardRef(() => DateRangePickerDirective) },
  ],
  host: { '[attr.data-qz-disabled]': 'isDisabled() ? "" : null' },
})
export class DateRangePickerDirective extends CalendarContext {
  readonly startDate = model<Date | null>(null);
  readonly endDate = model<Date | null>(null);
  readonly displayedMonth = model<Date | null>(null);
  readonly focusedDate = model<Date | null>(null);
  readonly min = input<Date | null>(null);
  readonly max = input<Date | null>(null);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly dateDisabled = input<DateDisabled | null>(null);
  readonly firstDayOfWeek = input(0);
  readonly locale = input('en');
  readonly dir = input<'ltr' | 'rtl' | null>(null);
  readonly today = input<Date | null>(null);
  readonly rangeChangeCommitted = output<DateRange>();
  readonly previewDate = signal<Date | null>(null);
  readonly #formDisabled = signal(false);
  readonly isDisabled = computed(() => this.disabled() || this.#formDisabled());
  readonly currentToday = computed(() => normalizeDate(this.today() ?? new Date())!);
  readonly start = computed(() => normalizeDate(this.startDate()));
  readonly end = computed(() => normalizeDate(this.endDate()));
  readonly month = computed(() =>
    startOfMonth(
      normalizeDate(
        this.displayedMonth() ?? this.focusedDate() ?? this.start() ?? this.currentToday(),
      )!,
    ),
  );
  readonly monthLabel = computed(() => formatMonth(this.month(), this.locale()));
  readonly weekdays = computed(() => weekdayNames(this.#weekStart(), this.locale()));
  readonly focused = computed(
    () => normalizeDate(this.focusedDate()) ?? this.start() ?? this.currentToday(),
  );
  readonly days = computed<CalendarDay[]>(() => {
    const start = this.start();
    const end = this.end();
    const preview = start && !end ? normalizeDate(this.previewDate()) : null;
    let rangeLow: Date | null = end ?? preview;
    let rangeHigh: Date | null = end ?? preview;
    if (start && rangeLow && compareDays(start, rangeLow) > 0)
      [rangeLow, rangeHigh] = [rangeHigh, start];
    else if (start) rangeLow = start;
    return createMonthGrid(
      this.month(),
      this.#weekStart(),
      this.currentToday(),
      null,
      normalizeDate(this.min()),
      normalizeDate(this.max()),
      this.dateDisabled(),
    ).map((day) => {
      day = { ...day, disabled: this.#isDateDisabled(day.date) };
      const inRange =
        !!start &&
        !!rangeLow &&
        !!rangeHigh &&
        compareDays(day.date, rangeLow) >= 0 &&
        compareDays(day.date, rangeHigh) <= 0;
      return {
        ...day,
        rangeStart: !!start && compareDays(day.date, start) === 0,
        rangeEnd: !!end && compareDays(day.date, end) === 0,
        selected:
          (!!start && compareDays(day.date, start) === 0) ||
          (!!end && compareDays(day.date, end) === 0),
        inRange,
        preview: !!preview && inRange && !day.selected,
      };
    });
  });
  readonly weeks = computed(() =>
    Array.from({ length: 6 }, (_, index) => this.days().slice(index * 7, index * 7 + 7)),
  );
  readonly range = computed<DateRange>(() => ({ start: this.start(), end: this.end() }));
  readonly isSelectingEnd = computed(() => !!this.start() && !this.end());

  constructor() {
    super();
    effect(() => {
      const rawStart = this.startDate();
      const rawEnd = this.endDate();
      const start = normalizeDate(rawStart);
      const end = normalizeDate(rawEnd);
      if (rawStart && !start) this.startDate.set(null);
      else if (rawStart && start && rawStart.getTime() !== start.getTime())
        this.startDate.set(start);
      if (rawEnd && !end) this.endDate.set(null);
      else if (rawEnd && end && rawEnd.getTime() !== end.getTime()) this.endDate.set(end);
      if (start && end && compareDays(start, end) > 0) {
        this.startDate.set(end);
        this.endDate.set(start);
      }
      if (!this.displayedMonth())
        this.displayedMonth.set(startOfMonth(start ?? this.currentToday()));
      if (!this.focusedDate()) this.focusedDate.set(start ?? this.currentToday());
    });
  }

  override moveFocus(value: Date): void {
    const date = normalizeDate(value);
    if (!date) return;
    this.focusedDate.set(date);
    if (
      date.getMonth() !== this.month().getMonth() ||
      date.getFullYear() !== this.month().getFullYear()
    )
      this.displayedMonth.set(startOfMonth(date));
  }
  override onDateButtonKeydown(date: Date, event: KeyboardEvent): void {
    const rtl =
      this.dir() === 'rtl' ||
      (!this.dir() &&
        event.currentTarget instanceof HTMLElement &&
        !!event.currentTarget.closest('[dir="rtl"]'));
    const amount = event.shiftKey ? 12 : 1;
    let next: Date | null = null;
    switch (event.key) {
      case 'ArrowLeft':
        next = addDays(date, rtl ? 1 : -1);
        break;
      case 'ArrowRight':
        next = addDays(date, rtl ? -1 : 1);
        break;
      case 'ArrowUp':
        next = addDays(date, -7);
        break;
      case 'ArrowDown':
        next = addDays(date, 7);
        break;
      case 'Home':
        next = addDays(date, -((date.getDay() - this.#weekStart() + 7) % 7));
        break;
      case 'End':
        next = addDays(date, 6 - ((date.getDay() - this.#weekStart() + 7) % 7));
        break;
      case 'PageUp':
        next = addMonths(date, -amount);
        break;
      case 'PageDown':
        next = addMonths(date, amount);
        break;
      case 'Enter':
      case ' ':
        this.chooseDate(date);
        event.preventDefault();
        return;
      default:
        return;
    }
    event.preventDefault();
    if (next) {
      this.moveFocus(next);
      (event.currentTarget as HTMLElement)
        .closest('[qzcalendargrid]')
        ?.querySelector<HTMLElement>(`[data-qz-date="${dateDomKey(next)}"]`)
        ?.focus();
    }
  }
  override chooseDate(value: Date): void {
    if (this.isDisabled()) return;
    const date = normalizeDate(value);
    if (!date || this.#isDateDisabled(date)) return;
    const start = this.start();
    const end = this.end();
    let next: DateRange;
    if (!start || end) next = { start: date, end: null };
    else {
      const low = compareDays(start, date) <= 0 ? start : date;
      const high = low === start ? date : start;
      if (this.#hasBlockedDay(low, high)) return;
      next = { start: low, end: high };
    }
    this.startDate.set(next.start);
    this.endDate.set(next.end);
    this.moveFocus(date);
    this.previewDate.set(null);
    this.rangeChangeCommitted.emit(next);
  }
  override setPreview(value: Date | null): void {
    this.previewDate.set(normalizeDate(value));
  }
  override isFocused(date: Date): boolean {
    return compareDays(this.focused(), date) === 0;
  }
  clear(): void {
    this.startDate.set(null);
    this.endDate.set(null);
    this.previewDate.set(null);
    this.rangeChangeCommitted.emit({ start: null, end: null });
  }
  override previousMonth(): void {
    this.#changeMonth(-1);
  }
  override nextMonth(): void {
    this.#changeMonth(1);
  }
  setFormDisabled(value: boolean): void {
    this.#formDisabled.set(value);
  }
  writeFormValue(value: DateRange | null | undefined): void {
    if (!value || typeof value !== 'object') {
      this.startDate.set(null);
      this.endDate.set(null);
      return;
    }
    const start = normalizeDate(value.start);
    const end = normalizeDate(value.end);
    if (start && end && compareDays(start, end) > 0) {
      this.startDate.set(end);
      this.endDate.set(start);
    } else {
      this.startDate.set(start);
      this.endDate.set(end);
    }
  }
  isDateDisabled(value: Date): boolean {
    return this.#isDateDisabled(value);
  }
  isDateSelected(value: Date): boolean {
    return (
      (!!this.start() && compareDays(value, this.start()!) === 0) ||
      (!!this.end() && compareDays(value, this.end()!) === 0)
    );
  }
  isDateFocused(value: Date): boolean {
    return compareDays(this.focused(), value) === 0;
  }
  isInRange(value: Date): boolean {
    return this.days().some((day) => day.date.getTime() === value.getTime() && day.inRange);
  }

  #changeMonth(amount: number): void {
    const date = addMonths(this.month(), amount);
    this.displayedMonth.set(startOfMonth(date));
    const last = makeDate(date.getFullYear(), date.getMonth() + 1, 0).getDate();
    this.moveFocus(
      makeDate(date.getFullYear(), date.getMonth(), Math.min(this.focused().getDate(), last)),
    );
  }
  #weekStart(): number {
    const value = this.firstDayOfWeek();
    return Number.isInteger(value) ? ((value % 7) + 7) % 7 : 0;
  }
  #isDateDisabled(value: Date): boolean {
    const min = normalizeDate(this.min());
    const max = normalizeDate(this.max());
    return (
      this.isDisabled() ||
      (!!min && compareDays(value, min) < 0) ||
      (!!max && compareDays(value, max) > 0) ||
      !!this.dateDisabled()?.(value)
    );
  }
  #hasBlockedDay(low: Date, high: Date): boolean {
    for (let date = low; compareDays(date, high) <= 0; date = addDays(date, 1))
      if (this.#isDateDisabled(date)) return true;
    return false;
  }
}
