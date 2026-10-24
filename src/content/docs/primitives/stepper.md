---
title: Stepper
description: 'Sequential flow primitive with controlled value, linear navigation, completed/disabled state, orientation and RTL-aware keyboard focus.'
group: Primitives
order: 120
---

## At a glance

- **Controlled** — Active step is a value model, not an index
- **Linear** — Consumers supply completed state; Quartz enforces navigation
- **ARIA** — Buttons, aria-current=step and panel relationships
- **CLI** — pnpm quartz add stepper

## Live examples

::demo[stepper]

## Code

### Linear setup flow

```html
<div qzStepper [(value)]="step" linear>
  <button qzStep="account" [qzStepCompleted]="accountValid()" qzStepTrigger>Account</button>
  <button qzStep="profile" qzStepTrigger>Profile</button>

  <section qzStepPanel="account">...</section>
  <section qzStepPanel="profile">...</section>

  <button qzStepperPrevious>Previous</button>
  <button qzStepperNext>Next</button>
</div>
```
