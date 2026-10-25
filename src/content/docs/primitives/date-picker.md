---
title: DatePicker
description: 'A headless inline calendar for a single local civil date, with keyboard navigation, locale-aware names and Angular Forms support.'
group: Primitives
order: 122
---

## At a glance

- **Behavior** — a controlled date model and a reusable six week calendar grid; the consumer owns the input, popup and visual styling.
- **Value** — `Date | null`, normalized to local noon.
- **Constraints** — `min`, `max`, `dateDisabled`, `firstDayOfWeek`, `locale`, `disabled`.
- **Forms** — `DatePickerControlDirective` from `@quartz-headless/primitives/forms`.
- **CLI** — `pnpm quartz add date-picker`; this copies the shared calendar source family.

## Imports

```ts
import {
  DatePickerDirective,
  CalendarGridDirective,
  CalendarRowDirective,
  CalendarCellDirective,
  CalendarDateButtonDirective,
  CalendarMonthLabelDirective,
  CalendarPreviousMonthDirective,
  CalendarNextMonthDirective,
} from '@quartz-headless/primitives';
```

## Minimal inline calendar

```html
<div qzDatePicker [(date)]="date" #calendar="qzDatePicker">
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
      <div [qzCalendarCell]="day">
        <button [qzCalendarDateButton]="day" [locale]="'en-GB'">{{ day.day }}</button>
      </div>
      }
    </div>
    }
  </div>
</div>
```

The cell and button directives provide grid semantics, a localized full date name, one roving tab stop and `data-qz-*` state hooks. Focus navigation does not select a date. `dateChangeCommitted` fires once when the user commits a different selectable date; two-way model writes remain silent on that user-only output.

## Models and constraints

| Name                  | Kind                      | Meaning                                                          |
| --------------------- | ------------------------- | ---------------------------------------------------------------- |
| `date`                | `model<Date \| null>`     | Selected local civil date.                                       |
| `focusedDate`         | `model<Date \| null>`     | Logical active day; focus movement does not change `date`.       |
| `displayedMonth`      | `model<Date \| null>`     | Any date in the displayed month; normalized to its first day.    |
| `min` / `max`         | `input<Date \| null>`     | Inclusive day bounds.                                            |
| `dateDisabled`        | `(date: Date) => boolean` | Additional date-level disable rule.                              |
| `firstDayOfWeek`      | `0..6`                    | Weekday index, where Sunday is `0`; defaults to Sunday.          |
| `locale`              | BCP 47 string             | Used by `Intl.DateTimeFormat` for month and date labels.         |
| `today`               | `Date \| null` input      | Stable current-day override for SSR and deterministic rendering. |
| `disabled`            | boolean                   | Disables selection and month controls.                           |
| `dateChangeCommitted` | output `Date`             | User selection only; repeats of the current date are silent.     |

Arrow keys move by one day (mirrored in RTL); Up/Down move by a week; Home/End move to the configured week edges; PageUp/PageDown change month; Shift+PageUp/PageDown change year. Month arithmetic clamps at month end. Disabled dates remain reachable by keyboard but cannot be committed. The grid has six weeks so dates do not disappear as the month changes.

## Date and timezone contract

Quartz treats `Date` as a carrier for a local civil day. Values are read using local year/month/day and normalized to 12:00 local time. Equality, `min` and `max` ignore time-of-day. Calendar arithmetic uses numeric constructors and `setDate`, not locale parsing or ISO slicing. Noon avoids common midnight DST transitions; the package does not implement timezone scheduling.

Local civil dates depend on the runtime timezone. For SSR and hydration, configure the server and browser to the same timezone and pass a stable `[today]` value. A different timezone can map the same timestamp to a different local day. Locale formatting uses `Intl.DateTimeFormat` and falls back to English when a locale is unsupported; server and client must use compatible ICU locale data for identical text.

Invalid `Date` inputs normalize to `null`. The adapter boundary is internal and deliberately limited to native `Date`; no date library is required.

## Angular Forms

Import `DatePickerControlDirective` or `QUARTZ_FORMS` from `@quartz-headless/primitives/forms`. The value is `Date | null`; `reset()` writes `null`. Programmatic `writeValue` calls are silent. Each user date commit calls Forms once. Touched is reported when focus leaves the calendar root. Angular validators and required-date policy belong to the consumer.

```ts
import { DatePickerControlDirective } from '@quartz-headless/primitives/forms';
```

The live example below includes both the single-date and range Forms adapters, including reset and
disabled state.

::demo[date-forms]

## Composition and styling

This primitive renders no input or popup. Use it inline, place it inside Quartz Popover for a non-modal popup, or inside Dialog when modal focus management is appropriate. The consumer supplies the trigger, open/close policy and focus return behavior.

Structural hooks include `data-qz-today`, `data-qz-selected`, `data-qz-disabled`, `data-qz-focused` and `data-qz-outside-month`. Calendar cells also expose `data-qz-range-*` for shared styling with DateRangePicker. Quartz provides no colors, borders or shadows.

Date buttons use a localized full-date accessible name by default. Bind `[dateLabel]` on an
individual button to supply a callback `(date, locale) => string` when your application needs extra
context such as event counts or a custom calendar vocabulary.

## Known limitations

- Only local civil dates are supported; arbitrary timezone selection and non-Gregorian calendar arithmetic are not.
- Month grids contain six weeks (42 cells), including outside-month dates.
- Disabled days are focusable but not selectable.
- The package does not include a date input, dialog or popup wrapper.

## Playground

::playground[quartz-date-picker]

## Live example

::demo[date-picker]

Related: [DateRangePicker](/docs/primitives/date-range-picker), [Popover](/docs/primitives/popover), [Dialog](/docs/primitives/dialog).
