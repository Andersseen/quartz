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
| V    | Implemented and verified        |      8 |            8 |
| C    | Implemented, missing coverage   |      2 |            2 |
| P    | Partial behavioural equivalence |      9 |            9 |
| M    | Missing                         |     13 |           12 |
| N    | Native / composition sufficient |     14 |           14 |
|      | **Total**                       | **46** |       **45** |

Reading the numbers: **8 of 46** rows are verified-equivalent as of 0.10.0 (Checkbox, RadioGroup, Switch,
Tabs, Dialog, Select, Listbox, Combobox). Quartz 0.10 is **not** v1-ready and is **not** Volt-compatible yet; the remaining rows
all have an owning milestone below.

### Rows by owning milestone (non-N, non-V)

| Milestone                                                                                                       | Rows                                                                                   |
| --------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| 0.10 — Advanced selection (Combobox, Select multiple/groups, Listbox sections) — **closed in 0.10.0**           | `select` (V), `combobox` (V), `listbox` (V)                                            |
| 0.11 — Range and toggle controls (RangeSlider, Slider, Toggle, ToggleGroup + Forms)                             | `toggle` (C), `slider` (P), `range-slider` (M), `toggle-group` (P)                     |
| 0.12 — Date and date-range interaction                                                                          | `date-picker` (M), `date-range-picker` (M)                                             |
| 0.13 — Navigation and roving focus (NavigationMenu, Toolbar, Pagination, Accordion/Sidebar gaps)                | `accordion` (P), `navigation-menu` (M), `pagination` (M), `toolbar` (M), `sidebar` (P) |
| 0.14 — Text, file input and form-field wiring (InputOTP, Autofill, FileUpload, FormField, Search recipe)        | `autofill` (M), `form-field` (M), `input-otp` (M), `file-upload` (M)                   |
| 0.15 — Feedback and value indicators (Progress, Meter, Avatar, Toast content API)                               | `avatar` (M), `progress` (M), `meter` (M), `toast` (P)                                 |
| 0.16 — Drawer, resizable and floating API completeness (Drawer, Resizable, Tooltip/Popover arrows, Menu groups) | `tooltip` (P), `drawer` (P), `popover` (P), `dropdown-menu` (C), `resizable` (P)       |

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

### `autofill` — Missing (**M**)

- **Volt public surface:** `voltAutofill`; re-exports `injectAutofillState`, `ngpAutofill`, `provideAutofillState`, `NgpAutofillProps`, `NgpAutofillState`
- **Behavioural dependency:** ng-primitives `autofill`
- **Observable headless contract required:** Detects browser autofill (via `:-webkit-autofill` animation start/`animationstart` hook) and exposes `data-autofill` + an `autofilled` output.
- **Quartz equivalent:** None.
- **Current evidence:** Missing.
- **Accessibility:** None directly (styling signal).
- **Forms:** Autofill fires no `input` event in some browsers; the value must reach the control.
- **Angular / SSR:** Browser-only observer; must be a no-op on the server and not run at import.
- **Remaining work:** Headless autofill-state directive with output and attribute; document cross-browser limits.
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

### `toggle` — Implemented, missing coverage (**C**)

- **Volt public surface:** `volt-toggle` (CVA)
- **Behavioural dependency:** ng-primitives `toggle`
- **Observable headless contract required:** `aria-pressed`, click/Space/Enter, disabled, Forms boolean.
- **Quartz equivalent:** `ToggleDirective` (`button[qzToggle]`, `pressed` model + `pressedChangeCommitted`).
- **Current evidence:** Implemented, missing coverage.
- **Accessibility:** Implemented (aria-pressed); no browser/axe evidence in 0.9.
- **Forms:** No adapter yet. Requirement: boolean value, `null` → `false`, same contract as Switch.
- **Angular / SSR:** Host bindings only.
- **Remaining work:** Forms adapter; consolidate under the 0.9 model/commit rules; browser keyboard test.
- **Owning milestone:** 0.11
- **Acceptance tests needed:** Forms harness (writeValue/onChange/touched/disabled/reset); e2e keyboard Space/Enter; axe.

### `form-field` — Missing (**M**)

- **Volt public surface:** `volt-form-field`, `volt-label`, `volt-hint`, `volt-error`
- **Behavioural dependency:** ng-primitives `form-field`
- **Observable headless contract required:** Generates ids and wires `aria-labelledby`/`aria-describedby` between label/hint/error and the projected control; mirrors invalid/touched/dirty/disabled from `NgControl` as data attributes; error shown per control state.
- **Quartz equivalent:** None.
- **Current evidence:** Missing.
- **Accessibility:** Dangling-reference-free ids; error announced (`role=alert`/describedby) when shown.
- **Forms:** Reads `NgControl` state of the projected control — requires the optional `/forms` entry point.
- **Angular / SSR:** Ids must be deterministic across server/client.
- **Remaining work:** Headless field directive set with `NgControl` observation; works with native inputs and Quartz controls.
- **Owning milestone:** 0.14
- **Acceptance tests needed:** Unit: ids/ARIA for native input and Quartz Switch; invalid/touched mirroring; e2e submit-error flow; SSR id stability.

### `tooltip` — Partial behavioural equivalence (**P**)

- **Volt public surface:** `voltTooltip`, `volt-tooltip-content`, `volt-tooltip-arrow`; re-exports `injectTooltipArrowState`, `injectTooltipContext`, `provideTooltipArrowState`, `provideTooltipConfig`, `NgpTooltipArrowProps`, `NgpTooltipArrowState`
- **Behavioural dependency:** ng-primitives `tooltip` + `portal`; Floating UI (via ng-primitives)
- **Observable headless contract required:** Hover/focus show with delays, Escape/blur hide, `aria-describedby`, flip/shift placement, arrow positioning, template content.
- **Quartz equivalent:** `TooltipDirective`, `TooltipService` (0.8: timers, dismissal, describedby preservation, axe).
- **Current evidence:** Partial behavioural equivalence.
- **Accessibility:** Verified in 0.8 (describedby preserved, Escape, hover/focus sources).
- **Forms:** n/a
- **Angular / SSR:** Overlay is browser-only and not created on the server.
- **Remaining work:** No arrow positioning data (offset/side) and no content-context injection equivalent; string vs template rendering paths still two engines (0.8 limitation).
- **Owning milestone:** 0.16
- **Acceptance tests needed:** Unit: arrow offset/side reported for each placement incl. flip; e2e: arrow tracks the anchor after scroll/resize.

### `avatar` — Missing (**M**)

- **Volt public surface:** `volt-avatar`, `img[voltAvatarImage]`, `volt-avatar-fallback`
- **Behavioural dependency:** ng-primitives `avatar`
- **Observable headless contract required:** Image load state machine (loading → loaded | error); fallback shown while loading (optional delay) or on error; swaps when `src` changes.
- **Quartz equivalent:** None.
- **Current evidence:** Missing.
- **Accessibility:** Image keeps `alt`; fallback is text; decorative fallback hidden from AT once the image loads.
- **Forms:** n/a
- **Angular / SSR:** Server renders the fallback; client takes over without a hydration mismatch.
- **Remaining work:** Headless avatar state directive set (root/image/fallback).
- **Owning milestone:** 0.15
- **Acceptance tests needed:** Unit: load/error/src-change transitions, fallback delay; SSR render shows fallback; e2e broken-image URL.

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

### `navigation-menu` — Missing (**M**)

- **Volt public surface:** `volt-navigation-menu`, `-list`, `-item`, `-trigger`, `-content`, `-content-item`, `a[voltNavigationMenuLink]`
- **Behavioural dependency:** ng-primitives `navigation-menu` + `portal`
- **Observable headless contract required:** `navigation` landmark; triggers open content on hover (show/hide delays) or Enter/Space/ArrowDown; moving between triggers swaps content; Escape closes and restores focus; arrow keys between triggers; link `aria-current`.
- **Quartz equivalent:** None equivalent. `NavbarDirective` is a responsive shell/menu toggle, not a menubar-with-flyouts.
- **Current evidence:** Missing.
- **Accessibility:** Disclosure-navigation pattern (not `role=menu`): `aria-expanded/controls` on triggers, focus management on open/close.
- **Forms:** n/a
- **Angular / SSR:** Content portalled in browser only; closed state renders no content.
- **Remaining work:** Navigation-menu primitive on Core Overlay/Collection/Dismiss with hover intent timers.
- **Owning milestone:** 0.13
- **Acceptance tests needed:** Unit: hover-intent timers, swap, Escape focus return; e2e keyboard + pointer in 3 engines; axe on an open flyout.

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

### `drawer` — Partial behavioural equivalence (**P**)

- **Volt public surface:** `voltDrawer`, `-overlay`, `-content`, `-title`, `-description`, `volt-drawer-close`; same dialog re-exports
- **Behavioural dependency:** ng-primitives `dialog` (side-anchored)
- **Observable headless contract required:** Dialog semantics anchored to a viewport edge; Escape (configurable), focus trap/return, scroll lock, enter/exit presence so exit animations complete before removal.
- **Quartz equivalent:** `DialogService` with `DialogPosition` (centred/placement config).
- **Current evidence:** Partial behavioural equivalence.
- **Accessibility:** Inherited from Dialog (verified 0.8).
- **Forms:** n/a
- **Angular / SSR:** Browser-only.
- **Remaining work:** Edge placement + RTL start/end edge; exit-animation presence (`closed$` timing vs CSS transition); swipe is Volt-owned and out of scope.
- **Owning milestone:** 0.16
- **Acceptance tests needed:** E2E: left/right/top/bottom edges incl. RTL, focus return, exit transition completes before removal; axe.

### `popover` — Partial behavioural equivalence (**P**)

- **Volt public surface:** `voltPopover`, `volt-popover-content`, `volt-popover-arrow`; re-exports `injectPopoverArrowState`, `injectPopoverContext`, `providePopoverArrowState`, `providePopoverConfig`, `NgpPopoverArrowProps`, `NgpPopoverArrowState`
- **Behavioural dependency:** ng-primitives `popover` + `portal`; Floating UI
- **Observable headless contract required:** Open model, Escape/outside dismissal, focus management, placement/flip, arrow positioning.
- **Quartz equivalent:** `PopoverDirective`, `PopoverTriggerDirective` (0.8).
- **Current evidence:** Partial behavioural equivalence.
- **Accessibility:** Verified in 0.8.
- **Forms:** n/a
- **Angular / SSR:** Browser-only.
- **Remaining work:** Arrow positioning data and trigger-state context.
- **Owning milestone:** 0.16
- **Acceptance tests needed:** As tooltip arrow tests, plus `aria-expanded` sync.

### `dropdown-menu` — Implemented, missing coverage (**C**)

- **Volt public surface:** `voltDropdownMenu`, `-item`, `-label`, `-separator`, `-submenu-trigger`; re-exports `injectMenuContext`, `injectMenuItemState`, `injectMenuState`, `injectMenuTriggerState`, `injectSubmenuTriggerState`, `provide*State`, `provideMenuConfig`, `NgpMenuConfig`, `NgpMenuPlacement`
- **Behavioural dependency:** ng-primitives `menu` + `portal`
- **Observable headless contract required:** `role=menu`, arrow/Home/End/typeahead, submenus (hover + arrows, RTL), Escape/outside, labels and separators.
- **Quartz equivalent:** `MenuDirective`, `MenuTriggerDirective`, items incl. checkbox/radio, submenus (0.8).
- **Current evidence:** Implemented, missing coverage.
- **Accessibility:** Verified in 0.8 (focus, submenu, stale callbacks, RTL).
- **Forms:** n/a
- **Angular / SSR:** Browser-only.
- **Remaining work:** Group label / separator roles (`role=group` + label, `role=separator`) have no dedicated test evidence.
- **Owning milestone:** 0.16
- **Acceptance tests needed:** Unit: label/separator are skipped by navigation and exposed correctly; axe on an open menu with groups.

### `progress` — Missing (**M**)

- **Volt public surface:** `volt-progress`, `-label`, `-value`
- **Behavioural dependency:** ng-primitives `progress`
- **Observable headless contract required:** `role=progressbar` with `aria-valuenow/min/max` (omit `valuenow` when indeterminate `null`), clamped value, label/value text association.
- **Quartz equivalent:** None (native `<progress>` covers determinate/indeterminate semantics without custom anatomy).
- **Current evidence:** Missing.
- **Accessibility:** Indeterminate must not expose a bogus `aria-valuenow`; label via `aria-labelledby`.
- **Forms:** n/a
- **Angular / SSR:** Deterministic ids.
- **Remaining work:** Headless progress state (value/min/max, percentage, indeterminate, ids) for custom anatomy.
- **Owning milestone:** 0.15
- **Acceptance tests needed:** Unit: clamping, null → indeterminate, percentage; axe.

### `slider` — Partial behavioural equivalence (**P**)

- **Volt public surface:** `volt-slider` (CVA)
- **Behavioural dependency:** ng-primitives `slider` + `common`
- **Observable headless contract required:** `role=slider` thumb, min/max/step (decimal), Arrow/Page/Home/End, pointer drag with capture, orientation, disabled, Forms number.
- **Quartz equivalent:** `SliderDirective` + thumb/track/range.
- **Current evidence:** Partial behavioural equivalence.
- **Accessibility:** Implemented; no axe/browser evidence.
- **Forms:** No adapter. Requirement: number value, writeValue silent, one onChange at the end of an interaction decision (per step vs on release) to be specified, disabled, reset → `min`.
- **Angular / SSR:** Host bindings only.
- **Remaining work:** Pointer capture/cancel browser test, decimal step rounding, RTL/vertical, external write while dragging, Forms adapter.
- **Owning milestone:** 0.11
- **Acceptance tests needed:** E2E pointer drag/cancel in 3 engines; unit decimal step; Forms harness.

### `range-slider` — Missing (**M**)

- **Volt public surface:** `volt-range-slider` (CVA, `low`/`high`)
- **Behavioural dependency:** ng-primitives `slider` (range) + `common`
- **Observable headless contract required:** Two thumbs with independent `aria-valuenow`, thumbs cannot cross, min gap, per-thumb labels, keyboard per thumb, Forms `[low, high]`.
- **Quartz equivalent:** None. The single-thumb `SliderDirective` is not equivalent.
- **Current evidence:** Missing.
- **Accessibility:** Each thumb named (`ariaLabelLow/High`), `aria-valuemin/max` reflect the other thumb.
- **Forms:** Value `{low, high}` (or tuple); writeValue silent; one onChange per interaction; disabled; reset.
- **Angular / SSR:** Host bindings only.
- **Remaining work:** Range slider on the Slider foundation.
- **Owning milestone:** 0.11
- **Acceptance tests needed:** Unit: non-crossing, minimum distance, active-thumb swap on pointer; e2e drag both thumbs; Forms harness.

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

### `toggle-group` — Partial behavioural equivalence (**P**)

- **Volt public surface:** `volt-toggle-group`, `-item` (CVA, `string[]`)
- **Behavioural dependency:** ng-primitives `toggle-group`
- **Observable headless contract required:** Single/multiple, `allowDeselection`, roving focus (orientation/RTL), disabled, Forms value.
- **Quartz equivalent:** `ToggleGroupDirective` + `ToggleItemDirective` (`type`, `loop`, `orientation`).
- **Current evidence:** Partial behavioural equivalence.
- **Accessibility:** Implemented; no browser evidence.
- **Forms:** No adapter. Value shape: single → scalar or `null`, multiple → array; decide and document the Volt-compatible array form.
- **Angular / SSR:** Host bindings only.
- **Remaining work:** Deselection semantics for single mode, Forms adapter, browser RTL keyboard tests.
- **Owning milestone:** 0.11
- **Acceptance tests needed:** Unit: single deselect rule; Forms harness; e2e roving + RTL.

### `meter` — Missing (**M**)

- **Volt public surface:** `volt-meter`, `-track`, `-indicator`, `-value`, `-label`
- **Behavioural dependency:** ng-primitives `meter`
- **Observable headless contract required:** `role=meter` with `aria-valuenow/min/max`, clamped percentage for the indicator, label/value association.
- **Quartz equivalent:** None (native `<meter>` is an option for simple cases).
- **Current evidence:** Missing.
- **Accessibility:** Meter ≠ progressbar; no bogus indeterminate.
- **Forms:** n/a
- **Angular / SSR:** Deterministic ids.
- **Remaining work:** Headless meter state for custom anatomy.
- **Owning milestone:** 0.15
- **Acceptance tests needed:** Unit: clamping, percentage, ids; axe.

### `pagination` — Missing (**M**)

- **Volt public surface:** `volt-pagination`, `-button`, `-first`, `-previous`, `-next`, `-last`
- **Behavioural dependency:** ng-primitives `pagination`
- **Observable headless contract required:** `page` model, `pageCount`, first/previous/next/last disabled at bounds, `aria-current="page"` on the active page button, labelled controls, `nav` landmark.
- **Quartz equivalent:** None.
- **Current evidence:** Missing.
- **Accessibility:** `nav` with label; `aria-current`; disabled controls still explain themselves; focus stays sensible when a control becomes disabled.
- **Forms:** n/a
- **Angular / SSR:** Deterministic.
- **Remaining work:** Pagination state directive set; focus rule when the focused button becomes disabled.
- **Owning milestone:** 0.13
- **Acceptance tests needed:** Unit: bounds, page clamping on pageCount change; e2e keyboard; axe.

### `toast` — Partial behavioural equivalence (**P**)

- **Volt public surface:** `VoltToastService`, `volt-toast`, `-title`, `-description`, `-close`, `-message`; re-exports `NgpToastManager`, `provideToastConfig`
- **Behavioural dependency:** ng-primitives `toast`
- **Observable headless contract required:** Programmatic toasts with severity, timers with pause on hover/focus, keyboard dismissal, `role=status|alert`, stacking/positions, **template/content-driven toasts**.
- **Quartz equivalent:** `ToastService`, `ToastContainerComponent` (0.8: exact timers, severity roles, CSS variables).
- **Current evidence:** Partial behavioural equivalence.
- **Accessibility:** Verified in 0.8 (alert vs status, atomic).
- **Forms:** n/a
- **Angular / SSR:** Browser timers; container renders empty on the server.
- **Remaining work:** Template/content API (arbitrary content, actions) and position/stack configuration parity.
- **Owning milestone:** 0.15
- **Acceptance tests needed:** Unit: template content with context, action buttons, close from content; e2e pause/resume; axe.

### `input-otp` — Missing (**M**)

- **Volt public surface:** `volt-input-otp`, `volt-input-otp-slot` (CVA)
- **Behavioural dependency:** ng-primitives `input-otp`
- **Observable headless contract required:** N slots over one hidden input: typing advances, Backspace retreats, paste distributes and filters by pattern, per-slot active/caret state, `autocomplete=one-time-code`, completion output.
- **Quartz equivalent:** None.
- **Current evidence:** Missing.
- **Accessibility:** One accessible input (named); slots are presentational; announces progress sensibly.
- **Forms:** String value, writeValue silent, onChange per change, touched on blur, disabled, reset → `''`.
- **Angular / SSR:** Hidden input renders on the server; slots hydrate from value.
- **Remaining work:** Primitive with selection-range tracking and paste handling.
- **Owning milestone:** 0.14
- **Acceptance tests needed:** Unit: type/delete/paste/pattern; e2e mobile-like paste and IME; Forms harness; axe.

### `file-upload` — Missing (**M**)

- **Volt public surface:** `voltFileUpload`, `volt-file-dropzone` (outputs, no CVA)
- **Behavioural dependency:** ng-primitives `file-upload`; native `<input type=file>`
- **Observable headless contract required:** File picker trigger, `accept`/`multiple`/`directory`, drag-and-drop zone (dragenter/leave counting, drop → files), disabled, selected-files output.
- **Quartz equivalent:** Core drag-drop is element-to-element pointer DnD, not OS file drop. Picker: native input suffices (N).
- **Current evidence:** Missing.
- **Accessibility:** Dropzone must remain keyboard-operable via the native picker; dragover state is cosmetic.
- **Forms:** Output-based in Volt (no CVA). Requirement: files output; optionally a `File[]` adapter.
- **Angular / SSR:** No file APIs at import.
- **Remaining work:** File-drop directive (drag state, `accept` filtering, directory entries) and picker association.
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

### `date-picker` — Missing (**M**)

- **Volt public surface:** `volt-date-picker`, `-label`, `-previous-month`, `-next-month`, `-grid`, `-cell`, `-date-button` (CVA); re-exports `NgpDatePickerCellRender`, `NgpDatePickerRowRender`, `injectDatePickerCellDate`, `injectDatePickerWeek`
- **Behavioural dependency:** ng-primitives `date-picker` + `date-time`
- **Observable headless contract required:** `grid` with roving day focus, arrows/PageUp/PageDown/Home/End, min/max, disabled dates, first day of week, month label live region, selected/today/outside-month states, locale-aware names, Forms `Date`.
- **Quartz equivalent:** None.
- **Current evidence:** Missing.
- **Accessibility:** APG date-picker grid: `aria-label` per cell, `aria-selected`, month change announced, focus preserved across month navigation.
- **Forms:** `Date | null`; writeValue silent; one onChange per selection; touched; disabled; reset → `null`.
- **Angular / SSR:** Locale formatting must match between server and client (hydration).
- **Remaining work:** Calendar grid primitive with a date-adapter boundary (no date library dependency).
- **Owning milestone:** 0.12
- **Acceptance tests needed:** Unit: navigation incl. month/year boundaries and disabled dates; e2e keyboard and RTL; locale formatting SSR; Forms harness; axe.

### `date-range-picker` — Missing (**M**)

- **Volt public surface:** `volt-date-range-picker` (same barrel as date-picker)
- **Behavioural dependency:** ng-primitives `date-picker` (range) + `date-time`
- **Observable headless contract required:** Start/end selection with hover preview, ordered range, min/max, same grid semantics, `startDate`/`endDate` models.
- **Quartz equivalent:** None.
- **Current evidence:** Missing.
- **Accessibility:** Range endpoints and in-range cells exposed; selection step announced.
- **Forms:** `{start, end}`; partial range (start only) is a valid transient state — define validity ownership.
- **Angular / SSR:** As date-picker.
- **Remaining work:** Range mode on the calendar primitive.
- **Owning milestone:** 0.12
- **Acceptance tests needed:** Unit: reversed selection, single-day range, preview; e2e keyboard range selection; Forms harness.

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

### `toolbar` — Missing (**M**)

- **Volt public surface:** `volt-toolbar`, `[voltToolbarButton]`
- **Behavioural dependency:** ng-primitives `toolbar` + `roving-focus` + `button`
- **Observable headless contract required:** `role=toolbar`, orientation-aware roving focus (arrows/Home/End, RTL), one tab stop, remembers last focused item, disabled items skipped.
- **Quartz equivalent:** None. Core `CollectionStore` (roving-tabindex) is the foundation.
- **Current evidence:** Missing.
- **Accessibility:** `aria-orientation`, accessible name required on the toolbar.
- **Forms:** n/a
- **Angular / SSR:** Host bindings only.
- **Remaining work:** Toolbar directive set on Collection; focus-memory rule.
- **Owning milestone:** 0.13
- **Acceptance tests needed:** Unit: roving, last-focused memory, disabled skipping; e2e RTL.

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

### `resizable` — Partial behavioural equivalence (**P**)

- **Volt public surface:** `volt-resizable`, `-panel`, `-handle` (`maxSize`, `resizingChange`)
- **Behavioural dependency:** Volt-owned behaviour (pointer + keyboard); no ng-primitives
- **Observable headless contract required:** Handle is `role=separator` with `aria-valuenow/min/max`, arrow keys on both axes, pointer drag with capture, size constraints, resizing state output.
- **Quartz equivalent:** Core `SplitterContainerDirective`/`Handle`/`Panel`/`SplitterService` (conditional since 0.7).
- **Current evidence:** Partial behavioural equivalence.
- **Accessibility:** Splitter has keyboard + separator semantics; ARIA value parity and orientation coverage not proven in a browser.
- **Forms:** n/a
- **Angular / SSR:** Layout sizes are client state; server renders defaults.
- **Remaining work:** Browser pointer/keyboard E2E, ARIA value parity, `maxSize`, resizing-state signal, RTL, cleanup.
- **Owning milestone:** 0.16
- **Acceptance tests needed:** E2E drag/keyboard/cancel in 3 engines both orientations; unit constraints; axe separator checks.

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
| dropdown-menu  | `injectMenuContext`, `injectMenuItemState`, `injectMenuState`, `injectMenuTriggerState`, `injectSubmenuTriggerState`, `provideMenuConfig`, `provideMenuItemState`, `provideMenuState`, `provideMenuTriggerState`, `provideSubmenuTriggerState`, `NgpMenuConfig`, `NgpMenuPlacement` | Quartz Menu covers behaviour (C). Symbols: adapter.                           |
| popover        | `injectPopoverArrowState`, `injectPopoverContext`, `providePopoverArrowState`, `providePopoverConfig`, `NgpPopoverArrowProps`, `NgpPopoverArrowState`                                                                                                                               | Arrow behaviour: 0.16. Symbols: adapter.                                      |
| search         | `injectSearchState`, `provideSearchState`                                                                                                                                                                                                                                           | Recipe (N).                                                                   |
| select         | `injectNativeSelectState`, `injectSelectConfig`, `injectSelectState`, `provideNativeSelectState`, `provideSelectConfig`, `provideSelectState`                                                                                                                                       | Behaviour: 0.10. Symbols: adapter.                                            |
| toast          | `NgpToastManager`, `provideToastConfig`                                                                                                                                                                                                                                             | Behaviour: 0.15. Symbols: adapter.                                            |
| tooltip        | `injectTooltipArrowState`, `injectTooltipContext`, `provideTooltipArrowState`, `provideTooltipConfig`, `NgpTooltipArrowProps`, `NgpTooltipArrowState`                                                                                                                               | Arrow behaviour: 0.16. Symbols: adapter.                                      |

## 5. Cross-cutting parity gates (apply to every row)

| Gate                      | Requirement                                                                                                                       | Owner            | Status after 0.9                                                                         |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ---------------- | ---------------------------------------------------------------------------------------- |
| Angular 21.2              | Installed-tarball AOT + strictTemplates + prod build on the Volt minimum (`^21.2.0`)                                              | 0.17             | Fixture compiles on the repository's Angular 21.2.x; the minimum is not pinned in CI yet |
| **Angular 22**            | Same fixture on a real Angular 22 install. **No Angular 22 claim is made**: Quartz peers are `^21.0.0` and no 22 fixture has run. | 0.17             | **Open — mandatory pre-1.0 gate**                                                        |
| SSR + hydration           | Real server render + hydration + interaction per interactive row; mocked `Document`s do not count                                 | 0.17             | Open (host-binding-only controls are SSR-safe by construction, unproven)                 |
| RTL                       | Keyboard + placement per row that has inline direction                                                                            | each family      | Radio verified in 0.9; others per family                                                 |
| Forms                     | Every Volt CVA row has an adapter with the §6 contract                                                                            | families         | 5 of 14 Volt CVA rows done (Checkbox, Switch, RadioGroup, Select, Listbox)               |
| Cleanup / lifecycle       | Destroy while open, repeated open/close, no residue                                                                               | each family      | Select, Dialog verified                                                                  |
| Typed consumer experience | AOT `strictTemplates` fixture covers each new surface                                                                             | each family      | Controls + Forms covered in 0.9                                                          |
| Accessibility evidence    | axe scan of each interactive row in its open/active state + manual AT review before RC                                            | each family + RC | Select popup/form, Dialog, Menu verified                                                 |

## 6. Volt Forms requirements (benchmark, not code to copy)

Volt marks these rows “full CVA contract” (`COMPONENT_STATUS.md`): checkbox, combobox, date-picker,
input, input-otp, listbox, radio, range-slider, select, slider, switch, textarea, toggle,
toggle-group. Observable requirements used as the benchmark: writeValue updates the UI without a
change notification; one change notification per user action; touched on real blur; disabled
blocks interaction; reset restores the empty value; validators stay consumer-owned.

| Row                                      | Quartz adapter                                        | Value contract to specify when built            |
| ---------------------------------------- | ----------------------------------------------------- | ----------------------------------------------- |
| checkbox, switch, radio, select, listbox | **Done in 0.9** (`@quartz-headless/primitives/forms`) | See `docs/ai/specs/v1-forms.md`                 |
| toggle, toggle-group                     | 0.11                                                  | boolean; scalar-or-array by `type`              |
| slider, range-slider                     | 0.11                                                  | `number`; `{low, high}`                         |
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
