# Spec: v1 selection and controls contract

- **Status:** Draft
- **Branch:** v1-roadmap
- **Date:** 2026-09-05
- **Related:** `docs/api/public-surface.md`, `docs/api/v1-scope.md`, `docs/ai/specs/v1-forms.md`

## 1. Problem

Selection and form-like primitives are useful only if controlled state, user commits, disabled
state and keyboard behavior are predictable. Today the APIs are close, but v1 needs one contract
that tells implementers exactly what emits and what stays silent.

## 2. Goal / non-goals

- Goal: define Listbox, Select, Checkbox, Switch, RadioGroup, Tabs and Accordion contracts for v1.
- Non-goals: do not implement Forms adapters in this spec; Forms is designed in 0.6 and delivered
  in 0.9.

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
10. Conditional controls such as Slider, Toggle and ToggleGroup must meet the same model/commit
    rules before being promoted to v1.

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

- [ ] Included selection/control primitives have observable requirement IDs.
- [ ] Conditional controls are promoted or excluded before API freeze.
- [ ] Forms adapter implementation can proceed without deciding event semantics.

## 8. Open questions

1. Should Toggle and ToggleGroup be part of the first stable catalogue?
2. Should Slider be included in 1.0 or delayed until a stronger browser fixture exists?
