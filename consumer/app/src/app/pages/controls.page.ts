import { Component, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
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
  ListboxDirective,
  ListboxOptionDirective,
  PaginationDirective,
  PaginationFirstDirective,
  PaginationLastDirective,
  PaginationNextDirective,
  PaginationPageDirective,
  PaginationPreviousDirective,
  RangeSliderDirective,
  RangeSliderRangeDirective,
  type RangeSliderValue,
  RangeSliderThumbDirective,
  RangeSliderTrackDirective,
  SliderDirective,
  SliderThumbDirective,
  SliderTrackDirective,
  ToggleDirective,
  ToggleGroupDirective,
  ToggleItemDirective,
  ToolbarDirective,
  ToolbarItemDirective,
  type DateRange,
} from '@quartz-headless/primitives';
import { QUARTZ_FORMS } from '@quartz-headless/primitives/forms';

@Component({
  selector: 'app-controls-page',
  imports: [
    ReactiveFormsModule,
    CalendarCellDirective,
    CalendarDateButtonDirective,
    CalendarGridDirective,
    CalendarMonthLabelDirective,
    CalendarNextMonthDirective,
    CalendarPreviousMonthDirective,
    CalendarRowDirective,
    DatePickerDirective,
    DateRangePickerDirective,
    ListboxDirective,
    ListboxOptionDirective,
    PaginationDirective,
    PaginationFirstDirective,
    PaginationLastDirective,
    PaginationNextDirective,
    PaginationPageDirective,
    PaginationPreviousDirective,
    RangeSliderDirective,
    RangeSliderRangeDirective,
    RangeSliderThumbDirective,
    RangeSliderTrackDirective,
    SliderDirective,
    SliderThumbDirective,
    SliderTrackDirective,
    ToggleDirective,
    ToggleGroupDirective,
    ToggleItemDirective,
    ToolbarDirective,
    ToolbarItemDirective,
    ...QUARTZ_FORMS,
  ],
  template: `
    <h1>Controls</h1>
    <form [formGroup]="form">
      <section aria-labelledby="sl-h">
        <h2 id="sl-h">Sliders</h2>
        <div qzSlider formControlName="volume" [min]="0" [max]="10" [step]="1" data-testid="slider">
          <div qzSliderTrack><button qzSliderThumb aria-label="Volume"></button></div>
        </div>
        <output data-testid="slider-value">{{ volume() }}</output>
        <div
          qzRangeSlider
          formControlName="price"
          [min]="0"
          [max]="500"
          [minDistance]="10"
          data-testid="range"
        >
          <div qzRangeSliderTrack>
            <div qzRangeSliderRange></div>
            <button qzRangeSliderThumb="low" aria-label="Minimum price"></button>
            <button qzRangeSliderThumb="high" aria-label="Maximum price"></button>
          </div>
        </div>
        <output data-testid="range-value">{{ price()?.low }}-{{ price()?.high }}</output>
      </section>

      <section aria-labelledby="tg-h">
        <h2 id="tg-h">Toggles</h2>
        <button qzToggle formControlName="bold" data-testid="toggle">Bold</button>
        <output data-testid="toggle-value">{{ bold() }}</output>
        <div
          qzToggleGroup
          formControlName="align"
          [allowDeselection]="false"
          aria-label="Alignment"
          data-testid="tgroup"
        >
          <button qzToggleItem="left">Left</button>
          <button qzToggleItem="center">Center</button>
          <button qzToggleItem="right">Right</button>
        </div>
        <output data-testid="tgroup-value">{{ align() }}</output>
      </section>

      <section aria-labelledby="dp-h">
        <h2 id="dp-h">Dates</h2>
        <section
          qzDatePicker
          [today]="today"
          formControlName="date"
          #single="qzDatePicker"
          data-testid="datepicker"
        >
          <h3 qzCalendarMonthLabel></h3>
          <button qzCalendarPreviousMonth>Previous month</button>
          <button qzCalendarNextMonth>Next month</button>
          <div qzCalendarGrid aria-label="Choose a date">
            <div qzCalendarRow>
              @for (weekday of single.weekdays(); track $index) {
                <div role="columnheader">{{ weekday }}</div>
              }
            </div>
            @for (week of single.weeks(); track $index) {
              <div qzCalendarRow>
                @for (day of week; track day.date.getTime()) {
                  <div [qzCalendarCell]="day">
                    <button [qzCalendarDateButton]="day">{{ day.day }}</button>
                  </div>
                }
              </div>
            }
          </div>
        </section>
        <output data-testid="date-value">{{ dateText() }}</output>

        <section
          qzDateRangePicker
          [today]="today"
          formControlName="range"
          #range="qzDateRangePicker"
          data-testid="rangepicker"
        >
          <h3 qzCalendarMonthLabel></h3>
          <div qzCalendarGrid aria-label="Choose a range">
            @for (week of range.weeks(); track $index) {
              <div qzCalendarRow>
                @for (day of week; track day.date.getTime()) {
                  <div [qzCalendarCell]="day">
                    <button [qzCalendarDateButton]="day">{{ day.day }}</button>
                  </div>
                }
              </div>
            }
          </div>
        </section>
        <output data-testid="range-date-value">{{ rangeText() }}</output>
      </section>
    </form>

    <section aria-labelledby="lb-h">
      <h2 id="lb-h">Listbox, pagination, toolbar</h2>
      <div qzListbox aria-label="Sections" [(value)]="section" data-testid="listbox">
        <div qzListboxOption="a">Alpha</div>
        <div qzListboxOption="b">Beta</div>
        <div qzListboxOption="c">Gamma</div>
      </div>
      <output data-testid="listbox-value">{{ section() }}</output>

      <nav
        qzPagination
        aria-label="Results"
        [(page)]="page"
        [pageCount]="5"
        data-testid="pagination"
      >
        <button qzPaginationFirst>First</button>
        <button qzPaginationPrevious>Previous</button>
        <button [qzPaginationPage]="1">1</button>
        <button [qzPaginationPage]="2">2</button>
        <button [qzPaginationPage]="3">3</button>
        <button qzPaginationNext>Next</button>
        <button qzPaginationLast>Last</button>
      </nav>
      <output data-testid="page-value">{{ page() }}</output>

      <div qzToolbar aria-label="Formatting" orientation="horizontal" data-testid="toolbar">
        <button qzToolbarItem>Cut</button>
        <button qzToolbarItem>Copy</button>
        <button qzToolbarItem [qzToolbarItemDisabled]="true">Paste</button>
        <button qzToolbarItem>Undo</button>
      </div>
    </section>
  `,
})
export class ControlsPage {
  readonly today = new Date(2026, 5, 15, 12);
  readonly form = new FormGroup({
    volume: new FormControl<number | null>(3),
    price: new FormControl<RangeSliderValue | null>({ low: 100, high: 300 }),
    bold: new FormControl(false),
    align: new FormControl<string | null>('left'),
    date: new FormControl<Date | null>(null),
    range: new FormControl<DateRange | null>({ start: null, end: null }),
  });
  readonly volume = toSignal(this.form.controls.volume.valueChanges, { initialValue: 3 });
  readonly price = toSignal(this.form.controls.price.valueChanges, {
    initialValue: { low: 100, high: 300 } as RangeSliderValue | null,
  });
  readonly bold = toSignal(this.form.controls.bold.valueChanges, { initialValue: false });
  readonly align = toSignal(this.form.controls.align.valueChanges, { initialValue: 'left' });
  readonly dateValue = toSignal(this.form.controls.date.valueChanges, {
    initialValue: null as Date | null,
  });
  readonly rangeValue = toSignal(this.form.controls.range.valueChanges, {
    initialValue: { start: null, end: null } as DateRange | null,
  });
  readonly section = signal<string | string[] | null>(null);
  readonly page = signal(1);

  dateText(): string {
    return this.dateValue() ? this.fmt(this.dateValue() as Date) : 'none';
  }

  rangeText(): string {
    const r = this.rangeValue();
    return r?.start ? `${this.fmt(r.start)}..${r.end ? this.fmt(r.end) : '?'}` : 'none';
  }

  private fmt(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
}
