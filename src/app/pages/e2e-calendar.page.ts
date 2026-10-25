import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
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
import { QUARTZ_FORMS } from '@quartz-headless/primitives/forms';

/** Deterministic real-browser fixture for calendar keyboard, RTL, range and Forms contracts. */
@Component({
  selector: 'app-e2e-calendar',
  imports: [
    ReactiveFormsModule,
    DatePickerDirective,
    DateRangePickerDirective,
    CalendarGridDirective,
    CalendarRowDirective,
    CalendarCellDirective,
    CalendarDateButtonDirective,
    CalendarMonthLabelDirective,
    CalendarPreviousMonthDirective,
    CalendarNextMonthDirective,
    ...QUARTZ_FORMS,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { ngSkipHydration: 'true' },
  template: `
    <main
      id="app"
      [attr.dir]="rtl() ? 'rtl' : 'ltr'"
      [attr.data-ready]="'true'"
      style="padding:24px;background:white;color:#111"
    >
      <h1>Calendar test fixture</h1>
      <button id="toggle-rtl" type="button" (click)="rtl.update(value => !value)">
        Toggle RTL
      </button>
      <label
        >Locale
        <select id="calendar-locale" (change)="locale.set($any($event.target).value)">
          <option value="en-US">English</option>
          <option value="fr-FR">French</option>
        </select></label
      >
      <section
        id="single"
        qzDatePicker
        [today]="today"
        [min]="min"
        [max]="max"
        [dateDisabled]="disabledDate"
        [dir]="rtl() ? 'rtl' : 'ltr'"
        [firstDayOfWeek]="1"
        [locale]="locale()"
        (dateChangeCommitted)="singleCommits.update(v => v + 1)"
        #singlePicker="qzDatePicker"
      >
        <button id="single-previous" qzCalendarPreviousMonth>Previous month</button>
        <h2 qzCalendarMonthLabel></h2>
        <button id="single-next" qzCalendarNextMonth>Next month</button>
        <div qzCalendarGrid>
          <div qzCalendarRow>
            @for (weekday of singlePicker.weekdays(); track $index) {
              <div role="columnheader">{{ weekday }}</div>
            }
          </div>
          @for (week of singlePicker.weeks(); track $index) {
            <div qzCalendarRow>
              @for (day of week; track day.date.getTime()) {
                <div [qzCalendarCell]="day">
                  <button
                    [qzCalendarDateButton]="day"
                    [locale]="locale()"
                    [dateLabel]="day.day === 14 ? customDayLabel : null"
                  >
                    {{ day.day }}
                  </button>
                </div>
              }
            </div>
          }
        </div>
        <output id="single-value">{{
          singlePicker.date() ? dateText(singlePicker.date()!) : ''
        }}</output>
        <output id="single-commits">{{ singleCommits() }}</output>
      </section>
      <section
        id="range"
        qzDateRangePicker
        [today]="today"
        [formControl]="formRange"
        [dateDisabled]="disabledDate"
        (rangeChangeCommitted)="rangeCommits.update(v => v + 1)"
        #rangePicker="qzDateRangePicker"
      >
        <h2 qzCalendarMonthLabel></h2>
        <div qzCalendarGrid>
          <div qzCalendarRow>
            @for (weekday of rangePicker.weekdays(); track $index) {
              <div role="columnheader">{{ weekday }}</div>
            }
          </div>
          @for (week of rangePicker.weeks(); track $index) {
            <div qzCalendarRow>
              @for (day of week; track day.date.getTime()) {
                <div [qzCalendarCell]="day">
                  <button [qzCalendarDateButton]="day">{{ day.day }}</button>
                </div>
              }
            </div>
          }
        </div>
        <output id="range-value"
          >{{ rangePicker.start()?.getDate() ?? '' }}:{{
            rangePicker.end()?.getDate() ?? ''
          }}</output
        >
        <output id="range-commits">{{ rangeCommits() }}</output>
        <output id="range-form-value"
          >{{ formRange.value?.start?.getDate() ?? '' }}:{{
            formRange.value?.end?.getDate() ?? ''
          }}</output
        >
        <button id="range-form-reset" type="button" (click)="formRange.reset()">Reset range</button>
        <button id="range-form-disable" type="button" (click)="formRange.disable()">
          Disable range
        </button>
      </section>
      <section
        id="forms"
        qzDatePicker
        [today]="today"
        [formControl]="formDate"
        #formsPicker="qzDatePicker"
      >
        <h2 qzCalendarMonthLabel></h2>
        <div qzCalendarGrid>
          <div qzCalendarRow>
            @for (weekday of formsPicker.weekdays(); track $index) {
              <div role="columnheader">{{ weekday }}</div>
            }
          </div>
          @for (week of formsPicker.weeks(); track $index) {
            <div qzCalendarRow>
              @for (day of week; track day.date.getTime()) {
                <div [qzCalendarCell]="day">
                  <button [qzCalendarDateButton]="day">{{ day.day }}</button>
                </div>
              }
            </div>
          }
        </div>
        <output id="form-value">{{ formDate.value?.getDate() ?? '' }}</output>
        <button id="form-reset" type="button" (click)="formDate.reset()">Reset</button>
        <button id="form-disable" type="button" (click)="formDate.disable()">Disable</button>
      </section>
    </main>
  `,
})
export class E2eCalendarPage {
  readonly today = new Date(2024, 1, 15, 12);
  readonly min = new Date(2024, 1, 5, 12);
  readonly max = new Date(2024, 1, 25, 12);
  readonly locale = signal('en-US');
  readonly rtl = signal(false);
  readonly singleCommits = signal(0);
  readonly rangeCommits = signal(0);
  readonly formDate = new FormControl<Date | null>(null);
  readonly formRange = new FormControl<{ start: Date; end: Date | null } | null>(null);
  readonly disabledDate = (date: Date) => date.getDate() === 12 && date.getMonth() === 1;
  readonly customDayLabel = (date: Date) => `Chosen date ${date.getMonth() + 1}/${date.getDate()}`;
  dateText(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  }
}
