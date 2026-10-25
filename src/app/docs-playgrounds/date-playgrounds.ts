import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  output,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  CalendarCellDirective,
  CalendarDateButtonDirective,
  CalendarGridDirective,
  CalendarRowDirective,
  CalendarMonthLabelDirective,
  CalendarNextMonthDirective,
  CalendarPreviousMonthDirective,
  DatePickerDirective,
  DateRangePickerDirective,
} from '@quartz-headless/primitives';

function monthDate(value: string, day: number): Date {
  const [year, month] = value.split('-').map(Number);
  return new Date(year, month - 1, day, 12);
}

const CALENDAR_IMPORTS = [
  CommonModule,
  CalendarGridDirective,
  CalendarRowDirective,
  CalendarCellDirective,
  CalendarDateButtonDirective,
  CalendarMonthLabelDirective,
  CalendarPreviousMonthDirective,
  CalendarNextMonthDirective,
] as const;

@Component({
  selector: 'app-date-picker-playground',
  imports: [...CALENDAR_IMPORTS, DatePickerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      qzDatePicker
      [(date)]="date"
      [displayedMonth]="displayedMonth()"
      [today]="displayedMonth()"
      [min]="min()"
      [max]="max()"
      [disabled]="disabled()"
      [firstDayOfWeek]="firstDayOfWeek()"
      [locale]="locale()"
      [dir]="rtl() ? 'rtl' : 'ltr'"
      (dateChangeCommitted)="selection.emit($event.toLocaleDateString(locale()))"
      #calendar="qzDatePicker"
      class="max-w-md"
    >
      <div class="mb-3 flex items-center justify-between text-gray-100">
        <button qzCalendarPreviousMonth>Previous</button>
        <h3 qzCalendarMonthLabel></h3>
        <button qzCalendarNextMonth>Next</button>
      </div>
      <div qzCalendarGrid class="flex flex-col gap-1 text-center text-sm text-gray-200">
        <div qzCalendarRow class="grid grid-cols-7 gap-1">
          @for (weekday of calendar.weekdays(); track $index) {
            <div role="columnheader" class="py-2">{{ weekday }}</div>
          }
        </div>
        @for (week of calendar.weeks(); track $index) {
          <div qzCalendarRow class="grid grid-cols-7 gap-1">
            @for (day of week; track day.date.getTime()) {
              <div [qzCalendarCell]="day" class="p-1 data-[qz-in-range]:bg-cyan-500/20">
                <button
                  [qzCalendarDateButton]="day"
                  [locale]="locale()"
                  class="size-9 rounded data-[qz-selected]:bg-cyan-500 data-[qz-disabled]:opacity-35"
                >
                  {{ day.day }}
                </button>
              </div>
            }
          </div>
        }
      </div>
    </div>
    <p class="mt-3 text-sm text-gray-300">
      Selected: {{ date() ? (date() | date: 'longDate') : 'none' }}
    </p>
  `,
})
export class DatePickerPlaygroundComponent {
  readonly month = input('2024-02');
  readonly selectedDay = input(15);
  readonly minDay = input(0);
  readonly maxDay = input(0);
  readonly disabled = input(false);
  readonly firstDayOfWeek = input(1);
  readonly locale = input('en-US');
  readonly rtl = input(false);
  readonly selection = output<string>();
  readonly date = signal<Date | null>(null);
  readonly displayedMonth = computed(() => monthDate(this.month(), 1));
  readonly min = computed(() =>
    this.minDay() > 0 ? monthDate(this.month(), this.minDay()) : null,
  );
  readonly max = computed(() =>
    this.maxDay() > 0 ? monthDate(this.month(), this.maxDay()) : null,
  );
  constructor() {
    effect(() =>
      this.date.set(
        this.selectedDay() > 0 ? monthDate(this.month(), Math.min(28, this.selectedDay())) : null,
      ),
    );
  }
}

@Component({
  selector: 'app-date-range-picker-playground',
  imports: [...CALENDAR_IMPORTS, DateRangePickerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      qzDateRangePicker
      [(startDate)]="startDate"
      [(endDate)]="endDate"
      [displayedMonth]="displayedMonth()"
      [today]="displayedMonth()"
      [min]="min()"
      [max]="max()"
      [disabled]="disabled()"
      [firstDayOfWeek]="firstDayOfWeek()"
      [locale]="locale()"
      [dir]="rtl() ? 'rtl' : 'ltr'"
      (rangeChangeCommitted)="selection.emit(stringify($event))"
      #calendar="qzDateRangePicker"
      class="max-w-md"
    >
      <div class="mb-3 flex items-center justify-between text-gray-100">
        <button qzCalendarPreviousMonth>Previous</button>
        <h3 qzCalendarMonthLabel></h3>
        <button qzCalendarNextMonth>Next</button>
      </div>
      <div qzCalendarGrid class="flex flex-col gap-1 text-center text-sm text-gray-200">
        <div qzCalendarRow class="grid grid-cols-7 gap-1">
          @for (weekday of calendar.weekdays(); track $index) {
            <div role="columnheader" class="py-2">{{ weekday }}</div>
          }
        </div>
        @for (week of calendar.weeks(); track $index) {
          <div qzCalendarRow class="grid grid-cols-7 gap-1">
            @for (day of week; track day.date.getTime()) {
              <div
                [qzCalendarCell]="day"
                class="p-1 data-[qz-in-range]:bg-cyan-500/20 data-[qz-range-preview]:bg-cyan-500/10"
              >
                <button
                  [qzCalendarDateButton]="day"
                  [locale]="locale()"
                  class="size-9 rounded data-[qz-range-start]:bg-cyan-500 data-[qz-range-end]:bg-cyan-500 data-[qz-disabled]:opacity-35"
                >
                  {{ day.day }}
                </button>
              </div>
            }
          </div>
        }
      </div>
    </div>
    <p class="mt-3 text-sm text-gray-300">
      Range: {{ startDate() ? (startDate() | date: 'mediumDate') : 'start' }} →
      {{ endDate() ? (endDate() | date: 'mediumDate') : 'end' }}
    </p>
  `,
})
export class DateRangePickerPlaygroundComponent {
  readonly month = input('2024-02');
  readonly startDay = input(0);
  readonly endDay = input(0);
  readonly minDay = input(0);
  readonly maxDay = input(0);
  readonly disabled = input(false);
  readonly firstDayOfWeek = input(1);
  readonly locale = input('en-US');
  readonly rtl = input(false);
  readonly selection = output<string>();
  readonly startDate = signal<Date | null>(null);
  readonly endDate = signal<Date | null>(null);
  readonly displayedMonth = computed(() => monthDate(this.month(), 1));
  readonly min = computed(() =>
    this.minDay() > 0 ? monthDate(this.month(), this.minDay()) : null,
  );
  readonly max = computed(() =>
    this.maxDay() > 0 ? monthDate(this.month(), this.maxDay()) : null,
  );
  stringify(value: { start: Date | null; end: Date | null }): string {
    return JSON.stringify(value);
  }
  constructor() {
    effect(() => {
      this.startDate.set(
        this.startDay() > 0 ? monthDate(this.month(), Math.min(28, this.startDay())) : null,
      );
      this.endDate.set(
        this.endDay() > 0 ? monthDate(this.month(), Math.min(28, this.endDay())) : null,
      );
    });
  }
}
