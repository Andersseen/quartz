# Spec: v1 selection and controls contract

- **Status:** Accepted — implemented in 0.9.0 for Listbox, Select, Checkbox, Switch, RadioGroup, Tabs, Accordion
- **Branch:** feat/quartz-0.9-selection-forms-parity
- **Date:** 2026-10-23 (draft 2026-09-06)
- **Related:** `docs/api/public-surface.md`, `docs/api/v1-scope.md`, `docs/ai/specs/v1-forms.md`

## 1. Problem

Selection and form-like primitives are useful only if controlled state, user commits, disabled
state and keyboard behavior are predictable. Today the APIs are close, but v1 needs one contract
that tells implementers exactly what emits and what stays silent.

## 2. Goal / non-goals

- Goal: define Listbox, Select, Checkbox, Switch, RadioGroup, Tabs and Accordion contracts for v1.
- Non-goals: Forms adapters (see `v1-forms.md`, delivered in 0.9).

## 3. Public API

Use existing selectors and bindings from `docs/api/public-surface.md`. `model()` state remains the
primary API. `*ChangeCommitted` outputs are user-commit signals, not mirrors of programmatic writes.

## 4. Behaviour

1. Programmatic `model()` writes update DOM state without firing committed user events.
2. User pointer or keyboard commits update `model()` and emit the relevant committed or selected
   event exactly once.
3. `disabled` on a container blocks user interaction for all child items without losing external
   state.
4. `disabled` on an item removes it from keyboard navigation and prevents selection.
5. `compareWith` controls object identity wherever object values are accepted.
6. Dynamic options/items preserve selected value when the same value remains and recover to a valid
   active item when the active DOM node disappears.
7. Keyboard behavior follows the ARIA pattern for each primitive and respects orientation and RTL
   where applicable.
8. Empty state is explicit: no option/item means no active descendant and no thrown error.
9. Tabs and Accordion maintain stable trigger/panel relationships and update IDs when dynamic
   content changes.
10. Slider, Toggle, ToggleGroup and Combobox are **mandatory for 1.0** (Volt parity) and must meet the
    same model/commit rules in 0.10/0.11; see `docs/api/volt-parity.md`.
11. Teardown never rewrites a consumer-bound value: destroying a RadioGroup, Tabs or Accordion
    (route change, `@if`) leaves `value` untouched. Removing the _checked radio_ leaves the value
    unchanged (nothing displayed as checked). Removing the selected Tab or open Accordion item
    recovers to a valid item only after the removal settles (microtask), so a re-created item with the
    same value (`@for`) counts as never removed.
12. `valueChangeCommitted` (RadioGroup, Select, Listbox) fires once per user change; re-selecting the
    current value, programmatic writes and Forms `writeValue` never fire it. Checkbox/Switch keep
    `checkedChangeCommitted`, Toggle keeps `pressedChangeCommitted`.
13. Select accessible naming: the popup listbox is named by (1) its own `aria-label`/`aria-labelledby`,
    else (2) the trigger's `aria-label`, else (3) the trigger's `aria-labelledby`, else (4) a reference
    to the trigger element (an id is generated when missing). No dangling references: `aria-controls`
    exists only while the popup exists. Tab from the popup returns focus to the trigger first, so
    focus continues from the trigger's position in the page.
14. Tab `aria-controls` is omitted when no panel is rendered for that tab (no generated phantom id).

## 5. Files to create / modify

| File                                                                                | Action         | Purpose                     |
| ----------------------------------------------------------------------------------- | -------------- | --------------------------- |
| `packages/primitives/src/listbox/**/*.spec.ts`                                      | edit/add later | Base selection behavior     |
| `packages/primitives/src/select/**/*.spec.ts`                                       | edit/add later | Composed selection behavior |
| `packages/primitives/src/{checkbox,switch,radio-group,tabs,accordion}/**/*.spec.ts` | edit/add later | Included controls           |
| `docs/ai/specs/v1-forms.md`                                                         | maintain       | Forms adapter handoff       |

## 6. Test plan

- Unit: model write vs user commit, disabled, dynamic children, object identity and keyboard.
- E2E: representative form page after Forms adapters exist, plus browser keyboard checks for
  Select/Tabs/Accordion.

## 7. Definition of done

- [x] Included selection/control primitives have observable requirements (§4, 1–14) with tests.
- [x] Conditional controls Volt needs are promoted to mandatory with owning milestones.
- [x] Forms adapters implemented on these semantics (`v1-forms.md`).

## 8. Open questions

1. ~~Should Toggle and ToggleGroup be part of the first stable catalogue?~~ **Yes** — Volt exports both; owner milestone 0.11.
2. ~~Should Slider be included in 1.0?~~ **Yes** — Volt exports Slider and RangeSlider; owner milestone 0.11 (browser pointer fixture required).

## 9. 0.10 amendment — advanced selection (implemented)

- **Select:** `multiple` + `values: readonly T[]` (separate from the single `value` so existing `[(value)]` bindings keep compiling); `closeOnSelect` defaults to `!multiple`; `valuesChangeCommitted` once per toggle; `selectedLabels`/`selectedLabel` derive from the value via `displayWith`, so an unrendered option keeps its label; selection and active option remain independent signals.
- **Groups:** `qz{Select,Listbox,Combobox}Group` (`role=group` + `aria-labelledby`), `GroupLabel`, `Separator` (decorative, `aria-hidden`: ARIA forbids `separator` in a listbox — found by axe). None register with the Collection, so navigation/typeahead skip them.
- **Listbox:** single mode stays scalar; array translation belongs to a Volt adapter.
- **Combobox:** query (`inputValue`) and selection (`value`/`values`) are separate; editing a selected value's text clears it and reports `valueChangeCommitted(null)`; IME composition is neither filtered nor committed (`isComposing`, `compositionstart/end`, keyCode 229); Quartz does not fetch — `createLatestRequest()` guards consumer-owned requests (abort + discard stale results); a disabled combobox input is natively `disabled`.
- **Select scroll guard:** a scroll in flight when the popup opens (e.g. the browser scrolling the trigger into view) cannot dismiss it; scroll dismissal arms two frames after open.
