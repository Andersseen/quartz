---
title: Signals and controlled state
description: Two-way model bindings, committed outputs and how selected value, active item and displayed label stay separate.
group: Guides
order: 12
---

Quartz is signals-first and zoneless. Interactive state is exposed as Angular `model()` inputs, so you can bind either way:

```html
<div qzSelect [(value)]="country">…</div>
<!-- two-way -->
<div qzSelect [value]="country()" (valueChange)="country.set($event)">…</div>
```

## Committed outputs

`valueChange` fires for **any** model write, including yours. Primitives that represent a user decision also expose a `*ChangeCommitted` output (`valueChangeCommitted`, `valuesChangeCommitted`, `checkedChangeCommitted`, …) that fires **once per user action** and never for programmatic writes. Forms adapters use these to call `onChange` exactly once.

## Separate concepts

Selection primitives keep distinct signals instead of one implicit value:

| Concept                     | Where                                                                                    |
| --------------------------- | ---------------------------------------------------------------------------------------- |
| Selected value(s)           | `value` / `values` model                                                                 |
| Active (highlighted) option | `activeId`, `activeOption`; `data-qz-highlighted` / `data-qz-active`                     |
| Displayed label             | `selectedLabel()` / `selectedLabels()`, derived from the **value** through `displayWith` |
| Registered options          | the Collection; only options currently rendered                                          |
| External controlled state   | your signal or form control                                                              |

Because the label comes from the value and not from rendered options, a selected value whose option is not rendered (lazy list, filtered results) still shows its label.

## Object values

Pass `compareWith` so identity survives re-created objects, and `displayWith` for the label:

```html
<div qzSelect [(value)]="user" [compareWith]="sameId" [displayWith]="fullName">…</div>
```

## Related

[Angular Forms adapters](/docs/guides/angular-forms) · [Select](/docs/primitives/select) · [Combobox](/docs/primitives/combobox)
