---
title: ToggleGroup
description: 'A group of toggle buttons with single or multiple selection, explicit allowDeselection, Collection-powered roving focus, RTL-aware keys, a user-only committed output and an Angular Forms adapter.'
group: Primitives
order: 115
---

## At a glance

- **API** — qzToggleGroup `type="single" | "multiple"` with qzToggleItem
- **Focus** — One tab stop; arrows move focus **without** selecting; disabled items are skipped
- **ARIA** — `role="group"` with per-item `aria-pressed` (not a radio group)
- **Forms** — `ToggleGroupControlDirective`: scalar/`null` (single) or array (multiple)
- **CLI** — pnpm quartz add toggle-group

## Imports

```ts
import { ToggleGroupDirective, ToggleItemDirective } from '@quartz-headless/primitives';
import { ToggleGroupControlDirective } from '@quartz-headless/primitives/forms'; // optional
```

## Minimal template

```html
<div
  qzToggleGroup
  [(value)]="align"
  aria-label="Text alignment"
  (valueChangeCommitted)="saved($event)"
>
  <button qzToggleItem="left">Left</button>
  <button qzToggleItem="center">Center</button>
  <button qzToggleItem="right" [qzToggleItemDisabled]="true">Right</button>
</div>
```

## Inputs and outputs

| Name                   | Notes                                                                                                                                               |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `value`                | `model`. `T \| null` in single mode, `readonly T[]` in multiple mode. Programmatic writes are silent.                                               |
| `type`                 | `single` (default) or `multiple`.                                                                                                                   |
| `allowDeselection`     | Single mode only. Default `true` (the pre-0.11 behaviour): pressing the pressed item sets `null`. `false`: it stays pressed and nothing is emitted. |
| `compareWith`          | Identity for object values (default `Object.is`).                                                                                                   |
| `orientation` / `loop` | Arrow-key axis (`horizontal` default) and wrapping (default `true`).                                                                                |
| `disabled`             | Group-level; also set by a disabled Forms control. Items also take `[qzToggleItemDisabled]`.                                                        |
| `valueChangeCommitted` | `T \| null` or `T[]`, emitted **once per user activation**; never for programmatic writes or focus movement.                                        |

## Selection behaviour

- **Single:** pressing an item selects it (replacing the previous one); pressing the pressed item clears it unless `allowDeselection` is `false`. Empty = `null`.
- **Multiple:** pressing toggles membership and emits a new array in press order; empty = `[]`. `null` is treated as empty.
- **Controlled:** `aria-pressed` always reflects `value`; the mode decides how it is read (an array in single mode, or a scalar in multiple mode, shows nothing pressed).
- **Dynamic items:** removing a pressed item or reordering never rewrites `value` (no phantom updates); a value with no matching item simply shows nothing pressed.
- A disabled item or group ignores pointer and keyboard activation.

## Keyboard

| Key           | Action                                                                                           |
| ------------- | ------------------------------------------------------------------------------------------------ |
| Arrow keys    | Move focus on the group's axis (Left/Right swap in RTL); skips disabled items; wraps when `loop` |
| Home / End    | First / last enabled item                                                                        |
| Enter / Space | Press the focused item (native button)                                                           |
| Tab           | Leaves the group — only the active item has `tabindex="0"`                                       |

Moving focus never changes the selection.

## Accessibility

The group is `role="group"`: give it an accessible name (`aria-label`/`aria-labelledby`). Items are buttons with `aria-pressed`. A ToggleGroup is deliberately **not** a [RadioGroup](/docs/primitives/radio-group): there is no required selection and no arrow-selects behaviour. As of 0.11 the group no longer renders `aria-orientation` (it is not allowed on `role="group"`; axe flags it) — use `data-qz-orientation`.

## Angular Forms

`ToggleGroupControlDirective`. Single: the item value or `null`. Multiple: an array. `null` / `undefined` (e.g. `reset()`) show nothing pressed in both modes and the control keeps that `null` until the user commits again. `writeValue` is silent, `onChange` fires once per activation, touched fires when focus leaves the group, `setDisabledState` disables the group.

## Styling hooks

Group: `data-qz-orientation`, `data-qz-disabled`. Item: `data-qz-state="on|off"`, `data-qz-disabled`, `aria-pressed`.

## Known limitations

Buttons only; no vertical RTL special-casing beyond the axis keys; the single-mode value type is the item value type (arrays are not supported as single values).

## Migration from 0.10

Additive: `allowDeselection` (default `true` keeps the old deselect-on-repress behaviour), `valueChangeCommitted`, `isDisabled`, `setFormDisabled()`, the Forms adapter. Behaviour changes: `isPressed` is now mode-aware (previously any array value pressed items even in single mode) and the redundant `aria-orientation` attribute was removed from the group.

## Playground

::playground[quartz-toggle-group]

## Live examples

::demo[toggle-group]
