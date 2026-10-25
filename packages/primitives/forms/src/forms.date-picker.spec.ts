import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { fireEvent, render, screen, within } from '@testing-library/angular';
import {
  DatePickerDirective,
  DateRangePickerDirective,
  CalendarCellDirective,
  CalendarDateButtonDirective,
  CalendarGridDirective,
  CalendarRowDirective,
} from '@quartz-headless/primitives';
import { describe, expect, it } from 'vitest';
import { DatePickerControlDirective } from './date-picker-control.directive';
import { DateRangePickerControlDirective } from './date-range-picker-control.directive';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    DatePickerDirective,
    DateRangePickerDirective,
    CalendarGridDirective,
    CalendarRowDirective,
    CalendarCellDirective,
    CalendarDateButtonDirective,
    DatePickerControlDirective,
    DateRangePickerControlDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form">
      <section
        qzDatePicker
        formControlName="date"
        [today]="today"
        (dateChangeCommitted)="commitSingle()"
        #single="qzDatePicker"
      >
        <div qzCalendarGrid>
          <div qzCalendarRow *ngFor="let week of single.weeks()">
            <div [qzCalendarCell]="day" *ngFor="let day of week">
              <button [qzCalendarDateButton]="day">{{ day.day }}</button>
            </div>
          </div>
        </div>
      </section>
      <section
        qzDateRangePicker
        formControlName="range"
        [today]="today"
        (rangeChangeCommitted)="commitRange()"
        #range="qzDateRangePicker"
      >
        <div qzCalendarGrid>
          <div qzCalendarRow *ngFor="let week of range.weeks()">
            <div [qzCalendarCell]="day" *ngFor="let day of week">
              <button [qzCalendarDateButton]="day">{{ day.day }}</button>
            </div>
          </div>
        </div>
      </section>
    </form>
  `,
})
class FormsDateHost {
  readonly today = new Date(2024, 1, 15, 12);
  readonly form = new FormGroup({
    date: new FormControl<Date | null>(null),
    range: new FormControl<{ start: Date | null; end: Date | null } | null>(null),
  });
  singleCommits = 0;
  rangeCommits = 0;
  commitSingle(): void {
    this.singleCommits += 1;
  }
  commitRange(): void {
    this.rangeCommits += 1;
  }
}

describe('DatePicker Forms adapters', () => {
  it('writes single dates silently, commits one user change, resets and blocks disabled interaction', async () => {
    const { fixture } = await render(FormsDateHost);
    const host = fixture.componentInstance;
    const date = host.form.controls.date;
    const dateGrid = screen.getAllByRole('grid')[0];
    date.setValue(new Date(2024, 1, 7, 23));
    fixture.detectChanges();
    expect(
      within(dateGrid).getByRole('button', { name: 'Wednesday, February 7, 2024' }),
    ).toHaveAttribute('data-qz-selected');
    expect(host.singleCommits).toBe(0);
    fireEvent.click(within(dateGrid).getByRole('button', { name: 'Thursday, February 8, 2024' }));
    expect(date.value?.getDate()).toBe(8);
    expect(date.value?.getHours()).toBe(12);
    expect(host.singleCommits).toBe(1);
    date.reset();
    fixture.detectChanges();
    expect(date.value).toBeNull();
    expect(host.singleCommits).toBe(1);
    date.disable();
    fixture.detectChanges();
    fireEvent.click(within(dateGrid).getByRole('button', { name: 'Friday, February 9, 2024' }));
    expect(host.singleCommits).toBe(1);
  });

  it('writes and commits partial then complete range values, and reset stays silent', async () => {
    const { fixture } = await render(FormsDateHost);
    const host = fixture.componentInstance;
    const range = host.form.controls.range;
    let rangeGrid = screen.getAllByRole('grid')[1];
    const first = within(rangeGrid).getByRole('button', { name: 'Saturday, February 10, 2024' });
    fireEvent.click(first);
    expect(range.value?.start?.getDate()).toBe(10);
    expect(range.value?.end).toBeNull();
    expect(host.rangeCommits).toBe(1);
    fixture.detectChanges();
    rangeGrid = screen.getAllByRole('grid')[1];
    fireEvent.click(within(rangeGrid).getByRole('button', { name: 'Sunday, February 11, 2024' }));
    expect(range.value?.start?.getDate()).toBe(10);
    expect(range.value?.end?.getDate()).toBe(11);
    expect(host.rangeCommits).toBe(2);
    range.setValue({ start: new Date(2024, 1, 18, 5), end: new Date(2024, 1, 16, 8) });
    fixture.detectChanges();
    expect(range.value?.start?.getDate()).toBe(18); // Angular's model stays caller-owned.
    expect(host.rangeCommits).toBe(2);
    range.reset();
    fixture.detectChanges();
    expect(range.value).toBeNull();
    expect(host.rangeCommits).toBe(2);
  });
});
