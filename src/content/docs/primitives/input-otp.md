---
title: InputOTP
description: 'A headless one-time-code input with one focusable text field and presentational slots.'
group: Primitives
order: 181
---

## At a glance

InputOTP is a UI control for entering a short code. It is not an authentication or verification service. It keeps one real text input and exposes slots as styling hooks.

## Install and import

```ts
import { InputOtpComponent } from '@quartz-headless/primitives';
import { InputOtpControlDirective } from '@quartz-headless/primitives/forms';
```

## Playground

::playground[quartz-input-otp]

## Live demo

::demo[controls-text-files]

## Minimal example

```html
<qz-input-otp
  [length]="6"
  [pattern]="digits"
  ariaLabel="Verification code"
  [(value)]="code"
  (completed)="onCodeEntered($event)"
/>
```

```ts
code = signal('');
digits = /^\d$/;
```

Use `InputOtpControlDirective` with `formControl`, `formControlName` or `ngModel` for Angular Forms. Forms writes are silent; reset maps null to an empty string; user changes update the form once; focus leaving the component marks it touched.

## Inputs, outputs and state

`length` defaults to 6, `pattern` defaults to ASCII digits, `inputMode` defaults to `numeric`, and `disabled`, `readonly`, `ariaLabel` and `labelledBy` configure the real input. `value` is the canonical string model; an external value is silently truncated to the configured slot count, including when length is reduced. `valueChangeCommitted` reports user changes and `completed` emits once for each newly completed value.

The input uses `autocomplete="one-time-code"`. Slot spans expose `data-index`, `data-active` and `data-filled`; the host exposes `data-disabled`, `data-readonly` and `data-complete`. The input handles native typing, selection replacement, paste, delete and keyboard caret movement. Filtering waits until IME composition ends.

There is no built-in visual styling. The real input stays keyboard-operable and accessible; slots are presentational and hidden from assistive technology.

## API reference and Volt differences

- [`InputOtpComponent`](/docs/reference/api/primitives/input-otp-component)
- [`InputOtpControlDirective`](/docs/reference/api/forms/input-otp-control-directive)

Quartz exposes one Angular component with a string model and presentational slot spans; it does not mirror Volt's slot component API. The UI does not verify codes or provide an authentication backend. Behavior uses the browser's native text input and clipboard events.
