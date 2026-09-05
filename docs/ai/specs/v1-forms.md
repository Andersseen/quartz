# Spec: v1 Angular Forms adapters

- **Status:** Draft
- **Branch:** v1-roadmap
- **Date:** 2026-09-05
- **Related:** `docs/api/v1-scope.md`, `docs/ai/specs/v1-selection-controls-contract.md`

## 1. Problem

Quartz controls expose signal models, but Angular applications commonly integrate controls through
Reactive Forms. If v1 claims form-control usefulness, adapters must define disabled, touched,
reset and programmatic writes without introducing duplicate emissions.

## 2. Goal / non-goals

- Goal: design optional Forms integration for included form-like primitives before implementation.
- Non-goals: no Forms dependency in Core, no required Forms usage for signal consumers and no new
  package unless implementation proves the current packages cannot host optional providers.

## 3. Public API

Proposed adapter coverage for v1:

- Checkbox: `button[qzCheckbox]`
- Switch: `button[qzSwitch]`
- RadioGroup: `[qzRadioGroup]`
- Select: `[qzSelect]`
- Optional if promoted: Slider, Toggle, ToggleGroup and Combobox

Adapters provide `ControlValueAccessor` behavior through Angular Forms providers while preserving
existing signal APIs. `@angular/forms` must be an explicit peer/dependency decision before code is
added.

## 4. Behaviour

1. `writeValue` updates the Quartz model and DOM state without emitting committed user events.
2. User commit calls registered `onChange` exactly once with the public value.
3. Blur or equivalent focus loss calls `onTouched` once per touched cycle.
4. `setDisabledState` maps to the public disabled state and blocks user interaction.
5. Form reset maps to the documented empty value: `false` for switch, `false` or
   `'indeterminate'` only when explicit for checkbox, `null` for single selection controls.
6. External signal binding and Forms binding precedence is documented; using both at the same time
   must either be supported deterministically or warned against in docs.
7. Validation stays consumer-owned; Quartz does not add validators.
8. Adapters are SSR-safe and do not touch DOM at import time.

## 5. Files to create / modify

| File                                    | Action       | Purpose                               |
| --------------------------------------- | ------------ | ------------------------------------- |
| `packages/primitives/src/**/forms*.ts`  | create later | Adapter implementation if approved    |
| `packages/primitives/src/public-api.ts` | edit later   | Export adapter symbols only if public |
| `packages/primitives/package.json`      | edit later   | Declare Forms relationship            |
| `scripts/consumer-smoke/fixture/`       | edit later   | Real form consumer fixture            |

## 6. Test plan

- Unit: one CVA harness per included control.
- Consumer: Reactive Forms app with `strictTemplates`, disabled state, reset and value changes.
- E2E: one user path submits values from at least Checkbox/Switch/RadioGroup/Select.

## 7. Definition of done

- [ ] Forms dependency strategy approved before implementation.
- [ ] Every included form-like primitive either has an adapter or explicit non-support note.
- [ ] Signal-only usage remains unchanged.

## 8. Open questions

1. Should adapters be automatic on the existing directives or opt-in companion directives?
2. Should Checkbox support `'indeterminate'` through Forms writes or treat it as presentation state?
