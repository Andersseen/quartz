---
title: Autofill
description: 'Best-effort browser autofill transition detection for native text inputs.'
group: Primitives
order: 182
---

## At a glance

`AutofillDirective` observes supported autofill CSS animation transitions on native `input` and `textarea` elements. It does not replace native input behavior or promise universal browser detection. Genuine browser autofill has been verified in Chrome only (see the compatibility guide); Firefox and Safari are unverified.

## Install and import

```ts
import { AutofillDirective } from '@quartz-headless/primitives';
```

## Live demo

::demo[controls-text-files]

## Minimal example

```html
<input qzAutofill aria-label="Email" (autofilledChange)="isAutofilled.set($event)" />
```

The directive emits `autofilledChange` with `true` or `false` and exposes `data-autofilled` while detected. Configure the matching CSS animation names in application styles:

```css
@keyframes qz-autofill-start {
  from {
    opacity: 1;
  }
  to {
    opacity: 1;
  }
}
@keyframes qz-autofill-cancel {
  from {
    opacity: 1;
  }
  to {
    opacity: 1;
  }
}
input:-webkit-autofill,
textarea:-webkit-autofill {
  animation: qz-autofill-start 1ms;
}
input:not(:-webkit-autofill),
textarea:not(:-webkit-autofill) {
  animation: qz-autofill-cancel 1ms;
}
```

Defaults are `qz-autofill-start` and `qz-autofill-cancel`; override with `startAnimationName` and `cancelAnimationName` if the application uses different names. Browser engines expose different autofill selectors and animation behavior. Treat this signal as a styling hint, not as a reliable value-change channel; keep Angular Forms observation tied to the native control.

The directive has no initialization-time DOM work, so SSR is a no-op. Browser animation event delivery and CSS pseudo-class support vary across Chromium, Firefox and WebKit.

Inputs are `startAnimationName` and `cancelAnimationName`; the `autofilledChange` output emits only detected state changes. The directive adds `data-autofilled` while active. It has no separate disabled state: native `disabled` and `readonly` continue to control input interaction. Keyboard behavior and focus remain native. This directive does not alter labels, descriptions or ARIA; name the native field as usual.

## API reference and Volt differences

- [`AutofillDirective`](/docs/reference/api/primitives/autofill-directive)

Quartz requires consumer CSS to assign the configured animation names and deliberately reports only detected transitions. Normal input and Angular programmatic writes do not emit autofill state. On a detected start, if the browser changed the input value without an `input` event, the directive dispatches one bubbling `input` event so native Angular Forms can observe it. CSS pseudo-class/animation support differs across engines; this technique is not universal.
