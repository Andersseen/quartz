# Quartz v1 scope decisions

Status: phase 0.6 working decision record, revised in 0.9 for the Volt UI parity requirement. These decisions translate the roadmap proposal into an
initial v1 catalogue. A future removal still needs its own compatibility change and migration note;
this file does not remove exports.

## Included in v1

| Package    | Area             | Reason                                                             | Required before freeze                                                                                                                    |
| ---------- | ---------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Core       | Collection       | Shared keyboard/active item foundation used by several primitives. | Contract current behavior and add type/API checks.                                                                                        |
| Core       | Focus            | Required by Dialog, Popover and layered surfaces.                  | Clarify `isFocusable` and hidden ancestor behavior.                                                                                       |
| Core       | Dismiss          | Required for overlays and modal surfaces.                          | Define top-layer ownership.                                                                                                               |
| Core       | Scroll lock      | Required for Dialog/Sidebar-like surfaces.                         | Lock nesting and destroy coverage.                                                                                                        |
| Core       | Directionality   | Required for RTL support across navigation and floating placement. | Runtime direction changes and SSR behavior.                                                                                               |
| Core       | Overlay          | Required by Tooltip, Popover, Menu, Select and Combobox if kept.   | Resize/scroll/anchor lifecycle contract.                                                                                                  |
| Core       | Viewport         | Required by responsive primitives and consumer utilities.          | SSR first render and multi-window tests.                                                                                                  |
| Primitives | Dialog           | Core modal surface for product usage.                              | Nested modal/popup composition and modal isolation shipped in 0.8; typed close result decided against (see `v1-floating-contract.md` §8). |
| Primitives | Tooltip          | Common non-interactive floating help pattern.                      | Keep non-interactive contract explicit.                                                                                                   |
| Primitives | Popover          | Interactive floating surface used where Tooltip is insufficient.   | Close reasons and focus rules.                                                                                                            |
| Primitives | Menu             | Common application/menu pattern.                                   | Submenu and checked/radio item contracts.                                                                                                 |
| Primitives | Listbox          | Selection base for consumers and composed controls.                | Object identity and dynamic option recovery.                                                                                              |
| Primitives | Select           | High-value composed control.                                       | Forms adapter in 0.9 and external consumer fixture.                                                                                       |
| Primitives | Tabs             | Common navigation/disclosure primitive.                            | Dynamic tabs and activation mode tests.                                                                                                   |
| Primitives | Accordion        | Common disclosure primitive.                                       | Single/multiple/collapsible contract.                                                                                                     |
| Primitives | Checkbox         | Form control.                                                      | Done in 0.9 (`@quartz-headless/primitives/forms`).                                                                                        |
| Primitives | Switch           | Form control.                                                      | Done in 0.9 (`@quartz-headless/primitives/forms`).                                                                                        |
| Primitives | RadioGroup       | Form control.                                                      | Done in 0.9 (`@quartz-headless/primitives/forms`).                                                                                        |
| Primitives | Toast            | Feedback primitive.                                                | Announcement/timer contract and route cleanup.                                                                                            |
| Primitives | Date / DateRange | Calendar selection and inclusive range control.                    | Local civil date contract, keyboard/RTL, disabled-span validation, Forms and cross-browser proof (0.12).                                  |
| Primitives | FormField        | Accessible field composition for native and Quartz controls.       | Stable IDs, dynamic ARIA references, optional Forms state and SSR/hydration proof (0.14).                                                 |
| Primitives | InputOTP         | One real input with presentational code slots.                     | Keyboard/paste/IME, completion and optional Forms contract (0.14).                                                                        |
| Primitives | Autofill         | Browser autofill transition observation.                           | Supported-engine event contract and documented limitations (0.14).                                                                        |
| Primitives | File selection   | Native picker and OS file drop behavior.                           | Native keyboard path, filtering, disabled, directory fallback and three-engine evidence (0.14).                                           |

## Volt-required (mandatory for 1.0)

Quartz 1.0 must provide the headless behaviour of every public Volt UI component at the pinned
reference revision (`docs/api/volt-parity.md`, Volt `7c76ef3`). Anything Volt exports is therefore
**not** a free-floating “conditional”: it has an owning milestone and acceptance criteria. Volt-required
areas that already exist in Quartz were conditional before 0.9 and are now mandatory:

| Package    | Area                     | Volt row(s)              | Owning milestone | Gap summary (see inventory)                                         |
| ---------- | ------------------------ | ------------------------ | ---------------- | ------------------------------------------------------------------- |
| Primitives | Combobox                 | `combobox`               | 0.10 (done)      | closed in 0.10.0: multiple, IME, stale async guard, Forms, E2E      |
| Primitives | Select (multiple/groups) | `select`                 | 0.10 (done)      | closed in 0.10.0: multiple, groups/labels/separators, placeholder   |
| Primitives | Slider                   | `slider`, `range-slider` | 0.11             | browser pointer capture, decimal step, Forms, RangeSlider           |
| Primitives | Toggle / ToggleGroup     | `toggle`, `toggle-group` | 0.11             | Forms, deselection semantics, RTL                                   |
| Primitives | Sidebar                  | `sidebar`                | 0.13             | responsive/focus/scroll-lock proof in a browser, collapsed contract |
| Primitives | NavigationMenu           | `navigation-menu`        | 0.13             | pointer, keyboard, overlay composition and accessible flyout proof  |
| Primitives | Toolbar                  | `toolbar`                | 0.13             | roving focus, mixed controls, dynamic DOM order and RTL proof       |
| Primitives | Pagination               | `pagination`             | 0.13             | bounded model, boundary focus and accessible current-page proof     |
| Core       | Splitter                 | `resizable`              | 0.16             | pointer E2E, ARIA values, maxSize, resizing state                   |

Families Volt needs that Quartz does not have yet (new work, no “conditional” escape hatch):
Date/DateRange (0.12), NavigationMenu/Toolbar/Pagination (0.13), InputOTP/Autofill/FileUpload/FormField
(0.14), Progress/Meter/Avatar and Toast content API (0.15), Drawer and Tooltip/Popover arrows (0.16).

## Explicit scope decisions still open (not required by Volt)

| Package    | Area           | Default decision                                                                   | Decision needed by       |
| ---------- | -------------- | ---------------------------------------------------------------------------------- | ------------------------ |
| Core       | Drag and drop  | Keep exported during 0.x; pointer-only, not keyboard accessible.                   | Before 0.18 (API freeze) |
| Core       | Virtual scroll | Keep exported during 0.x; fixed-size only, no browser contract yet.                | Before 0.18 (API freeze) |
| Primitives | Tree           | Not in Volt. Lazy load, error/retry, template context and selection state needed.  | Before 0.18 (API freeze) |
| Primitives | Navbar         | Not in Volt. Scroll-state and responsive menu contract needed to stay in the root. | Before 0.18 (API freeze) |
| Primitives | Stepper        | Not in Volt. Linear mode, validation handoff and dynamic step recovery contract.   | Before 0.18 (API freeze) |

An area in this table that is kept must meet the same bar as included areas; one that is dropped
needs a pre-1.0 breaking minor with migration guidance.

## Migration stance

- No export is removed by this phase.
- Any conditional area that is excluded from v1 gets a pre-1.0 breaking minor with changelog and
  replacement guidance.
- Conditional areas can remain in 0.x as experimental source, but they cannot be presented as part
  of the stable 1.0 package root without meeting the same tests as included areas.
- Core and Primitives stay lockstep versioned. Primitives must peer on the matching compatible Core
  range for every release candidate.
