---
title: DateRangePicker
description: 'A headless inline calendar for local civil date ranges, including partial selection, preview, RTL keyboard behavior and Angular Forms.'
group: Primitives
order: 123
---

## At a glance

- **Value** — `{ start: Date | null; end: Date | null }`.
- **Models** — `[(startDate)]` and `[(endDate)]`; canonical range also exposed as `range()`.
- **Selection** — first commit chooses a start; next commit completes an ordered range. A new first choice clears the old end.
- **Preview** — pointer movement previews the end of an incomplete range.
- **Forms** — `DateRangePickerControlDirective` from `@quartz-headless/primitives/forms`.
- **CLI** — `pnpm quartz add date-range-picker`; shared calendar files are included.

## Usage

Use the same calendar parts as [DatePicker](/docs/primitives/date-picker), replacing its root directive:

```html
<div qzDateRangePicker [(startDate)]="start" [(endDate)]="end" #calendar="qzDateRangePicker">
  <button qzCalendarPreviousMonth>Previous month</button>
  <h2 qzCalendarMonthLabel></h2>
  <button qzCalendarNextMonth>Next month</button>
  <div qzCalendarGrid>
    <div qzCalendarRow>
      @for (weekday of calendar.weekdays(); track $index) {
      <div role="columnheader">{{ weekday }}</div>
      }
    </div>
    @for (week of calendar.weeks(); track $index) {
    <div qzCalendarRow>
      @for (day of week; track day.date.getTime()) {
      <div [qzCalendarCell]="day"><button [qzCalendarDateButton]="day">{{ day.day }}</button></div>
      }
    </div>
    }
  </div>
</div>
```

The `rangeChangeCommitted` output fires once for each user choice. A start-only value is `{ start: chosenDate, end: null }`; consumers decide whether an incomplete range is valid for submission. Selecting an earlier end normalizes the endpoints into chronological order. Selecting the same start and end produces a one-day range.

## Constraints and preview

`min`, `max`, `dateDisabled`, `firstDayOfWeek`, `locale`, `today` and `disabled` have the same meaning as on DatePicker. A disabled endpoint cannot be chosen. If a proposed range crosses any disabled date or falls outside the inclusive `min`/`max` bounds, the completion is rejected and the start-only state remains. This prevents the control from implying that blocked days are part of a valid selectable span.

When the user has chosen a start and not an end, pointer movement previews a possible range. `data-qz-range-preview` is styling state only and does not alter the model or produce live announcements. Keyboard users can move focus and commit an end with Enter or Space.

`clear()` resets both endpoints and emits `{ start: null, end: null }`. Programmatic model writes are silent on `rangeChangeCommitted`.

## Forms

The Forms value is always `{ start: Date | null; end: Date | null }`. An incomplete range remains `{ start: date, end: null }`; `reset()` writes `{ start: null, end: null }`. `writeValue` is silent, and each user choice notifies Forms once. Touched fires when focus leaves the calendar root. Completeness validation belongs to the consumer.

## Date, accessibility and composition

The local civil date and timezone contract is the same as [DatePicker](/docs/primitives/date-picker#date-and-timezone-contract). Cells expose `data-qz-range-start`, `data-qz-range-end`, `data-qz-in-range` and `data-qz-range-preview`, plus selected, today, outside-month, focused and disabled state. The range phase is available as `isSelectingEnd()`.

This is an inline calendar behavior primitive, not a date input or popup. It can be composed inside Popover or Dialog; the consumer owns trigger semantics and popup focus management.

## Known limitations

- Local civil dates only; no arbitrary timezone or alternate calendar arithmetic.
- The grid always renders 42 days.
- Invalid spans are rejected as a whole when they cross a disabled date.

## Playground

::playground[quartz-date-range-picker]

## Live example

::demo[date-range-picker]

Related: [DatePicker](/docs/primitives/date-picker), [Popover](/docs/primitives/popover), [Dialog](/docs/primitives/dialog).
