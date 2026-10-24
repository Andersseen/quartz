---
title: Toggle
description: 'A button-based pressed/unpressed toggle with aria-pressed, a user-only committed output and an Angular Forms adapter.'
group: Primitives
order: 114
---

## At a glance

- **API** — `button[qzToggle]` with `[(pressed)]`, `disabled`, `pressedChangeCommitted`
- **Keyboard** — Native button: Enter and Space
- **Forms** — `ToggleControlDirective`, value `boolean`
- **CLI** — pnpm quartz add toggle

## Imports

```ts
import { ToggleDirective } from '@quartz-headless/primitives';
import { ToggleControlDirective } from '@quartz-headless/primitives/forms'; // optional
```

## Minimal template

```html
<button qzToggle [(pressed)]="bold" (pressedChangeCommitted)="saved($event)">Bold</button>
```

## Contract

| Name                     | Notes                                                                             |
| ------------------------ | --------------------------------------------------------------------------------- |
| `pressed`                | `model<boolean>`. Programmatic writes are silent.                                 |
| `disabled`               | Also set by a disabled Forms control; sets native `disabled` and `aria-disabled`. |
| `pressedChangeCommitted` | Emits the new value **once per user activation** (click, Enter or Space).         |

Button-first: the host is `button[qzToggle]`, so focus, Enter/Space activation and `disabled` are native; `type="button"` is set, so it never submits a form. Activation does not toggle twice, and a disabled toggle emits nothing. The accessible name is the button's own content or `aria-label`; Quartz adds only `aria-pressed`.

## Angular Forms

`ToggleControlDirective` — value `boolean`; `null` / `undefined` (e.g. `reset()`) write `false`, exactly like the Switch adapter. `writeValue` is silent, `onChange` fires once per activation, touched fires on blur, `setDisabledState` disables the button.

## Styling hooks

`data-qz-state="on|off"`, `data-qz-disabled`, `aria-pressed`.

## Known limitations

Buttons only (a `div` host is a compile error by design). Use [Switch](/docs/primitives/switch) for an immediate on/off setting with `role="switch"`.

## Migration from 0.10

Additive: `isDisabled`, `setFormDisabled()` and the Forms adapter. Selector, model and output are unchanged.

## Playground

::playground[quartz-toggle]

## Live examples

::demo[toggle]
