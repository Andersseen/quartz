import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import {
  CalendarCellDirective,
  CalendarDateButtonDirective,
  CalendarGridDirective,
  CalendarMonthLabelDirective,
  CalendarNextMonthDirective,
  CalendarPreviousMonthDirective,
  CalendarRowDirective,
  DatePickerDirective,
  DateRangePickerDirective,
} from '@quartz-headless/primitives';
import { QUARTZ_FORMS } from '@quartz-headless/primitives/forms';

@Component({
  selector: 'app-date-forms-demo',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ...QUARTZ_FORMS,
    DatePickerDirective,
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
  templateUrl: './date-forms.demo.html',
})
export class DateFormsDemoComponent {
  readonly form = new FormGroup({
    date: new FormControl<Date | null>(new Date(2024, 1, 20, 12)),
    range: new FormControl<{ start: Date; end: Date | null } | null>(null),
  });
  readonly today = new Date(2024, 1, 15, 12);
  readonly weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
}
