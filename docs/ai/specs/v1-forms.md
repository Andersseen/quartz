# Spec: v1 Angular Forms adapters

- **Status:** Accepted — implemented in 0.9.0
- **Branch:** feat/quartz-0.9-selection-forms-parity
- **Date:** 2026-10-23 (draft 2026-09-06)
- **Related:** `docs/api/v1-scope.md`, `docs/ai/specs/v1-selection-controls-contract.md`, `docs/api/volt-parity.md` §6

## 1. Problem

Quartz controls expose signal models, but Angular applications commonly integrate controls through
Reactive or template-driven Forms. A form-control claim needs defined behaviour for programmatic
writes, user changes, touched, disabled and reset without duplicate emissions.

## 2. Goal / non-goals

- Goal: optional Forms integration for the form-like primitives, with no cost for consumers that
  do not use Forms.
- Non-goals: no Forms dependency in Core; no required Forms usage for signal consumers; no new npm
  package; no validators; no generic CVA framework.

## 3. Decisions (resolving the draft's open questions)

| Question                                          | Decision                                                                                                                                          | Why                                                                                                                                                                                                                                                                                                                                           |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Automatic on the directives or opt-in companions? | **Opt-in companions** in a **secondary entry point** `@quartz-headless/primitives/forms`                                                          | `NG_VALUE_ACCESSOR` lives in `@angular/forms`. A static import in the main entry would make `@angular/forms` a hard requirement for every consumer (an ES import is resolved by the bundler even when unused). A separate entry point keeps the main bundle free of it; `verify:build` fails if the main entry ever imports `@angular/forms`. |
| New npm package?                                  | **No.** One extra entry point of the existing package                                                                                             | “Do not create an unnecessary package”; shipped by the existing publish pipeline.                                                                                                                                                                                                                                                             |
| Peer dependency                                   | `@angular/forms` `^21.0.0` as an **optional** peer (`peerDependenciesMeta`)                                                                       | npm warns nobody who never imports `/forms`; a consumer that does gets a normal peer check.                                                                                                                                                                                                                                                   |
| Selector style                                    | `<primitive>[formControl]`, `[formControlName]`, `[ngModel]`                                                                                      | The adapter only attaches where Angular Forms is actually bound, so existing signal usage is untouched and nothing changes on upgrade.                                                                                                                                                                                                        |
| Checkbox `'indeterminate'` via Forms              | **Writable.** `writeValue('indeterminate')` shows `aria-checked="mixed"`; user activation resolves it to `true`; `null`/`undefined` write `false` | Matches the model type `boolean \| 'indeterminate'`.                                                                                                                                                                                                                                                                                          |
| Shared base class                                 | A 25-line `ControlAdapter` holds only `registerOnChange/OnTouched` plumbing                                                                       | Five adapters repeat it identically; everything else (value mapping, touched trigger) stays per control.                                                                                                                                                                                                                                      |
| Disabled                                          | Each primitive exposes `isDisabled = disabled() \|\| formDisabled()` and a `setFormDisabled()` hook; the `disabled` input is never overwritten    | Forms and the input can both be used without one erasing the other.                                                                                                                                                                                                                                                                           |

## 4. Public API

Entry point `@quartz-headless/primitives/forms` exports:

| Symbol                       | Attaches to                  | Value                                                               |
| ---------------------------- | ---------------------------- | ------------------------------------------------------------------- |
| `CheckboxControlDirective`   | `button[qzCheckbox]` + Forms | `true \| false \| 'indeterminate'`                                  |
| `SwitchControlDirective`     | `button[qzSwitch]` + Forms   | `boolean`                                                           |
| `RadioGroupControlDirective` | `[qzRadioGroup]` + Forms     | checked radio's value, `null` when none                             |
| `SelectControlDirective`     | `[qzSelect]` + Forms         | selected option value, `null` when none (unmatched values are kept) |
| `ListboxControlDirective`    | `[qzListbox]` + Forms        | value (single) or array (`multiple`); `null` = none                 |
| `QUARTZ_FORMS`               | —                            | tuple of the five, for `imports: [...QUARTZ_FORMS]`                 |

Supporting additions in the **main** entry (no Forms import): `valueChangeCommitted` output on
`RadioGroupDirective`, `SelectDirective`, `ListboxDirective`; `touched` output on `SelectDirective`;
`isDisabled` and `setFormDisabled()` on the five primitives; `SelectDirective.nameListbox()`.

## 5. Behaviour

1. `writeValue` updates the Quartz model and DOM without any committed/user event.
2. A user action calls the registered `onChange` **exactly once** with the public value. Re-selecting
   the current value (radio, select, single listbox) is not a change and does not notify.
3. `onTouched` fires on real focus loss, as defined per control:
   Checkbox/Switch — `blur`; RadioGroup/Listbox — focus leaves the widget (moving between inner
   items does not touch); Select — trigger blur while closed, or a popup close that does not return
   focus to the trigger (outside pointer, focus-outside, scroll). Escape, selection and Tab hand focus
   back to the trigger first, so they do not touch until focus actually leaves.
4. `setDisabledState` maps to `isDisabled`: interaction is blocked, an open Select popup closes, and
   the form value is preserved. Re-enabling restores interaction.
5. `reset()` writes the empty value: Checkbox/Switch `false`; RadioGroup/Select/Listbox `null`
   (nothing selected). A non-nullable control resets to its own initial value, as in any Angular form.
6. Forms and signal bindings together: both write the same model. They are deterministic (the last
   write wins and `valueChange` is not re-fed into Forms) but **not recommended**; use one source of truth.
   Template-driven forms need `name` inside `<form>` or `[ngModelOptions]="{standalone: true}"`, as
   with any control.
7. Validation is consumer-owned; Quartz adds no validators and sets no `aria-invalid`.
8. SSR/zoneless: no DOM at import time, no `NgZone`; the adapters are plain directives.

## 6. Files

| File                                                               | Purpose                                                                                |
| ------------------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| `packages/primitives/forms/ng-package.json`, `forms/src/*.ts`      | Entry point and adapters                                                               |
| `packages/primitives/forms/tsconfig.lib.json`                      | Type check (`pnpm typecheck`) with a path to the sibling entry                         |
| `packages/primitives/package.json`                                 | Optional `@angular/forms` peer                                                         |
| `scripts/api-guard.js`, `docs/api/snapshots/primitives-forms.json` | API snapshot for the new entry                                                         |
| `scripts/verify-build.js`                                          | Forms entry present, optional peer, main entry free of `@angular/forms`                |
| `scripts/consumer-smoke/fixture/`                                  | Installed-tarball AOT `strictTemplates` fixture with `ReactiveFormsModule` + `ngModel` |

## 7. Test plan (all implemented)

- Unit (real Angular Forms): `forms/src/forms.spec.ts` — writeValue silence, one onChange, unmatched
  select value, touched rules, disabled (incl. closing an open popup), reset, `ngModel`.
- Primitive contracts: `controls.contract.spec.ts`, `select/select.contract.spec.ts`.
- E2E: `e2e/forms.spec.ts` on `/e2e-forms` in Chromium, Firefox and WebKit — values, validation,
  touched, submit, reset, disabled, keyboard-only, Select in Dialog, RTL, repeated cycles, axe.
- Consumer: `pnpm verify:consumer` AOT-compiles reactive and template-driven bindings from tarballs.

## 8. Not in 0.9 (Forms requirements recorded for later milestones)

Combobox (0.10), Toggle/ToggleGroup/Slider/RangeSlider (0.11), DatePicker/DateRangePicker (0.12),
InputOTP and FileUpload (0.14). Value contracts are in `docs/api/volt-parity.md` §6.

## 9. Definition of done

- [x] Forms dependency strategy decided and verified (`verify:build` guards it).
- [x] Every included form-like primitive has an adapter or an explicit non-support note (Toggle,
      ToggleGroup, Slider, Combobox: scheduled, see §8).
- [x] Signal-only usage unchanged; Core imports no Forms.

## 10. 0.10 amendment

`SelectControlDirective` supports `multiple` (array value; `[]` once emptied; `writeValue(null)`/`reset()` shown as empty). New `ComboboxControlDirective`: the form value is the committed selection (never the text); typing does not notify; `writeValue` is silent and also syncs the text; `reset()` clears selection and text; touched on blur or on an outside close; `setDisabledState` disables the input. Both are in `QUARTZ_FORMS`.
