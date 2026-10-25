import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
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
} from '@quartz-headless/primitives';

@Component({
  selector: 'app-date-picker-demo',
  imports: [
    CommonModule,
    DatePickerDirective,
    CalendarGridDirective,
    CalendarRowDirective,
    CalendarCellDirective,
    CalendarDateButtonDirective,
    CalendarMonthLabelDirective,
    CalendarPreviousMonthDirective,
    CalendarNextMonthDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './date-picker.demo.html',
})
export class DatePickerDemoComponent {
  readonly today = new Date(2024, 1, 15, 12);
  readonly date = signal<Date | null>(new Date(2024, 1, 20, 12));
  readonly disabledWeekend = (date: Date) => date.getDay() === 0 || date.getDay() === 6;
  readonly showLocale = signal<'en-US' | 'fr-FR'>('en-US');
}
