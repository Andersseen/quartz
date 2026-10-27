---
title: FormField
description: 'Compose native and Quartz controls with stable labels, descriptions, errors and optional Angular Forms state.'
group: Primitives
order: 180
---

## At a glance

FormField connects labels, hints, validation messages and a control. It does not own validation policy or add visual styles. Use a stable unique `id` on each field root; generated IDs are deliberately avoided so server and browser markup agree.

## Installation and imports

Install `@quartz-headless/primitives`. Structural directives come from the base entry point. Add `FormFieldStateDirective` from `@quartz-headless/primitives/forms` only when the control uses Angular Forms.

```ts
import {
  FormFieldDirective,
  FormFieldControlDirective,
  FormFieldLabelDirective,
  FormFieldDescriptionDirective,
  FormFieldErrorDirective,
} from '@quartz-headless/primitives';
import { FormFieldStateDirective } from '@quartz-headless/primitives/forms';
```

## Live demo

::demo[controls-text-files]

## Accessible native input

```html
<div qzFormField id="account-email" [invalid]="showEmailError()">
  <label qzFormFieldLabel for="account-email-control">Email</label>
  <p qzFormFieldDescription id="account-email-hint">Use your work address.</p>
  @if (showEmailError()) {
  <p qzFormFieldError id="account-email-error">Enter a valid email address.</p>
  }
  <input qzFormFieldControl id="account-email-control" type="email" />
</div>
```

The control receives `aria-labelledby`, `aria-describedby` and `aria-invalid` from the projected parts. Give every description and error a distinct, stable `id`; a native `<label>` keeps its normal `for` association. For button-like Quartz controls, use a non-label element with `qzFormFieldLabel` and let `aria-labelledby` name the control.

## Angular Forms state

Import `FormFieldStateDirective` next to the control's native or Quartz Forms directive. The observer follows Angular control events for invalid, touched, dirty, disabled and pending state. Structural composition alone does not mark fields invalid or decide when to show errors.

The root and control expose `data-invalid` and `data-disabled`; the root also exposes `data-touched`, `data-dirty` and `data-pending` when active. Consumer CSS owns presentation.

`FormFieldDirective` accepts `id` (required), `invalid`, `touched`, `dirty`, `disabled` and `required`. `FormFieldControlDirective` accepts an optional control `id`; the label resolves to `<root-id>-label` unless its `id` is supplied. Descriptions and errors require explicit IDs. The structural directives have no outputs. A disabled field state adds `aria-disabled` to its control and the native `disabled` attribute; validation visibility remains consumer-owned. Native labels preserve click/focus behavior. Button-like Quartz controls use a span or other non-label element for their field label.

## SSR and limitations

Each field root `id` must be unique in the rendered application and stable between server and client. Hint and error IDs are explicit so conditional content cannot leave generated or cross-request references. Dynamic projected parts update the description list.

## API reference and Volt differences

- [`FormFieldDirective`](/docs/reference/api/primitives/form-field-directive)
- [`FormFieldControlDirective`](/docs/reference/api/primitives/form-field-control-directive)
- [`FormFieldLabelDirective`](/docs/reference/api/primitives/form-field-label-directive)
- [`FormFieldDescriptionDirective`](/docs/reference/api/primitives/form-field-description-directive)
- [`FormFieldErrorDirective`](/docs/reference/api/primitives/form-field-error-directive)
- [`FormFieldStateDirective`](/docs/reference/api/forms/form-field-state-directive)

Quartz uses attribute directives on consumer-owned markup, explicit stable IDs, and a separate optional Forms observer. It does not reproduce Volt's visual component API.
