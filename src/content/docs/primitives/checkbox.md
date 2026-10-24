---
title: Checkbox
description: 'A headless ARIA checkbox for button-based boolean or mixed state. It owns semantics and state hooks, never checkmarks or visuals.'
group: Primitives
order: 112
---

## At a glance

- **API** — qzCheckbox with [(checked)] boolean | indeterminate
- **Keyboard** — Space via native button activation
- **ARIA** — role checkbox and aria-checked false/true/mixed
- **CLI** — pnpm quartz add checkbox

## Playground

::playground[quartz-checkbox]

## Live examples

::demo[checkbox]

## Code

### Basic and disabled

```ts
accepted = signal(false);

<button qzCheckbox [(checked)]="accepted">
  Accept terms
</button>
```

### Indeterminate

```ts
state = signal<boolean | 'indeterminate'>('indeterminate');

<button qzCheckbox [(checked)]="state">
  Select all
</button>
```

### Angular Forms

```ts
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { CheckboxDirective } from '@quartz-headless/primitives';
import { CheckboxControlDirective } from '@quartz-headless/primitives/forms';

@Component({
  imports: [ReactiveFormsModule, CheckboxDirective, CheckboxControlDirective],
  template: `<button qzCheckbox [formControl]="terms">Accept terms</button>`,
})
class Terms {
  terms = new FormControl(false, { nonNullable: true, validators: Validators.requiredTrue });
}
```
