---
title: Migrating 0.9 to 0.10
description: Additive changes in 0.10 (multiple Select, groups, Combobox contract) and the few behaviours to check.
group: Migration
order: 951
---

0.10 is additive: existing exports and selectors are unchanged, and single-value Select, Listbox and Combobox keep their contracts.

## New

- **Select**: `multiple`, `[(values)]`, `closeOnSelect`, `valuesChangeCommitted`, `selectedValues`, `selectedLabels`, `isEmpty`; `qzSelectGroup` / `qzSelectGroupLabel` / `qzSelectSeparator`.
- **Listbox**: `qzListboxGroup` / `qzListboxGroupLabel` / `qzListboxSeparator`.
- **Combobox**: `multiple`, `[(values)]`, `allowDeselect`, `status`, outputs `valueChangeCommitted`, `valuesChangeCommitted`, `queryChanged`, `touched`; group directives; `createLatestRequest()` for consumer-owned async search.
- **Forms**: `ComboboxControlDirective` (included in `QUARTZ_FORMS`); `SelectControlDirective` supports `multiple`.

## Behaviour to check

| Area                              | Change                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Combobox IME                      | Input events during composition no longer filter or rewrite the query; it is applied on `compositionend`.     |
| Combobox closeOnSelect            | Now `undefined` by default: `true` in single mode, `false` with `multiple`. Explicit values behave as before. |
| Combobox editing a selected value | The selection is cleared as before, and now also reported through `valueChangeCommitted(null)`.               |
| Combobox disabled                 | A disabled combobox input is natively `disabled`, not only `aria-disabled`.                                   |
| Combobox `aria-selected`          | Single mode unchanged (highlighted option); multiple mode reflects the selection.                             |
| Virtual scroll                    | No longer throws when measured on a server DOM without layout.                                                |

## Documentation site

Component pages moved under `/docs/core/*` and `/docs/primitives/*`. Old root URLs (`/dialog`, `/select`, …) redirect permanently.
