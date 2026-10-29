# Volt UI headless parity inventory

Status: **0.9.0 deliverable — an auditable compatibility matrix, not a promise.** It governs the
remaining pre-1.0 milestones (see `ROADMAP.md` §4 and `docs/api/v1-scope.md`).

## 1. Reference and method

| Item                               | Value                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------- |
| Reference repository               | `Andersseen/volt-ui` (read-only; nothing in it was modified)                                |
| Reference commit                   | `7c76ef3b8aa6e3d6c4da578b0be22939556d53af` (`main`, verified 2026-10-23)                    |
| Reference package                  | `@voltui/components` 1.3.3                                                                  |
| Catalogue source                   | `projects/volt/src/public-api.ts` (authoritative), cross-checked with `COMPONENT_STATUS.md` |
| Volt behavioural dependencies      | `ng-primitives` `^0.131.2`, Angular CDK (peer), Floating UI (`@floating-ui/dom`)            |
| Volt Angular peers                 | `^21.2.0 \|\| ^22.0.0`                                                                      |
| Quartz baseline for the comparison | `main` @ `6c64097` + the 0.9.0 changes in this PR                                           |

Method: every barrel exported by `public-api.ts` was opened; its `ng-primitives/*`, `@angular/cdk`
and Floating UI imports were extracted from the **source** (not the README), its selectors,
inputs/models/outputs and CVA usage were listed, and the Quartz equivalent was compared against its
actual implementation and tests. Classifications are conservative: a similarly named Quartz
primitive is **not** marked equivalent without observable evidence.

**Catalogue size.** `public-api.ts` has **45 barrels**: 44 component barrels plus the `sidebar`
layout. The README's “44 public components” corresponds to the component barrels. One sub-surface
that lives inside another barrel is audited as its own row because its behaviour differs:
`date-range-picker` (inside `date-picker`). `select[voltNativeSelect]` (a native `<select>`) is
classified N inside the `select` row. The inventory therefore has **46 rows** covering all 45 barrels.

### Classification legend

| Code  | Meaning                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------ |
| **V** | Implemented and verified — Quartz has comparable observable behaviour with committed evidence.         |
| **C** | Implemented but missing coverage — behaviour exists, evidence for the Volt-required contract does not. |
| **P** | Partial behavioural equivalence — a real part of the contract is absent or unproven.                   |
| **M** | Missing — no Quartz equivalent.                                                                        |
| **N** | Native HTML / Angular / composition is sufficient, with the justification written down.                |

### Milestone vocabulary

| Milestone       | Family                                                                                                                      |
| --------------- | --------------------------------------------------------------------------------------------------------------------------- |
| 0.9             | This release: Listbox, Select (single), Checkbox, Switch, RadioGroup, Tabs, Accordion, Forms entry point, parity contract   |
| 0.10            | Advanced selection (Combobox, Select multiple/groups, Listbox sections)                                                     |
| 0.11            | Range and toggle controls (RangeSlider, Slider, Toggle, ToggleGroup + Forms)                                                |
| 0.12            | Date and date-range interaction                                                                                             |
| 0.13            | Navigation and roving focus (NavigationMenu, Toolbar, Pagination, Accordion/Sidebar gaps)                                   |
| 0.14            | Text, file input and form-field wiring (InputOTP, Autofill, FileUpload, FormField, Search recipe)                           |
| 0.15            | Feedback and value indicators (Progress, Meter, Avatar, Toast content API)                                                  |
| 0.16            | Drawer, resizable and floating API completeness (Drawer, Resizable, Tooltip/Popover arrows, Menu groups)                    |
| 0.17            | Consumer compatibility: installed-tarball matrix on Angular 21.2 **and 22**, SSR + real hydration, bundle/tree-shaking, CLI |
| 0.18            | Release freeze (reproducible release, docs, API freeze)                                                                     |
| beta / rc / 1.0 | Adoption validation; the Volt adapter spike is one of the two consumer integrations                                         |

## 2. Summary

| Code | Meaning                         |   Rows | Barrels only |
| ---- | ------------------------------- | -----: | -----------: |
| V    | Implemented and verified        |     26 |           26 |
| C    | Implemented, missing coverage   |      4 |            4 |
| P    | Partial behavioural equivalence |      2 |            2 |
| M    | Missing                         |      0 |            0 |
| N    | Native / composition sufficient |     14 |           14 |
|      | **Total**                       | **46** |       **45** |

Reading the numbers: **26 of 46** rows are verified-equivalent after the 0.16 implementation (Checkbox, RadioGroup, Switch, Tabs, Dialog, Select, Listbox, Combobox, Slider, RangeSlider, Toggle, ToggleGroup, DatePicker, DateRangePicker, NavigationMenu, Pagination, Toolbar, Progress, Meter, Avatar, Toast, Drawer, Resizable, Tooltip, Popover, DropdownMenu); the summary counts were recomputed from the row headings in 0.16 (the 0.9-era table had drifted). The 1.0 prerequisite is every row V or N: six rows remain (`accordion` P, `sidebar` P, `autofill` C, `form-field` C, `input-otp` C, `file-upload` C); Quartz as a whole is **not** v1-ready and is **not** Volt-compatible yet. Remaining non-N/non-V rows have an owning milestone below.

### Rows by owning milestone (non-N, non-V)

| Milestone                                                                                                                              | Rows                                                                             |
| -------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| 0.10 — Advanced selection (Combobox, Select multiple/groups, Listbox sections) — **closed in 0.10.0**                                  | `select` (V), `combobox` (V), `listbox` (V)                                      |
| 0.11 — Range and toggle controls (RangeSlider, Slider, Toggle, ToggleGroup + Forms) — **closed in 0.11.0**                             | `toggle` (V), `slider` (V), `range-slider` (V), `toggle-group` (V)               |
| 0.12 — Date and date-range interaction — **closed in 0.12.0**                                                                          | `date-picker` (V), `date-range-picker` (V)                                       |
| 0.13 — Navigation and roving focus (NavigationMenu, Toolbar, Pagination, Accordion/Sidebar gaps)                                       | `accordion` (P), `sidebar` (P)                                                   |
| 0.14 — Text, file input and form-field wiring (InputOTP, Autofill, FileUpload, FormField, Search recipe)                               | `autofill` (C), `form-field` (C), `input-otp` (C), `file-upload` (C)             |
| 0.16 — Drawer, resizable and floating API completeness (Drawer, Resizable, Tooltip/Popover arrows, Menu groups) — **closed in 0.16.0** | `tooltip` (V), `drawer` (V), `popover` (V), `dropdown-menu` (V), `resizable` (V) |

Rows also carrying a _later_ gate (e.g. hydration proof in 0.17) keep their evidence code; 0.17 is a
cross-cutting gate applied to **every** row, see §5.

## 3. Component inventory

### `button` — Native / composition sufficient (**N**)

- **Volt public surface:** `volt-button`, `button[voltButton]`, `a[voltButton]`; variants helper
- **Behavioural dependency:** ng-primitives `button` + `interactions` (data-hover/press/focus-visible attributes); native HTML
- **Observable headless contract required:** Native activation semantics on `<button>`/`<a>`; interaction state attributes are styling hooks only.
- **Quartz equivalent:** None needed.
- **Current evidence:** Native / composition sufficient. Everything behavioural is the browser's; data-hover/press are CSS conveniences replaceable by pseudo-classes.
- **Accessibility:** Native button/link role, name from content, native disabled.
- **Forms:** n/a
- **Angular / SSR:** Static markup or native element; no runtime behaviour, nothing to hydrate.
- **Remaining work:** None. Optional: document `:focus-visible`/`:active` as the supported hooks.
- **Owning milestone:** n/a
- **Acceptance tests needed:** None (native).

### `badge` — Native / composition sufficient (**N**)

- **Volt public surface:** `volt-badge`
- **Behavioural dependency:** Volt-owned (pure styling)
- **Observable headless contract required:** None.
- **Quartz equivalent:** None needed.
- **Current evidence:** Native / composition sufficient. Purely visual.
- **Accessibility:** Decorative text.
- **Forms:** n/a
- **Angular / SSR:** Static markup or native element; no runtime behaviour, nothing to hydrate.
- **Remaining work:** None.
- **Owning milestone:** n/a
- **Acceptance tests needed:** None.

### `input` — Native / composition sufficient (**N**)

- **Volt public surface:** `volt-input` (CVA)
- **Behavioural dependency:** ng-primitives `input` + `utils`; native `<input>`
- **Observable headless contract required:** Native text input; disabled/invalid/touched/dirty reflected as data attributes; value via Angular Forms.
- **Quartz equivalent:** None needed (native `<input>` + Angular `DefaultValueAccessor`).
- **Current evidence:** Native / composition sufficient. A native input with Angular Forms satisfies the behaviour; only the state-attribute convenience is open.
- **Accessibility:** Native input semantics; name/description wiring is the FormField concern (see `form-field`).
- **Forms:** Volt provides its own CVA wrapper; with a native input Angular already provides it.
- **Angular / SSR:** Static markup or native element; no runtime behaviour, nothing to hydrate.
- **Remaining work:** State data-attributes (`data-invalid`, `data-touched`, `data-dirty`) come from FormField wiring (0.14).
- **Owning milestone:** 0.14 (via form-field)
- **Acceptance tests needed:** Covered by the form-field tests.

### `search` — Native / composition sufficient (**N**)

- **Volt public surface:** `volt-search`, `volt-search-clear`; re-exports `injectSearchState`, `provideSearchState`
- **Behavioural dependency:** ng-primitives `search` + `button`
- **Observable headless contract required:** `role="search"` wrapper; clear button empties the field and returns focus to it; hidden when empty.
- **Quartz equivalent:** None needed (`<search>`/`role="search"` + native input + button).
- **Current evidence:** Native / composition sufficient. Behaviour is two lines of consumer code on native elements; a recipe, not a primitive.
- **Accessibility:** Landmark role; clear button needs an accessible name.
- **Forms:** Structural wrapper; the inner input owns the value.
- **Angular / SSR:** Static markup or native element; no runtime behaviour, nothing to hydrate.
- **Remaining work:** Document the composition recipe (clear button refocus).
- **Owning milestone:** 0.14
- **Acceptance tests needed:** E2E recipe: clear empties the model, focus returns to the input, button hidden when empty.

### `autofill` — Implemented, missing coverage (**C**)

- **Volt public surface:** `voltAutofill`; re-exports `injectAutofillState`, `ngpAutofill`, `provideAutofillState`, `NgpAutofillProps`, `NgpAutofillState`
- **Behavioural dependency:** ng-primitives `autofill`
- **Observable headless contract required:** Detects browser autofill (via `:-webkit-autofill` animation start/`animationstart` hook) and exposes `data-autofill` + an `autofilled` output.
- **Quartz equivalent:** `AutofillDirective` detects configured animation-start/end events, maintains `data-autofilled` and emits state transitions. If autofill changes the host value without `input`, it dispatches a bubbling input event for Forms.
- **Current evidence:** Unit transition and value-notification tests; genuine browser autofill and complete cross-engine limitations are still unverified.
- **Accessibility:** None directly (styling signal).
- **Forms:** Autofill fires no `input` event in some browsers; the value must reach the control.
- **Angular / SSR:** Browser-only observer; must be a no-op on the server and not run at import.
- **Remaining work:** SSR and teardown tests; genuine supported-engine evidence; document engine limitations.
- **Owning milestone:** 0.14
- **Acceptance tests needed:** Unit: animation-start toggles state; E2E (Chromium) with autofilled field style hook; SSR no-op.

### `textarea` — Native / composition sufficient (**N**)

- **Volt public surface:** `volt-textarea` (CVA)
- **Behavioural dependency:** ng-primitives `textarea` + `utils`; native `<textarea>`
- **Observable headless contract required:** Native textarea; Forms value; state attributes.
- **Quartz equivalent:** None needed.
- **Current evidence:** Native / composition sufficient. Native control.
- **Accessibility:** Native.
- **Forms:** Native `DefaultValueAccessor`.
- **Angular / SSR:** Static markup or native element; no runtime behaviour, nothing to hydrate.
- **Remaining work:** Same state-attribute note as `input`.
- **Owning milestone:** 0.14 (via form-field)
- **Acceptance tests needed:** Covered by form-field tests.

### `card` — Native / composition sufficient (**N**)

- **Volt public surface:** `volt-card*`
- **Behavioural dependency:** Volt-owned (styling)
- **Observable headless contract required:** None.
- **Quartz equivalent:** None needed.
- **Current evidence:** Native / composition sufficient. Purely visual.
- **Accessibility:** Decorative structure.
- **Forms:** n/a
- **Angular / SSR:** Static markup or native element; no runtime behaviour, nothing to hydrate.
- **Remaining work:** None.
- **Owning milestone:** n/a
- **Acceptance tests needed:** None.

### `checkbox` — Implemented and verified (**V**)

- **Volt public surface:** `volt-checkbox` (CVA)
- **Behavioural dependency:** ng-primitives `checkbox`
- **Observable headless contract required:** `role=checkbox`, `aria-checked` true/false/mixed, Space/click toggle, disabled, indeterminate, Forms value boolean.
- **Quartz equivalent:** `CheckboxDirective` (`button[qzCheckbox]`) + `CheckboxControlDirective` (`/forms`).
- **Current evidence:** Implemented and verified.
- **Accessibility:** Verified: role, aria-checked incl. `mixed`, name from content/aria-label, disabled; axe scan of the form fixture.
- **Forms:** Verified: writeValue silent, one onChange per activation, touched on blur, disabled, reset → `false`, `null` → `false`, `'indeterminate'` writable.
- **Angular / SSR:** Host bindings only; AOT-compiled in the installed-tarball fixture; SSR/hydration against a real server render is a 0.17 gate.
- **Remaining work:** Hydration proof (0.17). Volt's `volt-checkbox` wrapper (label placement) is Volt-owned.
- **Owning milestone:** 0.9 (done); hydration 0.17
- **Acceptance tests needed:** `forms.spec.ts`, `controls.contract.spec.ts`, `e2e/forms.spec.ts` (3 engines).

### `radio` — Implemented and verified (**V**)

- **Volt public surface:** `volt-radio-group`, `volt-radio-item` (CVA)
- **Behavioural dependency:** ng-primitives `radio` + `common`
- **Observable headless contract required:** `radiogroup`/`radio`, roving tabindex, arrows select, orientation, Home/End, disabled group/item, Forms value.
- **Quartz equivalent:** `RadioGroupDirective` + `RadioDirective` + `RadioGroupControlDirective`.
- **Current evidence:** Implemented and verified.
- **Accessibility:** Verified: roles, aria-checked, one tab stop, arrows follow reading direction (RTL e2e), disabled.
- **Forms:** Verified: writeValue silent, one onChange per user change (re-selecting is silent), touched when focus leaves the group, disabled, reset → `null`.
- **Angular / SSR:** As checkbox.
- **Remaining work:** Hydration proof (0.17). Generic-host `qzRadio` is intentionally kept (STABILITY_AUDIT).
- **Owning milestone:** 0.9 (done); hydration 0.17
- **Acceptance tests needed:** `forms.spec.ts`, `controls.contract.spec.ts`, `radio-group.directive.spec.ts`, e2e RTL.

### `switch` — Implemented and verified (**V**)

- **Volt public surface:** `volt-switch` (CVA)
- **Behavioural dependency:** ng-primitives `switch`
- **Observable headless contract required:** `role=switch`, `aria-checked`, Space/Enter, disabled, Forms boolean.
- **Quartz equivalent:** `SwitchDirective` + `SwitchControlDirective`.
- **Current evidence:** Implemented and verified.
- **Accessibility:** Verified: switch role, aria-checked, disabled.
- **Forms:** Verified (as checkbox; `null` → `false`).
- **Angular / SSR:** As checkbox.
- **Remaining work:** Hydration proof (0.17).
- **Owning milestone:** 0.9 (done); hydration 0.17
- **Acceptance tests needed:** `forms.spec.ts`, `controls.contract.spec.ts`, e2e.

### `toggle` — Implemented and verified (**V**)

- **Volt public surface:** `volt-toggle` (CVA)
- **Behavioural dependency:** ng-primitives `toggle`
- **Observable headless contract required:** `aria-pressed`, click/Space/Enter, disabled, Forms boolean.
- **Quartz equivalent:** `ToggleDirective` (`button[qzToggle]`, `pressed` model + `pressedChangeCommitted`) + `ToggleControlDirective`.
- **Current evidence:** 0.11: unit (`toggle.directive.spec.ts`: one commit per activation, silent writes, disabled; `forms.range-toggle.spec.ts`: boolean value, `null` → `false`, touched on blur, disabled, template-driven); `e2e/range-toggle.spec.ts` (Chromium/Firefox/WebKit: Enter and Space each activate once, external writes silent, Forms commit/reset/disable/touched); axe on default and interacted states; AOT consumer smoke (strict templates, installed tarball).
- **Accessibility:** Verified: `aria-pressed`, native button focus/activation, `type="button"` (no accidental submit); axe clean. Name is consumer-owned.
- **Forms:** Verified: boolean, `null`/`undefined` → `false` (same as Switch), silent `writeValue`, one `onChange` per activation, touched on blur, `setDisabledState`.
- **Angular / SSR:** Host bindings only; hydration proof 0.17.
- **Remaining work:** None for the 0.11 contract. Differences from Volt: Volt exposes an `ariaLabel` input (Quartz: put `aria-label` on the button). Manual screen-reader review and the cross-cutting 0.17 gate remain.
- **Owning milestone:** 0.11 (closed in 0.11.0)
- **Acceptance tests needed:** Done (see evidence).

### `form-field` — Implemented, missing coverage (**C**)

- **Volt public surface:** `volt-form-field`, `volt-label`, `volt-hint`, `volt-error`
- **Behavioural dependency:** ng-primitives `form-field`
- **Observable headless contract required:** Generates ids and wires `aria-labelledby`/`aria-describedby` between label/hint/error and the projected control; mirrors invalid/touched/dirty/disabled from `NgControl` as data attributes; error shown per control state.
- **Quartz equivalent:** Structural root, control, label, description and error directives; stable consumer-provided root ID; optional Forms state observer.
- **Current evidence:** Focused native-control association tests and optional Forms state test. SSR/hydration, Checkbox/Switch composition, async validators and teardown evidence remain incomplete.
- **Accessibility:** Dangling-reference-free ids; error announced (`role=alert`/describedby) when shown.
- **Forms:** Reads `NgControl` state of the projected control — requires the optional `/forms` entry point.
- **Angular / SSR:** Ids must be deterministic across server/client.
- **Remaining work:** Complete control-family, dynamic validation, reset/async-validator and SSR/hydration coverage.
- **Owning milestone:** 0.14
- **Acceptance tests needed:** Unit: ids/ARIA for native input and Quartz Switch; invalid/touched mirroring; e2e submit-error flow; SSR id stability.

### `tooltip` — Implemented and verified (**V**)

- **Volt public surface:** `voltTooltip`, `volt-tooltip-content`, `volt-tooltip-arrow`; re-exports `injectTooltipArrowState`, `injectTooltipContext`, `provideTooltipArrowState`, `provideTooltipConfig`, `NgpTooltipArrowProps`, `NgpTooltipArrowState`
- **Behavioural dependency:** ng-primitives `tooltip` + `portal`; Floating UI (via ng-primitives)
- **Observable headless contract required:** Hover/focus show with delays, Escape/blur hide, `aria-describedby`, flip/shift placement, arrow positioning, template content.
- **Quartz equivalent:** `TooltipDirective`, `TooltipService`; arrow geometry via `tooltipArrowSize`/`tooltipArrowPadding`, `arrow()`/`resolvedPlacement()` signals, `data-side`/`data-placement`/`--qz-arrow-x|y` and a reactive template context (`let-arrow`, `let-placement`); Core `calculateArrowGeometry`.
- **Current evidence (0.16):** `tooltip-arrow.spec.ts` (resolved placement and arrow edge after flip, padding clamp, unavailable state without NaN, re-measure on resize/anchor change, template context, `aria-describedby` preserved and removed, no arrow data without a size, destroy); `overlay-arrow.spec.ts` (top/bottom/left/right, start/end alignment, RTL physical placement, viewport shift, arrow larger than the track, non-finite input); `e2e/floating-016.spec.ts` in Chromium, Firefox and WebKit (geometry centred on the real anchor, flip near the viewport edge, anchor resize, keyboard focus/Escape, template context, no-arrow tooltip, axe); `e2e/docs.spec.ts` demo hydration; strict installed-tarball AOT (`verify:consumer`).
- **Accessibility:** `aria-describedby` preserved (0.8); axe scan of the open tooltip (0.16); no interactive content in `role=tooltip`.
- **Forms:** n/a
- **Angular / SSR:** Overlay and the text tooltip are browser-only; nothing is created on the server.
- **Remaining work:** None for the behavioural contract. Quartz renders no arrow markup and the two rendering engines (string/template) still exist but share one positioning function and one geometry contract. Symbol parity (`injectTooltipArrowState` etc.) is an adapter concern.
- **Owning milestone:** 0.16 (closed)
- **Acceptance tests needed:** None beyond the committed tests above.

### `avatar` — Implemented and verified (**V**)

- **Volt public surface:** `volt-avatar`, `img[voltAvatarImage]`, `volt-avatar-fallback`
- **Behavioural dependency:** ng-primitives `avatar`
- **Observable headless contract required:** Image load state machine (loading → loaded | error); fallback shown while loading (optional delay) or on error; swaps when `src` changes.
- **Quartz equivalent:** `AvatarComponent` (`<qz-avatar>`).
- **Current evidence:** Unit coverage for initial fallback, load, error, source replacement and delayed fallback; three-engine browser fixture verifies broken-image fallback, successful image load, and replacement after load.
- **Accessibility:** Image keeps `alt`; fallback is text; decorative fallback hidden from AT once the image loads.
- **Forms:** n/a
- **Angular / SSR:** Server renders the fallback; client takes over without a hydration mismatch.
- **Remaining work:** None for this contract. Optional: dedicated SSR-rendered fallback snapshot.
- **Owning milestone:** 0.15
- **Acceptance tests needed:** Complete (see feedback fixture, three-engine browser checks, and installed-consumer AOT fixture).

### `separator` — Native / composition sufficient (**N**)

- **Volt public surface:** `volt-separator`
- **Behavioural dependency:** ng-primitives `separator`
- **Observable headless contract required:** `role=separator` + `aria-orientation` (or decorative/`role=none`).
- **Quartz equivalent:** None needed (`<hr>` or `role=separator`).
- **Current evidence:** Native / composition sufficient. Two ARIA attributes on a native element.
- **Accessibility:** Native `<hr>` or attribute.
- **Forms:** n/a
- **Angular / SSR:** Static markup or native element; no runtime behaviour, nothing to hydrate.
- **Remaining work:** None.
- **Owning milestone:** n/a
- **Acceptance tests needed:** None.

### `accordion` — Partial behavioural equivalence (**P**)

- **Volt public surface:** `volt-accordion`, `-item`, `-trigger`, `-content`
- **Behavioural dependency:** ng-primitives `accordion`
- **Observable headless contract required:** Single/multiple, collapsible, container `disabled`, `orientation`, roving trigger focus, `aria-expanded/controls`, hidden content out of tab order.
- **Quartz equivalent:** `AccordionDirective` family.
- **Current evidence:** Partial behavioural equivalence.
- **Accessibility:** Verified: expanded/controls, hidden panels, trigger arrows/Home/End; teardown no longer rewrites the bound value (0.9).
- **Forms:** n/a (Volt: none).
- **Angular / SSR:** Panels render `hidden` markup; hydration proof 0.17.
- **Remaining work:** Container `disabled`; `orientation` (horizontal arrows + RTL); non-collapsible open item `aria-disabled` per APG.
- **Owning milestone:** 0.13
- **Acceptance tests needed:** Unit + e2e: container disabled blocks all triggers; horizontal/RTL arrow mapping.

### `tabs` — Implemented and verified (**V**)

- **Volt public surface:** `volt-tabs`, `-list`, `-trigger`, `-content`
- **Behavioural dependency:** ng-primitives `tabs` + `roving-focus`
- **Observable headless contract required:** Automatic/manual activation (`activateOnFocus`), orientation, disabled, Home/End, valid tab↔panel ids, hidden panels out of tab order.
- **Quartz equivalent:** `TabsDirective` family.
- **Current evidence:** Implemented and verified.
- **Accessibility:** Verified: ids/aria-controls only when a panel is rendered (0.9 fix), manual vs automatic, RTL, hidden panels; axe not yet on tabs.
- **Forms:** n/a
- **Angular / SSR:** Panels render `hidden`; hydration proof 0.17.
- **Remaining work:** Volt `activateOnFocus: boolean` maps to `activationMode`; adapter-level only. Tabs axe scan in e2e.
- **Owning milestone:** 0.9 (done); axe 0.13
- **Acceptance tests needed:** `tabs.directive.spec.ts`, `controls.contract.spec.ts`; add axe scan.

### `select` — Implemented and verified (**V**)

- **Volt public surface:** `volt-select`, `-content`, `-item`, `-label`, `-separator`, `select[voltNativeSelect]`; re-exports `injectNativeSelectState`, `injectSelectConfig`, `injectSelectState`, `provideNativeSelectState`, `provideSelectConfig`, `provideSelectState`
- **Behavioural dependency:** ng-primitives `select` + `portal`; Floating UI; native `<select>` for `voltNativeSelect`
- **Observable headless contract required:** Single and **multiple** selection, placeholder, groups with label/separator, keyboard + typeahead, Escape/Tab, floating placement, CVA.
- **Quartz equivalent:** `SelectDirective` family (single) + `SelectControlDirective`. `voltNativeSelect` is a native `<select>` (N).
- **Current evidence:** 0.10: Multiple `values`, groups/labels/separators, placeholder (`data-qz-placeholder`), `closeOnSelect`, unrendered-value labels via `displayWith`, scroll-in-flight guard. Evidence: `select.advanced.spec.ts`, `select.contract.spec.ts`, `forms.advanced.spec.ts` (unit); `e2e/selection.spec.ts` (Chromium/Firefox/WebKit incl. Select in Dialog, RTL, keyboard-only, cleanup); axe on open states; AOT consumer smoke with strict templates; Reactive Forms (array, `[]`, reset). `voltNativeSelect` stays N.
- **Accessibility:** Verified (single): trigger/popup named (inherited from trigger — 0.9), no dangling `aria-controls`, Tab hands focus back, axe on open popup.
- **Forms:** Verified (single value): silent writeValue, commit only on change, touched, disabled (also closes an open popup), reset → `null`. Multiple needs an array contract.
- **Angular / SSR:** Popup is browser-only; hydration proof 0.17.
- **Remaining work:** None for the 0.10 contract. Cross-cutting gate (SSR/hydration matrix, Angular 22) stays in 0.17.
- **Owning milestone:** 0.10 (closed in 0.10.0)
- **Acceptance tests needed:** Unit + e2e: multiple toggling/array Forms value; grouped options keyboard skip of labels/separators; label for a value whose option is not rendered.

### `theme` — Native / composition sufficient (**N**)

- **Volt public surface:** `provideVoltTheme`, theme service
- **Behavioural dependency:** Volt-owned (document class + storage)
- **Observable headless contract required:** Persists light/dark/system preference and toggles a class on `<html>`.
- **Quartz equivalent:** None (out of scope: styling concern).
- **Current evidence:** Native / composition sufficient. Not a behavioural primitive; belongs to the styled layer.
- **Accessibility:** None.
- **Forms:** n/a
- **Angular / SSR:** Volt's responsibility.
- **Remaining work:** None; excluded from Quartz by the headless/no-styling rule.
- **Owning milestone:** n/a
- **Acceptance tests needed:** None.

### `navigation-menu` — Implemented and verified (**V**)

- **Volt public surface:** `volt-navigation-menu`, `-list`, `-item`, `-trigger`, `-content`, `-content-item`, `a[voltNavigationMenuLink]`
- **Behavioural dependency:** ng-primitives `navigation-menu` + `portal`
- **Observable headless contract required:** `navigation` landmark; triggers open content on hover (show/hide delays) or Enter/Space/ArrowDown; moving between triggers swaps content; Escape closes and restores focus; arrow keys between triggers; link `aria-current`.
- **Quartz equivalent:** `NavigationMenuDirective`, list/item/trigger/content/link directives; `NavbarDirective` remains a separate responsive shell.
- **Current evidence:** Unit tests cover disclosure semantics, mounted content references, keyboard open/Escape focus restore, sibling swap, disabled triggers, delayed hover and outside dismissal. Three-engine E2E covers pointer gap/exit, sibling swap, disabled triggers, RTL keyboard, Tab exit, route teardown and `aria-current`; axe passes on open content. The installed-tarball strict AOT fixture imports and composes the public directives.
- **Accessibility:** Disclosure-navigation pattern (not `role=menu`): `aria-expanded/controls` on triggers, focus management on open/close.
- **Forms:** n/a
- **Angular / SSR:** Content portalled in browser only; closed state renders no content.
- **Remaining work:** None for this contract. Full SSR/hydration matrix remains a cross-cutting 0.17 gate.
- **Owning milestone:** 0.13 (implemented and verified)
- **Acceptance tests needed:** Complete (unit, three-engine E2E, axe and installed-consumer AOT).

### `dialog` — Implemented and verified (**V**)

- **Volt public surface:** `voltDialog*`, `ng-template[voltDialogRoot]`, `DialogService`; re-exports `injectDialogRef`, `injectDialogState`, `NgpDialogManager`, `NgpDialogRef`, `provideDialogConfig`, `provideDialogState`, `NgpDialogConfig`
- **Behavioural dependency:** ng-primitives `dialog`
- **Observable headless contract required:** Modal focus trap/return, Escape and outside-click, scroll lock, `aria-labelledby/describedby`, service-opened and controlled dialogs, nested dialogs.
- **Quartz equivalent:** `DialogService`, `DialogRef` (0.8 modal isolation, nested/out-of-order close, route-destroy cleanup, axe).
- **Current evidence:** Implemented and verified.
- **Accessibility:** Verified in 0.8 incl. `inert` background and axe scan.
- **Forms:** n/a
- **Angular / SSR:** Service-created, browser-only (SSR spec exists).
- **Remaining work:** API shape differs (`injectDialogRef` etc.): an adapter concern for Volt 2.0, not a behaviour gap.
- **Owning milestone:** n/a (adapter)
- **Acceptance tests needed:** `dialog-composition.spec.ts`, `modal-isolation.spec.ts`, `e2e/floating.spec.ts`.

### `drawer` — Implemented and verified (**V**)

- **Volt public surface:** `voltDrawer`, `-overlay`, `-content`, `-title`, `-description`, `volt-drawer-close`; same dialog re-exports
- **Behavioural dependency:** ng-primitives `dialog` (side-anchored)
- **Observable headless contract required:** Dialog semantics anchored to a viewport edge; Escape (configurable), focus trap/return, scroll lock, enter/exit presence so exit animations complete before removal.
- **Quartz equivalent:** `DrawerService` (physical `left|right|top|bottom` and logical `inline-start|inline-end` sides) on top of `DialogService`, with `presence`, `DialogRef.state()` and `data-state`/`data-side` hooks.
- **Current evidence (0.16):** `drawer.service.spec.ts` (all sides, logical sides in LTR/RTL, labelled modal, focus, scroll lock, exit presence: closing state, bubbled end events ignored, timer fallback, no double close, destroy mid-exit without orphan timers, reduced motion, `presence: false`, focus return and inert release after exit, Escape/backdrop configuration), `drawer.service.ssr.spec.ts`, existing `dialog-composition.spec.ts`/`modal-isolation.spec.ts`; `e2e/floating-016.spec.ts` in Chromium, Firefox and WebKit (four physical edges with real geometry, LTR/RTL logical sides, Tab trapping, Escape + focus return, backdrop and Escape configuration, exit transition, reduced motion, nested Popover Escape ownership, host-view destruction cleanup, axe on the open drawer); `e2e/docs.spec.ts` demo hydration; strict installed-tarball AOT.
- **Accessibility:** Inherited from Dialog (`role=dialog`, `aria-modal`, `aria-labelledby`/`describedby` via template context); axe scan of the open drawer.
- **Forms:** n/a
- **Angular / SSR:** Browser-only; returns an already-closed `DialogRef` on the server.
- **Remaining work:** None for the behavioural contract. Swipe/gesture dismissal is Volt-owned and intentionally not implemented. The side is fixed per `open()`.
- **Owning milestone:** 0.16 (closed)
- **Acceptance tests needed:** None beyond the committed tests above.

### `popover` — Implemented and verified (**V**)

- **Volt public surface:** `voltPopover`, `volt-popover-content`, `volt-popover-arrow`; re-exports `injectPopoverArrowState`, `injectPopoverContext`, `providePopoverArrowState`, `providePopoverConfig`, `NgpPopoverArrowProps`, `NgpPopoverArrowState`
- **Behavioural dependency:** ng-primitives `popover` + `portal`; Floating UI
- **Observable headless contract required:** Open model, Escape/outside dismissal, focus management, placement/flip, arrow positioning.
- **Quartz equivalent:** `PopoverDirective`, `PopoverTriggerDirective` with `arrowSize`/`arrowPadding`, `arrow()`/`resolvedPlacement()` signals, `data-side`/`data-placement`/`--qz-arrow-x|y` and a reactive template context (`let-arrow`, `let-placement`, `let-open`).
- **Current evidence (0.16):** `popover-arrow.spec.ts` (geometry on directive/surface/context, resolved placement after flip, viewport shift, unavailable state, close/reopen without stale state, `aria-expanded`/`aria-controls` sync, no arrow data without a size, non-finite anchor); existing `popover.directive.spec.ts`; `e2e/floating-016.spec.ts` in Chromium, Firefox and WebKit (arrow centred on the anchor, `aria-expanded`/`aria-controls`, flip, RTL `bottom-start` → physical `bottom-end`, Escape focus return, axe); `e2e/docs.spec.ts` demo hydration; strict installed-tarball AOT.
- **Accessibility:** Verified in 0.8; axe scan of the open popover with an arrow (0.16).
- **Forms:** n/a
- **Angular / SSR:** Browser-only.
- **Remaining work:** None for the behavioural contract; symbol parity is an adapter concern.
- **Owning milestone:** 0.16 (closed)
- **Acceptance tests needed:** None beyond the committed tests above.

### `dropdown-menu` — Implemented and verified (**V**)

- **Volt public surface:** `voltDropdownMenu`, `-item`, `-label`, `-separator`, `-submenu-trigger`; re-exports `injectMenuContext`, `injectMenuItemState`, `injectMenuState`, `injectMenuTriggerState`, `injectSubmenuTriggerState`, `provide*State`, `provideMenuConfig`, `NgpMenuConfig`, `NgpMenuPlacement`
- **Behavioural dependency:** ng-primitives `menu` + `portal`
- **Observable headless contract required:** `role=menu`, arrow/Home/End/typeahead, submenus (hover + arrows, RTL), Escape/outside, labels and separators.
- **Quartz equivalent:** `MenuDirective`, `MenuTriggerDirective`, items incl. checkbox/radio, submenus (0.8), plus `MenuGroupDirective`/`MenuLabelDirective` (0.16); `MenuSeparatorDirective`; radio groups are named by a label too.
- **Current evidence (0.16):** `menu-group.directive.spec.ts` (group named by label, radio group named by label, separator roles, label removal clears `aria-labelledby`, dynamic groups, labels/separators never menu items or focus targets, arrow/Home/End and typeahead skip labels and disabled items); existing `menu.directive.spec.ts` and 0.8 floating E2E for submenus/RTL/Escape; `e2e/floating-016.spec.ts` in Chromium, Firefox and WebKit (labelled group, separator, keyboard skipping, submenu + one-level-at-a-time Escape with focus return, axe on a menu with named group, label, separator, disabled item and submenu); `e2e/docs.spec.ts` demo hydration; strict installed-tarball AOT.
- **Accessibility:** Verified in 0.8; axe scan with groups/labels/separators/submenu (0.16).
- **Forms:** n/a
- **Angular / SSR:** Browser-only.
- **Remaining work:** None for the behavioural contract. Submenu templates must be declared inside the parent `qzMenu` (documented).
- **Owning milestone:** 0.16 (closed)
- **Acceptance tests needed:** None beyond the committed tests above.

### `progress` — Implemented and verified (**V**)

- **Volt public surface:** `volt-progress`, `-label`, `-value`
- **Behavioural dependency:** ng-primitives `progress`
- **Observable headless contract required:** `role=progressbar` with `aria-valuenow/min/max` (omit `valuenow` when indeterminate `null`), clamped value, label/value text association.
- **Quartz equivalent:** `ProgressDirective`, `ProgressTrackDirective`, `ProgressIndicatorDirective`; native `<progress>` covers simple cases.
- **Current evidence:** Focused unit coverage for clamping, repaired ranges and indeterminate values; feedback browser fixture checks dynamic value and `null` semantics across three engines with axe.
- **Accessibility:** Indeterminate must not expose a bogus `aria-valuenow`; label via `aria-labelledby`.
- **Forms:** n/a
- **Angular / SSR:** Deterministic ids.
- **Remaining work:** Optional label/value anatomy parity remains consumer-owned.
- **Owning milestone:** 0.15
- **Acceptance tests needed:** Complete (unit, three-engine browser, axe, hydration and installed-consumer AOT evidence).

### `slider` — Implemented and verified (**V**)

- **Volt public surface:** `volt-slider` (CVA)
- **Behavioural dependency:** ng-primitives `slider` + `common`
- **Observable headless contract required:** `role=slider` thumb, min/max/step (decimal), Arrow/Page/Home/End, pointer drag with capture, orientation, disabled, Forms number.
- **Quartz equivalent:** `SliderDirective` + thumb/track/range + `SliderControlDirective`.
- **Current evidence:** 0.11: unit (`slider-value.spec.ts`: decimal steps without drift, non-zero/negative ranges, uneven grid reaching `max`, invalid step/bounds, NaN/Infinity; `slider.directive.spec.ts`: committed contract, external write during drag, disable/lostpointercapture/destroy cleanup; `forms.range-toggle.spec.ts`); `e2e/range-toggle.spec.ts` (Chromium/Firefox/WebKit: keyboard incl. `preventDefault`, decimal, RTL, vertical, drag with capture outside the element, pointercancel, lostpointercapture, disable during drag, external write during drag, Forms); axe; AOT consumer smoke.
- **Accessibility:** Verified: thumb `role=slider` with valuemin/max/now/text, orientation, disabled; consumer-owned name with a development warning; axe clean.
- **Forms:** Verified: number, silent `writeValue`, `onChange` per user value change (key step / new value while dragging), touched on focus leaving, disabled, `null` → shown at `min`.
- **Angular / SSR:** Pointer logic runs only in handlers; hydration proof 0.17.
- **Remaining work:** None for the 0.11 contract. Differences from Volt: Volt renders its own track/thumb (Quartz is structural only) and takes `ariaLabel` (Quartz: `aria-label` on the thumb); `pointercancel` and `lostpointercapture` are exercised as dispatched events in the browser suites (a mouse cannot produce them). Manual screen-reader review and 0.17 remain.
- **Owning milestone:** 0.11 (closed in 0.11.0)
- **Acceptance tests needed:** Done (see evidence).

### `range-slider` — Implemented and verified (**V**)

- **Volt public surface:** `volt-range-slider` (CVA, `low`/`high`)
- **Behavioural dependency:** ng-primitives `slider` (range) + `common`
- **Observable headless contract required:** Two thumbs with independent `aria-valuenow`, thumbs cannot cross, min gap, per-thumb labels, keyboard per thumb, Forms `[low, high]`.
- **Quartz equivalent:** `RangeSliderDirective` + track/range/thumb (`qzRangeSliderThumb="low|high"`) + `RangeSliderControlDirective`.
- **Current evidence:** 0.11: unit (`range-slider.directive.spec.ts`: non-crossing, minimum distance, invariant repair, nearest-thumb and tie rules, RTL/vertical geometry, decimal steps, dynamic constraints, disable/destroy cleanup, silent writes; `forms.range-toggle.spec.ts`); `e2e/range-toggle.spec.ts` (Chromium/Firefox/WebKit: both thumbs drag, non-crossing, minimum distance for pointer and keyboard, keyboard per thumb and tab order, RTL/vertical, destroy and route change mid-drag, Forms); axe; AOT consumer smoke with strict templates.
- **Accessibility:** Verified: two named `role=slider` thumbs, `aria-valuemin/max` coordinated with the other thumb and `minDistance`, no extra tab stop; axe clean.
- **Forms:** Verified: `{ low, high }`, silent `writeValue`, `onChange` per user change, touched when focus leaves the control (not between thumbs), disabled, `null` → full range.
- **Angular / SSR:** As Slider.
- **Remaining work:** None for the 0.11 contract. **Differences from Volt (recorded, not hidden):** the Forms value is the object `{ low, high }` where Volt's CVA value is the tuple `[low, high]` (a one-line mapping, documented); a `null` write resets to the full range where Volt ignores it; Volt's `lowChange`/`highChange` outputs correspond to the `[(low)]`/`[(high)]` models and `ariaLabelLow/High` to per-thumb `aria-label`. Manual screen-reader review and 0.17 remain.
- **Owning milestone:** 0.11 (closed in 0.11.0)
- **Acceptance tests needed:** Done (see evidence).

### `breadcrumbs` — Native / composition sufficient (**N**)

- **Volt public surface:** `volt-breadcrumbs`, `-list`, `-item`, `-link`, `-page`, `-separator`, `-ellipsis`, `a[voltBreadcrumbLink]`
- **Behavioural dependency:** ng-primitives `breadcrumbs`
- **Observable headless contract required:** `nav` with accessible label, ordered list, current page `aria-current="page"`, decorative separators `aria-hidden`.
- **Quartz equivalent:** None needed (native `nav`/`ol`/`a`).
- **Current evidence:** Native / composition sufficient. Pure markup semantics.
- **Accessibility:** Native landmark + attribute.
- **Forms:** n/a
- **Angular / SSR:** Static markup or native element; no runtime behaviour, nothing to hydrate.
- **Remaining work:** Recipe in docs.
- **Owning milestone:** n/a
- **Acceptance tests needed:** None.

### `toggle-group` — Implemented and verified (**V**)

- **Volt public surface:** `volt-toggle-group`, `-item` (CVA, `string[]`)
- **Behavioural dependency:** ng-primitives `toggle-group`
- **Observable headless contract required:** Single/multiple, `allowDeselection`, roving focus (orientation/RTL), disabled, Forms value.
- **Quartz equivalent:** `ToggleGroupDirective` + `ToggleItemDirective` (`type`, `allowDeselection`, `loop`, `orientation`, `valueChangeCommitted`) + `ToggleGroupControlDirective`.
- **Current evidence:** 0.11: unit (`toggle-group.directive.spec.ts`: allowDeselection on/off, multiple membership, silent programmatic writes, focus never commits, disabled item/group, item removal keeps the value; `forms.range-toggle.spec.ts`); `e2e/range-toggle.spec.ts` (Chromium/Firefox/WebKit: single/multiple, allowDeselection, one tab stop with disabled skipped and wrapping, Home/End, Enter/Space, RTL and vertical arrows, Forms); axe; AOT consumer smoke.
- **Accessibility:** Verified: `role=group` (consumer-named) with per-item `aria-pressed`; axe flagged `aria-orientation` on `role=group`, which was removed in 0.11 (use `data-qz-orientation`).
- **Forms:** Verified: single → scalar/`null`, multiple → array; `null` shows nothing pressed; silent writes; one `onChange` per activation; touched when focus leaves the group; disabled.
- **Angular / SSR:** Host bindings only; hydration proof 0.17.
- **Remaining work:** None for the 0.11 contract. **Difference from Volt:** Volt's CVA value is always `string[]` (also for a single group); Quartz uses the scalar/`null` form in `type="single"` and the array form in `type="multiple"`, so a Volt-shaped adapter wraps/unwraps one element. Manual screen-reader review and 0.17 remain.
- **Owning milestone:** 0.11 (closed in 0.11.0)
- **Acceptance tests needed:** Done (see evidence).

### `meter` — Implemented and verified (**V**)

- **Volt public surface:** `volt-meter`, `-track`, `-indicator`, `-value`, `-label`
- **Behavioural dependency:** ng-primitives `meter`
- **Observable headless contract required:** `role=meter` with `aria-valuenow/min/max`, clamped percentage for the indicator, label/value association.
- **Quartz equivalent:** `MeterDirective`, `MeterTrackDirective`, `MeterIndicatorDirective`; native `<meter>` remains an option for simple cases.
- **Current evidence:** Focused unit coverage for clamping/range behavior; feedback browser fixture checks meter role/value and axe.
- **Accessibility:** Meter ≠ progressbar; no bogus indeterminate.
- **Forms:** n/a
- **Angular / SSR:** Deterministic ids.
- **Remaining work:** Optional label/value helper parity remains consumer-owned.
- **Owning milestone:** 0.15
- **Acceptance tests needed:** Complete (unit, three-engine dynamic-state browser checks, axe, and installed-consumer AOT evidence).

### `pagination` — Implemented and verified (**V**)

- **Volt public surface:** `volt-pagination`, `-button`, `-first`, `-previous`, `-next`, `-last`
- **Behavioural dependency:** ng-primitives `pagination`
- **Observable headless contract required:** `page` model, `pageCount`, first/previous/next/last disabled at bounds, `aria-current="page"` on the active page button, labelled controls, `nav` landmark.
- **Quartz equivalent:** `PaginationDirective` with first/previous/next/last/page directives.
- **Current evidence:** Unit tests and three-engine E2E verify bounds, page-count changes, keyboard activation, no form submission, accessible current-page naming, and focus recovery when the focused boundary action becomes disabled; the installed-tarball strict AOT fixture imports and composes the public directives.
- **Accessibility:** `nav` with label; `aria-current`; disabled controls still explain themselves; focus stays sensible when a control becomes disabled.
- **Forms:** n/a
- **Angular / SSR:** Deterministic.
- **Remaining work:** None for this contract.
- **Owning milestone:** 0.13 (implemented and verified)
- **Acceptance tests needed:** Complete (unit, three-engine E2E, and installed-consumer AOT).

### `toast` — Implemented and verified (**V**)

- **Volt public surface:** `VoltToastService`, `volt-toast`, `-title`, `-description`, `-close`, `-message`; re-exports `NgpToastManager`, `provideToastConfig`
- **Behavioural dependency:** ng-primitives `toast`
- **Observable headless contract required:** Programmatic toasts with severity, timers with pause on hover/focus, keyboard dismissal, `role=status|alert`, stacking/positions, **template/content-driven toasts**.
- **Quartz equivalent:** `ToastService`, `ToastComponent`, `ToastContainerComponent`; template and component content context, actions, dismiss-from-content, six positions and per-position stack limits.
- **Current evidence:** Unit tests cover content-component context, actions, focus/hover pause behavior and stack limits; three-engine browser fixture covers template dismissal, action, severity roles and axe. The 0.8 timer tests remain in place.
- **Accessibility:** Alert/status role and atomic live regions verified in 0.8; focused interactive content is not auto-focused and pauses its timer.
- **Forms:** n/a
- **Angular / SSR:** Browser timers; container renders empty on the server.
- **Remaining work:** SSR/hydration contract for programmatic notifications remains container-scoped.
- **Owning milestone:** 0.15
- **Acceptance tests needed:** Complete (unit coverage, three-engine template/component/action browser checks, stack-limit playground, and installed-consumer AOT).

### `input-otp` — Implemented, missing coverage (**C**)

- **Volt public surface:** `volt-input-otp`, `volt-input-otp-slot` (CVA)
- **Behavioural dependency:** ng-primitives `input-otp`
- **Observable headless contract required:** N slots over one hidden input: typing advances, Backspace retreats, paste distributes and filters by pattern, per-slot active/caret state, `autocomplete=one-time-code`, completion output.
- **Quartz equivalent:** `InputOtpComponent` with one real text input, presentational slots, string model, pattern filtering, completion and optional Forms adapter.
- **Current evidence:** Focused typing/filtering/completion, IME and Forms tests. Browser keyboard, paste and accessibility evidence remains incomplete.
- **Accessibility:** One accessible input (named); slots are presentational; announces progress sensibly.
- **Forms:** String value, writeValue silent, onChange per change, touched on blur, disabled, reset → `''`.
- **Angular / SSR:** Hidden input renders on the server; slots hydrate from value.
- **Remaining work:** Expand keyboard, deletion, dynamic length, paste and three-engine browser contracts; verify completion and IME edge cases.
- **Owning milestone:** 0.14
- **Acceptance tests needed:** Unit: type/delete/paste/pattern; e2e mobile-like paste and IME; Forms harness; axe.

### `file-upload` — Implemented, missing coverage (**C**)

- **Volt public surface:** `voltFileUpload`, `volt-file-dropzone` (outputs, no CVA)
- **Behavioural dependency:** ng-primitives `file-upload`; native `<input type=file>`
- **Observable headless contract required:** File picker trigger, `accept`/`multiple`/`directory`, drag-and-drop zone (dragenter/leave counting, drop → files), disabled, selected-files output.
- **Quartz equivalent:** Core drag-drop is element-to-element pointer DnD, not OS file drop. Picker: native input suffices (N).
- **Current evidence:** Unit coverage for filtering, drop, disabled behavior, nested drag state and excess files; live docs demo includes native picker and dropzone. Wrapper drop, directory fallback, keyboard picker and three-engine evidence remain incomplete.
- **Accessibility:** Dropzone must remain keyboard-operable via the native picker; dragover state is cosmetic.
- **Forms:** Output-based in Volt (no CVA). Requirement: files output; optionally a `File[]` adapter.
- **Angular / SSR:** No file APIs at import.
- **Remaining work:** Complete three-engine wrapper-drop, directory fallback, keyboard picker, cancellation and accessibility coverage. Directory trees are not traversed; filtering is UX-only.
- **Owning milestone:** 0.14
- **Acceptance tests needed:** E2E with a real `DataTransfer` drop in 3 engines; unit accept filtering; keyboard picker path.

### `combobox` — Implemented and verified (**V**)

- **Volt public surface:** `volt-combobox`, `-input`, `-button`, `-dropdown`, `-option` (CVA); re-exports `NgpComboboxPortal`
- **Behavioural dependency:** ng-primitives `combobox` + `portal`; Floating UI
- **Observable headless contract required:** Filtering (`filterMode`), `multiple`, `allowDeselect`, async `loading` + `queryChange`, active-descendant, IME composition, selected-vs-typed text, open/close reasons, CVA.
- **Quartz equivalent:** `ComboboxDirective` family: single value, `inputValue`, filter/autocomplete, `loading`, `allowFreeform`, `inputValueChangeCommitted`.
- **Current evidence:** 0.10: `multiple` + `values`, `allowDeselect`, `status`/loading, IME composition guard, `queryChanged`, `createLatestRequest()` stale-response guard (consumer-owned fetching), `valueChangeCommitted`/`valuesChangeCommitted`/`touched`, `ComboboxControlDirective`. Evidence: `combobox.advanced.spec.ts`, `forms.advanced.spec.ts` (unit); `e2e/selection.spec.ts` (local, async stale-response, IME composition, multiple, deselect, ARIA reference integrity, reset/disabled) in 3 engines; axe; AOT consumer smoke. Known limits: no chips/Backspace removal, no built-in fetching.
- **Accessibility:** Implemented with a large spec; no IME, stale-async or browser evidence in 0.9; no axe.
- **Forms:** No adapter. Needs value (and text) contract: selected value vs free text, null/reset, multiple array.
- **Angular / SSR:** Browser popup; input renders on the server.
- **Remaining work:** None for the 0.10 contract. Cross-cutting gate (SSR/hydration matrix, Angular 22) stays in 0.17.
- **Owning milestone:** 0.10 (closed in 0.10.0)
- **Acceptance tests needed:** Unit: IME composition does not filter mid-composition; stale response ignored; e2e typing/selection in 3 engines; Forms harness; axe.

### `date-picker` — Implemented and verified (**V**)

- **Volt public surface:** `volt-date-picker`, `-label`, `-previous-month`, `-next-month`, `-grid`, `-cell`, `-date-button` (CVA); re-exports `NgpDatePickerCellRender`, `NgpDatePickerRowRender`, `injectDatePickerCellDate`, `injectDatePickerWeek`
- **Behavioural dependency:** ng-primitives `date-picker` + `date-time`
- **Observable headless contract required:** `grid` with roving day focus, arrows/PageUp/PageDown/Home/End, min/max, disabled dates, first day of week, month label live region, selected/today/outside-month states, locale-aware names, Forms `Date`.
- **Quartz equivalent:** `DatePickerDirective`, shared `CalendarGridDirective`/`CalendarCellDirective`/`CalendarDateButtonDirective`, locale labels and the optional `DatePickerControlDirective`.
- **Current evidence:** `date-picker.directive.spec.ts` covers local date arithmetic, leap/year bounds, grid semantics, selection, min/max, disabled dates, RTL and silent programmatic updates. `forms.date-picker.spec.ts` covers Forms contracts. `e2e/date-picker.spec.ts` passes in Chromium, Firefox and WebKit, including keyboard navigation, RTL, locale changes, custom accessible naming and disabled dates. Axe passes on both grids; `pnpm verify:consumer` passes against packed tarballs with strict AOT.
- **Accessibility:** Grid and row semantics, selected/disabled state, localized full-date names with a consumer callback override, month live announcement and focus preservation across month navigation.
- **Forms:** `Date | null`; silent writes, one change per user commit, touched when focus leaves, disabled state and reset to `null` are verified.
- **Angular / SSR:** The model is a local civil date. Server and client must share a timezone, stable `today` and compatible locale data; cross-cutting hydration proof remains in 0.17.
- **Known differences:** Quartz exports standalone behavior directives and leaves markup to consumers. It supports native `Date` only and does not expose Volt's native-date adapter or rendering-context helpers.
- **Remaining work:** None for the 0.12 contract.
- **Owning milestone:** 0.12
- **Acceptance evidence:** Unit: month/year navigation and disabled dates; E2E: keyboard, RTL, locale and disabled dates across three engines; Forms harness; axe; installed-tarball AOT.

### `date-range-picker` — Implemented and verified (**V**)

- **Volt public surface:** `volt-date-range-picker` (same barrel as date-picker)
- **Behavioural dependency:** ng-primitives `date-picker` (range) + `date-time`
- **Observable headless contract required:** Start/end selection with hover preview, ordered range, min/max, same grid semantics, `startDate`/`endDate` models.
- **Quartz equivalent:** `DateRangePickerDirective` uses the same calendar grid and publishes start-only and normalized complete `{ start, end }` ranges; preview and disabled-span handling are implemented.
- **Current evidence:** `date-picker.directive.spec.ts` covers partial values, reverse normalization, preview and disabled-span rejection. `forms.date-picker.spec.ts` covers the range adapter. `e2e/date-picker.spec.ts` verifies keyboard selection including a one-day range, pointer preview, disabled-span rejection and Forms write/reset/disable in Chromium, Firefox and WebKit. Axe passes on the range grid; `pnpm verify:consumer` passes strict AOT with the Forms adapter.
- **Accessibility:** Start/end, selected and in-range states are exposed through ARIA and data attributes; month changes announce through the shared live label.
- **Forms:** `{ start, end } | null`; a partial `{ start, end: null }` value is emitted after selecting a start. Quartz does not assign form validity; consumers own validation policy.
- **Angular / SSR:** Same local civil date, timezone and locale constraints as DatePicker.
- **Known differences:** Quartz uses one ordered range object and consumer-owned markup; Volt exposes separate `startDate` and `endDate` models and ng-primitives render contexts.
- **Remaining work:** None for the 0.12 contract.
- **Owning milestone:** 0.12
- **Acceptance evidence:** Unit: reverse selection, partial state, preview and disabled spans; E2E: keyboard, one-day range, pointer preview and Forms in three engines; axe; installed-tarball AOT.

### `listbox` — Implemented and verified (**V**)

- **Volt public surface:** `volt-listbox`, `-trigger`, `-header`, `-section`, `-option` (CVA)
- **Behavioural dependency:** ng-primitives `listbox` + `common`
- **Observable headless contract required:** Single/multiple (`mode`), `T[]` value, active-descendant navigation, typeahead, sections with headers, disabled options, Forms.
- **Quartz equivalent:** `ListboxDirective` + `ListboxOptionDirective` + `ListboxControlDirective`.
- **Current evidence:** 0.10: Sections (`qzListboxGroup`/`GroupLabel`/`Separator`), selection independent of the active item; scalar single mode kept (a Volt adapter translates to arrays). Evidence: `listbox.groups.spec.ts`, `listbox.directive.spec.ts`, forms specs (unit); `e2e/selection.spec.ts` grouped Listbox keyboard test in 3 engines; axe; AOT consumer smoke.
- **Accessibility:** Verified: role, aria-multiselectable, active-descendant, disabled option, name via `aria-label` in the e2e form.
- **Forms:** Verified: silent writeValue, commit per change (array for multiple), touched on focus leaving, disabled, reset → none selected. Volt always uses arrays; Quartz single mode uses a scalar (adapter concern).
- **Angular / SSR:** Host bindings only.
- **Remaining work:** None for the 0.10 contract. Cross-cutting gate (SSR/hydration matrix, Angular 22) stays in 0.17.
- **Owning milestone:** 0.10 (closed in 0.10.0)
- **Acceptance tests needed:** Unit: grouped options keep keyboard order and skip headers; e2e grouped keyboard.

### `toolbar` — Implemented and verified (**V**)

- **Volt public surface:** `volt-toolbar`, `[voltToolbarButton]`
- **Behavioural dependency:** ng-primitives `toolbar` + `roving-focus` + `button`
- **Observable headless contract required:** `role=toolbar`, orientation-aware roving focus (arrows/Home/End, RTL), one tab stop, remembers last focused item, disabled items skipped.
- **Quartz equivalent:** `ToolbarDirective` and `ToolbarItemDirective` backed by Core `CollectionStore`.
- **Current evidence:** Unit tests cover semantics, one tab stop, orientation, Home/End, focus memory, dynamic order and disabled items. Three-engine E2E covers horizontal/vertical and RTL arrows, disabled skipping, mixed native controls, reorder, and focus without activation; the installed-tarball strict AOT fixture imports and composes the public directives.
- **Accessibility:** `aria-orientation`, accessible name required on the toolbar.
- **Forms:** n/a
- **Angular / SSR:** Host bindings only.
- **Remaining work:** None for this contract.
- **Owning milestone:** 0.13 (implemented and verified)
- **Acceptance tests needed:** Complete (unit, three-engine E2E, and installed-consumer AOT).

### `skeleton` — Native / composition sufficient (**N**)

- **Volt public surface:** `volt-skeleton`
- **Behavioural dependency:** Volt-owned (styling)
- **Observable headless contract required:** None (decorative).
- **Quartz equivalent:** None needed.
- **Current evidence:** Native / composition sufficient. Visual.
- **Accessibility:** `aria-hidden`/busy region is consumer-owned.
- **Forms:** n/a
- **Angular / SSR:** Static markup or native element; no runtime behaviour, nothing to hydrate.
- **Remaining work:** None.
- **Owning milestone:** n/a
- **Acceptance tests needed:** None.

### `table` — Native / composition sufficient (**N**)

- **Volt public surface:** `volt-table*`
- **Behavioural dependency:** Volt-owned (native table elements)
- **Observable headless contract required:** Native table semantics with styling.
- **Quartz equivalent:** None needed (native `<table>`).
- **Current evidence:** Native / composition sufficient. Native HTML.
- **Accessibility:** Native.
- **Forms:** n/a
- **Angular / SSR:** Static markup or native element; no runtime behaviour, nothing to hydrate.
- **Remaining work:** None.
- **Owning milestone:** n/a
- **Acceptance tests needed:** None.

### `resizable` — Implemented and verified (**V**)

- **Volt public surface:** `volt-resizable`, `-panel`, `-handle` (`maxSize`, `resizingChange`)
- **Behavioural dependency:** Volt-owned behaviour (pointer + keyboard); no ng-primitives
- **Observable headless contract required:** Handle is `role=separator` with `aria-valuenow/min/max`, arrow keys on both axes, pointer drag with capture, size constraints, resizing state output.
- **Quartz equivalent:** Core `SplitterContainerDirective`/`Handle`/`Panel`/`SplitterService` (no second engine), `quartz add resizable` aliases `splitter`.
- **Current evidence (0.16):** `splitter-resizable.spec.ts` and the existing splitter specs (separator-axis `aria-orientation`, ARIA values, both axes, RTL arrows and pointer, Home/End and clamping at both bounds, dynamic min/max, NaN/collapsed-container safety, inverted bounds, pointer lifecycle incl. `pointercancel`/`lostpointercapture`, secondary pointers ignored, primary-button only, `disabled`, independent splitters); `e2e/floating-016.spec.ts` in Chromium, Firefox and WebKit (real pointer drag horizontal/vertical/RTL with clamping and layout size, keyboard, Tab order, `pointercancel`, no stale drag, axe); `e2e/docs.spec.ts` demo hydration; strict installed-tarball AOT.
- **Accessibility:** `role=separator`, value triplet, WAI-ARIA `aria-orientation` (the separator's own axis — corrected in 0.16), `aria-disabled`; axe separator scan.
- **Forms:** n/a
- **Angular / SSR:** Position is deterministic from `defaultPosition`; geometry is read only in the browser.
- **Remaining work:** None for the behavioural contract. Sizes are percentages of the container (documented); the model is two panels (nest containers for more); Volt's visual grip is consumer styling. `maxSize` bounds the primary panel (the secondary minimum is `100 - maxSize`).
- **Owning milestone:** 0.16 (closed)
- **Acceptance tests needed:** None beyond the committed tests above.

### `alert` — Native / composition sufficient (**N**)

- **Volt public surface:** `volt-alert`, `-title`, `-description`
- **Behavioural dependency:** Volt-owned (opt-in `role`)
- **Observable headless contract required:** Optional `role=status|alert`.
- **Quartz equivalent:** None needed.
- **Current evidence:** Native / composition sufficient. Attribute on a div.
- **Accessibility:** Role is an attribute choice.
- **Forms:** n/a
- **Angular / SSR:** Static markup or native element; no runtime behaviour, nothing to hydrate.
- **Remaining work:** None.
- **Owning milestone:** n/a
- **Acceptance tests needed:** None.

### `spinner` — Native / composition sufficient (**N**)

- **Volt public surface:** `volt-spinner`
- **Behavioural dependency:** Volt-owned (decorative or `role=status` when named)
- **Observable headless contract required:** Decorative by default; status when labelled.
- **Quartz equivalent:** None needed.
- **Current evidence:** Native / composition sufficient. Visual + attribute.
- **Accessibility:** Attribute choice.
- **Forms:** n/a
- **Angular / SSR:** Static markup or native element; no runtime behaviour, nothing to hydrate.
- **Remaining work:** None.
- **Owning milestone:** n/a
- **Acceptance tests needed:** None.

### `empty-state` — Native / composition sufficient (**N**)

- **Volt public surface:** `volt-empty-state*`
- **Behavioural dependency:** Volt-owned (static content)
- **Observable headless contract required:** None.
- **Quartz equivalent:** None needed.
- **Current evidence:** Native / composition sufficient. Visual.
- **Accessibility:** Static content.
- **Forms:** n/a
- **Angular / SSR:** Static markup or native element; no runtime behaviour, nothing to hydrate.
- **Remaining work:** None.
- **Owning milestone:** n/a
- **Acceptance tests needed:** None.

### `sidebar` — Partial behavioural equivalence (**P**)

- **Volt public surface:** layout: `volt-sidebar`, `-header`, `-content`, `-group`, `-item`, `-footer`, `SidebarService`
- **Behavioural dependency:** Volt-owned (router links, Escape, collapse state); uses tooltip for collapsed labels
- **Observable headless contract required:** Collapsible navigation rail: collapsed/expanded width, Escape handling, router-link active state, collapsed-item tooltips, mobile off-canvas.
- **Quartz equivalent:** `SidebarDirective` family (responsive modes, scroll lock, focus modes) — conditional since 0.6.
- **Current evidence:** Partial behavioural equivalence.
- **Accessibility:** Quartz sidebar has focus/scroll-lock modes; collapsed-rail labelling and router-active semantics are Volt-owned.
- **Forms:** n/a
- **Angular / SSR:** Breakpoint state is client-only; server renders the desktop default.
- **Remaining work:** Browser proof of responsive/focus/scroll-lock; collapsed-state contract (rail vs off-canvas) and Escape.
- **Owning milestone:** 0.13
- **Acceptance tests needed:** E2E resize across the breakpoint, Escape, focus return, scroll lock cleanup; SSR default state.

## 4. ng-primitives symbols Volt re-exports publicly

Volt 1.x re-exports low-level ng-primitives APIs from its barrels. They are part of **Volt 1.x public
compatibility**, not of the behaviour Quartz must reproduce: Quartz does **not** promise `Ngp*`
names, and it does not import ng-primitives. A Volt 2.0 Quartz-backed build either keeps these through
adapters or drops them in its own major.

| Volt barrel    | Re-exported from ng-primitives                                                                                                                                                                                                                                                      | Quartz position                                                               |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| autofill       | `injectAutofillState`, `ngpAutofill`, `provideAutofillState`, `NgpAutofillProps`, `NgpAutofillState`                                                                                                                                                                                | Behaviour: new autofill directive (0.14). Symbols: adapter.                   |
| combobox       | `NgpComboboxPortal`                                                                                                                                                                                                                                                                 | Behaviour: Quartz Overlay already portals; symbol: adapter.                   |
| date-picker    | `NgpDatePickerCellRender`, `NgpDatePickerRowRender`, `injectDatePickerCellDate`, `injectDatePickerWeek`                                                                                                                                                                             | Behaviour: cell/row context in 0.12 calendar. Symbols: adapter.               |
| dialog, drawer | `injectDialogRef`, `injectDialogState`, `NgpDialogManager`, `NgpDialogRef`, `provideDialogConfig`, `provideDialogState`, `NgpDialogConfig`                                                                                                                                          | Quartz `DialogService`/`DialogRef` cover the behaviour (V). Symbols: adapter. |
| dropdown-menu  | `injectMenuContext`, `injectMenuItemState`, `injectMenuState`, `injectMenuTriggerState`, `injectSubmenuTriggerState`, `provideMenuConfig`, `provideMenuItemState`, `provideMenuState`, `provideMenuTriggerState`, `provideSubmenuTriggerState`, `NgpMenuConfig`, `NgpMenuPlacement` | Quartz Menu covers behaviour (V). Symbols: adapter.                           |
| popover        | `injectPopoverArrowState`, `injectPopoverContext`, `providePopoverArrowState`, `providePopoverConfig`, `NgpPopoverArrowProps`, `NgpPopoverArrowState`                                                                                                                               | Arrow behaviour: V in 0.16. Symbols: adapter.                                 |
| search         | `injectSearchState`, `provideSearchState`                                                                                                                                                                                                                                           | Recipe (N).                                                                   |
| select         | `injectNativeSelectState`, `injectSelectConfig`, `injectSelectState`, `provideNativeSelectState`, `provideSelectConfig`, `provideSelectState`                                                                                                                                       | Behaviour: 0.10. Symbols: adapter.                                            |
| toast          | `NgpToastManager`, `provideToastConfig`                                                                                                                                                                                                                                             | Behaviour: 0.15. Symbols: adapter.                                            |
| tooltip        | `injectTooltipArrowState`, `injectTooltipContext`, `provideTooltipArrowState`, `provideTooltipConfig`, `NgpTooltipArrowProps`, `NgpTooltipArrowState`                                                                                                                               | Arrow behaviour: V in 0.16. Symbols: adapter.                                 |

## 5. Cross-cutting parity gates (apply to every row)

| Gate                      | Requirement                                                                                                                       | Owner            | Status after 0.9                                                                                                                |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Angular 21.2              | Installed-tarball AOT + strictTemplates + prod build on the Volt minimum (`^21.2.0`)                                              | 0.17             | Fixture compiles on the repository's Angular 21.2.x; the minimum is not pinned in CI yet                                        |
| **Angular 22**            | Same fixture on a real Angular 22 install. **No Angular 22 claim is made**: Quartz peers are `^21.0.0` and no 22 fixture has run. | 0.17             | **Open — mandatory pre-1.0 gate**                                                                                               |
| SSR + hydration           | Real server render + hydration + interaction per interactive row; mocked `Document`s do not count                                 | 0.17             | Open (host-binding-only controls are SSR-safe by construction, unproven)                                                        |
| RTL                       | Keyboard + placement per row that has inline direction                                                                            | each family      | Radio verified in 0.9; others per family                                                                                        |
| Forms                     | Every Volt CVA row has an adapter with the §6 contract                                                                            | families         | 10 of 14 Volt CVA rows done (Checkbox, Switch, RadioGroup, Select, Listbox, Combobox, Slider, RangeSlider, Toggle, ToggleGroup) |
| Cleanup / lifecycle       | Destroy while open, repeated open/close, no residue                                                                               | each family      | Select, Dialog verified                                                                                                         |
| Typed consumer experience | AOT `strictTemplates` fixture covers each new surface                                                                             | each family      | Controls + Forms covered in 0.9                                                                                                 |
| Accessibility evidence    | axe scan of each interactive row in its open/active state + manual AT review before RC                                            | each family + RC | Select popup/form, Dialog, Menu verified                                                                                        |

## 6. Volt Forms requirements (benchmark, not code to copy)

Volt marks these rows “full CVA contract” (`COMPONENT_STATUS.md`): checkbox, combobox, date-picker,
input, input-otp, listbox, radio, range-slider, select, slider, switch, textarea, toggle,
toggle-group. Observable requirements used as the benchmark: writeValue updates the UI without a
change notification; one change notification per user action; touched on real blur; disabled
blocks interaction; reset restores the empty value; validators stay consumer-owned.

| Row                                      | Quartz adapter                                        | Value contract to specify when built            |
| ---------------------------------------- | ----------------------------------------------------- | ----------------------------------------------- |
| checkbox, switch, radio, select, listbox | **Done in 0.9** (`@quartz-headless/primitives/forms`) | See `docs/ai/specs/v1-forms.md`                 |
| toggle, toggle-group                     | **Done in 0.11**                                      | boolean; scalar-or-array by `type`              |
| slider, range-slider                     | **Done in 0.11**                                      | `number`; `{low, high}`                         |
| combobox                                 | 0.10                                                  | selected value vs free text; multiple array     |
| date-picker, date-range-picker           | 0.12                                                  | `Date \| null`; `{start, end}`                  |
| input-otp                                | 0.14                                                  | `string`                                        |
| input, textarea                          | none (native)                                         | native `DefaultValueAccessor`                   |
| file-upload                              | 0.14                                                  | output-based in Volt; optional `File[]` adapter |

## 7. Volt 1.x public compatibility versus Volt 2.0 capabilities

- **Volt 1.x compatibility** (what existing consumers import): `Volt*` components and the
  ng-primitives re-exports in §4. Quartz is not required to preserve any of it.
- **Volt 2.0 capabilities** (what a Quartz-backed Volt needs): the observable contracts in §3, reached
  through an adapter layer owned by Volt. “Adapter” in the tables means _rename/shape translation
  only_; any row whose behaviour is missing in Quartz is a Quartz milestone, never an adapter.
- Out of scope for Quartz by the “you own the styles” rule: `theme`, class-variance variants,
  spinner/skeleton/card/badge visuals.

## 8. Related documents

`ROADMAP.md`, `docs/roadmap/README.md`, `docs/api/v1-scope.md`,
`docs/ai/specs/v1-forms.md`, `docs/releases/0.9-acceptance.md`.
