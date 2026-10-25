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
import type { DateDisabled } from './date-picker.types';

/** Inline single-date calendar behavior. Programmatic model writes never emit `dateChangeCommitted`. */
@Directive({
  selector: '[qzDatePicker]',
  exportAs: 'qzDatePicker',
  standalone: true,
  providers: [{ provide: CALENDAR_CONTEXT, useExisting: forwardRef(() => DatePickerDirective) }],
  host: {
    '[attr.data-qz-disabled]': 'isDisabled() ? "" : null',
    '(focusout)': 'onFocusOut($event)',
  },
})
export class DatePickerDirective extends CalendarContext {
  readonly date = model<Date | null>(null);
  readonly displayedMonth = model<Date | null>(null);
  readonly focusedDate = model<Date | null>(null);
  readonly min = input<Date | null>(null);
  readonly max = input<Date | null>(null);
  readonly disabled = input(false, { transform: booleanAttribute });
  readonly dateDisabled = input<DateDisabled | null>(null);
  readonly firstDayOfWeek = input(0);
  readonly locale = input('en');
  readonly dir = input<'ltr' | 'rtl' | null>(null);
  /** Supply a stable civil date for tests and SSR; defaults to the current local date. */
  readonly today = input<Date | null>(null);
  readonly dateChangeCommitted = output<Date>();
  readonly #formDisabled = signal(false);
  readonly isDisabled = computed(() => this.disabled() || this.#formDisabled());
  readonly currentToday = computed(() => normalizeDate(this.today() ?? new Date())!);
  readonly selectedDate = computed(() => normalizeDate(this.date()));
  readonly month = computed(() =>
    startOfMonth(
      normalizeDate(
        this.displayedMonth() ?? this.focusedDate() ?? this.selectedDate() ?? this.currentToday(),
      )!,
    ),
  );
  readonly monthLabel = computed(() => formatMonth(this.month(), this.locale()));
  readonly weekdays = computed(() => weekdayNames(this.#weekStart(), this.locale()));
  readonly days = computed(() =>
    createMonthGrid(
      this.month(),
      this.#weekStart(),
      this.currentToday(),
      this.selectedDate(),
      normalizeDate(this.min()),
      normalizeDate(this.max()),
      this.dateDisabled(),
    ).map((day) => ({ ...day, disabled: this.#isDateDisabled(day.date) })),
  );
  readonly weeks = computed(() =>
    Array.from({ length: 6 }, (_, index) => this.days().slice(index * 7, index * 7 + 7)),
  );
  readonly focused = computed(
    () => normalizeDate(this.focusedDate()) ?? this.selectedDate() ?? this.currentToday(),
  );

  constructor() {
    super();
    effect(() => {
      const rawSelected = this.date();
      const selected = normalizeDate(rawSelected);
      if (rawSelected && !selected) this.date.set(null);
      else if (rawSelected && selected && rawSelected.getTime() !== selected.getTime())
        this.date.set(selected);
      const month = normalizeDate(this.displayedMonth());
      if (month && this.displayedMonth()?.getDate() !== 1)
        this.displayedMonth.set(startOfMonth(month));
      if (!this.displayedMonth())
        this.displayedMonth.set(startOfMonth(selected ?? this.currentToday()));
      if (!this.focusedDate()) this.focusedDate.set(selected ?? this.currentToday());
    });
  }

  override moveFocus(value: Date): void {
    const date = normalizeDate(value);
    if (!date) return;
    this.focusedDate.set(date);
    if (
      date.getMonth() !== this.month().getMonth() ||
      date.getFullYear() !== this.month().getFullYear()
    ) {
      this.displayedMonth.set(startOfMonth(date));
    }
  }

  override onDateButtonKeydown(date: Date, event: KeyboardEvent): void {
    const rtl = this.dir() === 'rtl' || (!this.dir() && this.#isRtlFromDom(event.currentTarget));
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
      this.moveFocus(next); // Disabled days are focusable, but never selectable.
      const target = (event.currentTarget as HTMLElement)
        .closest('[qzcalendargrid]')
        ?.querySelector<HTMLElement>(`[data-qz-date="${dateDomKey(next)}"]`);
      target?.focus();
    }
  }

  override chooseDate(value: Date): void {
    if (this.isDisabled()) return;
    const date = normalizeDate(value);
    if (!date || this.#isDateDisabled(date)) return;
    if (this.selectedDate() && compareDays(this.selectedDate()!, date) === 0) return;
    this.date.set(date);
    this.moveFocus(date);
    this.dateChangeCommitted.emit(date);
  }

  override setPreview(_date: Date | null): void {}
  override isFocused(date: Date): boolean {
    return compareDays(this.focused(), date) === 0;
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
  writeFormValue(value: Date | null | undefined): void {
    this.date.set(normalizeDate(value));
  }
  onFocusOut(event: FocusEvent): void {
    const host = event.currentTarget as HTMLElement;
    const next = event.relatedTarget;
    if (next instanceof Node && host.contains(next)) return;
  }

  isDateDisabled(value: Date): boolean {
    return this.#isDateDisabled(value);
  }
  isDateSelected(value: Date): boolean {
    return compareDays(this.selectedDate() ?? value, value) === 0 && !!this.selectedDate();
  }
  isDateFocused(value: Date): boolean {
    return compareDays(this.focused(), value) === 0;
  }

  #changeMonth(amount: number): void {
    const date = addMonths(this.month(), amount);
    this.displayedMonth.set(startOfMonth(date));
    this.moveFocus(
      makeDate(
        date.getFullYear(),
        date.getMonth(),
        Math.min(
          this.focused().getDate(),
          makeDate(date.getFullYear(), date.getMonth() + 1, 0).getDate(),
        ),
      ),
    );
  }
  #weekStart(): number {
    const value = this.firstDayOfWeek();
    return Number.isInteger(value) ? ((value % 7) + 7) % 7 : 0;
  }
  #isDateDisabled(date: Date): boolean {
    const min = normalizeDate(this.min());
    const max = normalizeDate(this.max());
    return (
      this.isDisabled() ||
      (!!min && compareDays(date, min) < 0) ||
      (!!max && compareDays(date, max) > 0) ||
      !!this.dateDisabled()?.(date)
    );
  }
  #isRtlFromDom(target: EventTarget | null): boolean {
    return target instanceof HTMLElement && target.closest('[dir="rtl"]') !== null;
  }
}
