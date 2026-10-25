import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { fireEvent, render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import {
  CalendarCellDirective,
  CalendarDateButtonDirective,
  CalendarGridDirective,
  CalendarRowDirective,
  CalendarMonthLabelDirective,
  CalendarNextMonthDirective,
  CalendarPreviousMonthDirective,
} from './calendar-part.directive';
import { DatePickerDirective } from './date-picker.directive';
import { DateRangePickerDirective } from './date-range-picker.directive';

@Component({
  standalone: true,
  imports: [
    CommonModule,
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
  template: `
    <section
      qzDatePicker
      [(date)]="date"
      [today]="today"
      [firstDayOfWeek]="firstDay()"
      [dir]="direction()"
      [locale]="locale()"
      [min]="min"
      [dateDisabled]="blocked"
      (dateChangeCommitted)="commits.push($event)"
      #picker="qzDatePicker"
    >
      <h2 qzCalendarMonthLabel></h2>
      <button qzCalendarPreviousMonth>Previous</button><button qzCalendarNextMonth>Next</button>
      <div qzCalendarGrid>
        <div qzCalendarRow>
          <div role="columnheader" *ngFor="let weekday of picker.weekdays()">{{ weekday }}</div>
        </div>
        <div qzCalendarRow *ngFor="let week of picker.weeks()">
          <div [qzCalendarCell]="day" *ngFor="let day of week">
            <button [qzCalendarDateButton]="day" [locale]="locale()">{{ day.day }}</button>
          </div>
        </div>
      </div>
    </section>
    <section
      qzDateRangePicker
      [today]="today"
      [dateDisabled]="rangeDisabled"
      (rangeChangeCommitted)="ranges.push($event)"
      #range="qzDateRangePicker"
    >
      <h2 qzCalendarMonthLabel></h2>
      <div qzCalendarGrid>
        <div qzCalendarRow>
          <div role="columnheader" *ngFor="let weekday of range.weekdays()">{{ weekday }}</div>
        </div>
        <div qzCalendarRow *ngFor="let week of range.weeks()">
          <div [qzCalendarCell]="day" *ngFor="let day of week">
            <button [qzCalendarDateButton]="day">{{ day.day }}</button>
          </div>
        </div>
      </div>
    </section>
  `,
})
class CalendarHost {
  readonly date = signal<Date | null>(null);
  readonly today = new Date(2024, 1, 15, 12);
  readonly firstDay = signal(1);
  readonly direction = signal<'ltr' | 'rtl'>('ltr');
  readonly locale = signal('en-US');
  readonly min = new Date(2024, 1, 5, 12);
  readonly blocked = (date: Date) => date.getDate() === 12 && date.getMonth() === 1;
  readonly commits: Date[] = [];
  readonly ranges: { start: Date | null; end: Date | null }[] = [];
  readonly rangeBlocked = signal(false);
  readonly rangeDisabled = (date: Date) =>
    this.rangeBlocked() && date.getDate() === 12 && date.getMonth() === 1;
}

describe('DatePicker', () => {
  it('renders grid semantics, localized day labels, week starts, and controlled selection', async () => {
    const { fixture } = await render(CalendarHost);
    const host = fixture.componentInstance;
    const grid = screen.getAllByRole('grid')[0];
    expect(grid).toHaveAttribute('aria-label', 'February 2024');
    expect(grid.querySelectorAll('[role="gridcell"]')).toHaveLength(42);
    expect(grid.querySelector('[role="row"]')).toHaveTextContent('Mon');
    const februarySixth = grid.querySelectorAll('button')[8];
    expect(februarySixth).toHaveAttribute('aria-label', 'Tuesday, February 6, 2024');
    fireEvent.click(februarySixth);
    fixture.detectChanges();
    expect(host.date()?.getDate()).toBe(6);
    expect(host.date()?.getHours()).toBe(12);
    expect(host.commits).toHaveLength(1);
    host.date.set(new Date(2024, 1, 8, 23));
    fixture.detectChanges();
    expect(host.commits).toHaveLength(1);
    expect(grid.querySelector('[data-qz-selected]')).toBeTruthy();
  });

  it('moves focus without selecting and blocks commits for disabled or out-of-range dates', async () => {
    const { fixture } = await render(CalendarHost);
    const grid = screen.getAllByRole('grid')[0];
    const focused = grid.querySelector('[data-qz-focused]') as HTMLButtonElement;
    fireEvent.keyDown(focused, { key: 'ArrowRight' });
    fixture.detectChanges();
    expect(fixture.componentInstance.commits).toHaveLength(0);
    const blocked = grid.querySelectorAll('button')[14] as HTMLButtonElement;
    expect(blocked).toHaveAttribute('aria-disabled', 'true');
    fireEvent.click(blocked);
    expect(fixture.componentInstance.commits).toHaveLength(0);
    fireEvent.click(grid.querySelectorAll('button')[1] as HTMLButtonElement);
    expect(fixture.componentInstance.commits).toHaveLength(0);
  });

  it('normalizes a reversed range and publishes start-only as a valid partial value', async () => {
    const { fixture } = await render(CalendarHost);
    const host = fixture.componentInstance;
    const buttons = screen.getAllByRole('grid')[1].querySelectorAll('button');
    fireEvent.click(buttons[21]);
    fixture.detectChanges();
    expect(host.ranges[0].start?.getDate()).toBe(18);
    expect(host.ranges[0].end).toBeNull();
    fireEvent.click(screen.getAllByRole('grid')[1].querySelectorAll('button')[14]);
    expect(host.ranges[1].start?.getDate()).toBe(11);
    expect(host.ranges[1].end?.getDate()).toBe(18);
  });

  it('previews a partial range and rejects a completed span crossing a disabled date', async () => {
    const { fixture } = await render(CalendarHost);
    fixture.componentInstance.rangeBlocked.set(true);
    fixture.detectChanges();
    const grid = screen.getAllByRole('grid')[1];
    fireEvent.click(grid.querySelectorAll('button')[9]); // Feb 7.
    fixture.detectChanges();
    const target = screen.getAllByRole('grid')[1].querySelectorAll('button')[14]; // Feb 12 is disabled.
    fireEvent.pointerEnter(target);
    fixture.detectChanges();
    expect(screen.getAllByRole('grid')[1].querySelectorAll('button')[14]).toHaveAttribute(
      'data-qz-range-preview',
    );
    fireEvent.click(target);
    expect(fixture.componentInstance.ranges).toHaveLength(1);
    expect(fixture.componentInstance.ranges[0].end).toBeNull();
  });

  it('mirrors horizontal focus navigation in RTL without changing the selection', async () => {
    const { fixture } = await render(CalendarHost);
    const host = fixture.componentInstance;
    host.direction.set('rtl');
    fixture.detectChanges();
    const grid = screen.getAllByRole('grid')[0];
    const focused = grid.querySelector('[data-qz-focused]') as HTMLButtonElement;
    fireEvent.keyDown(focused, { key: 'ArrowRight' });
    fixture.detectChanges();
    expect(grid.querySelector('[data-qz-focused]')).toHaveAccessibleName(
      'Wednesday, February 14, 2024',
    );
    expect(host.date()).toBeNull();
    fireEvent.keyDown(grid.querySelector('[data-qz-focused]') as HTMLButtonElement, {
      key: 'Home',
    });
    fixture.detectChanges();
    expect(grid.querySelector('[data-qz-focused]')).toHaveAccessibleName(
      'Monday, February 12, 2024',
    );
  });
});
