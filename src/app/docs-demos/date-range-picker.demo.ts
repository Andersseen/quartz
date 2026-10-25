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
  DateRangePickerDirective,
} from '@quartz-headless/primitives';

@Component({
  selector: 'app-date-range-picker-demo',
  imports: [
    CommonModule,
    DateRangePickerDirective,
    CalendarGridDirective,
    CalendarRowDirective,
    CalendarCellDirective,
    CalendarDateButtonDirective,
    CalendarMonthLabelDirective,
    CalendarPreviousMonthDirective,
    CalendarNextMonthDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './date-range-picker.demo.html',
})
export class DateRangePickerDemoComponent {
  readonly today = new Date(2024, 1, 15, 12);
  readonly startDate = signal<Date | null>(null);
  readonly endDate = signal<Date | null>(null);
  readonly disabledDay = (date: Date) => date.getDate() === 12 && date.getMonth() === 1;
}
