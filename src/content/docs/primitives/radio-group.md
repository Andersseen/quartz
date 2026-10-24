---
title: RadioGroup
description: 'A standalone radio group with Collection-powered registration, roving focus, disabled skipping, orientation and RTL.'
group: Primitives
order: 113
---

## At a glance

- **API** — qzRadioGroup with [(value)], compareWith and qzRadio items
- **Keyboard** — Arrows move focus and selection; Home/End jump
- **ARIA** — radiogroup, radio, aria-checked, aria-disabled
- **CLI** — pnpm quartz add radio-group

## Playground

::playground[quartz-radio-group]

## Live examples

::demo[radio-group]

## Code

### Vertical, horizontal, disabled and RTL

```ts
plan = signal('pro');

<div qzRadioGroup [(value)]="plan">
  <button qzRadio="free">Free</button>
  <button qzRadio="pro">Pro</button>
  <button qzRadio="team">Team</button>
</div>
```

### Angular Forms

```ts
import { RadioGroupDirective, RadioDirective } from '@quartz-headless/primitives';
import { RadioGroupControlDirective } from '@quartz-headless/primitives/forms';

@Component({
  imports: [ReactiveFormsModule, RadioGroupDirective, RadioDirective, RadioGroupControlDirective],
  template: ` <div qzRadioGroup formControlName="plan" aria-label="Plan">
    <button qzRadio="free">Free</button>
    <button qzRadio="pro">Pro</button>
  </div>`,
})
class Plan {}
```
