---
title: Quick start
description: A working accessible Select in a few lines, then where to go next.
group: Getting started
order: 2
---

Quartz gives you behaviour, ARIA and keyboard handling; you provide every pixel. This example builds a Select with plain CSS hooks.

```ts
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  SelectContentDirective,
  SelectDirective,
  SelectListboxDirective,
  SelectOptionDirective,
  SelectTriggerDirective,
} from '@quartz-headless/primitives';

@Component({
  selector: 'app-country-select',
  imports: [
    SelectDirective,
    SelectTriggerDirective,
    SelectContentDirective,
    SelectListboxDirective,
    SelectOptionDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div qzSelect #select="qzSelect" [(value)]="country">
      <button qzSelectTrigger class="trigger">
        {{ select.selectedLabel() || 'Choose a country' }}
      </button>
      <ng-template qzSelectContent>
        <div qzSelectListbox class="panel">
          <button qzSelectOption="es" class="option">Spain</button>
          <button qzSelectOption="fr" class="option">France</button>
        </div>
      </ng-template>
    </div>
  `,
})
export class CountrySelect {
  readonly country = signal<string | null>(null);
}
```

```css
.option[data-qz-highlighted] {
  background: #eef;
}
.option[data-qz-selected] {
  font-weight: 600;
}
.trigger[data-qz-open] {
  outline: 2px solid currentColor;
}
```

What you got without writing it: `aria-haspopup`/`aria-expanded`/`aria-controls` on the trigger, a `role="listbox"` popup named after the trigger, arrow/Home/End/type-ahead navigation, Escape and outside-click dismissal, focus restoration, and overlay positioning that flips at viewport edges.

## Live example

::demo[select]

## Where next

- Choose the layer: [Core versus Primitives](/docs/guides/core-vs-primitives)
- Control state with signals: [Signals and controlled state](/docs/guides/signals-and-controlled-state)
- Use Angular Forms: [Angular Forms adapters](/docs/guides/angular-forms)
- Browse [Primitives](/docs/primitives/select) and [Core](/docs/core/overlay)
