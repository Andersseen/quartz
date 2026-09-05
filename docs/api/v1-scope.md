# Quartz v1 scope decisions

Status: phase 0.6 working decision record. These decisions translate the roadmap proposal into an
initial v1 catalogue. A future removal still needs its own compatibility change and migration note;
this file does not remove exports.

## Included in v1

| Package    | Area           | Reason                                                             | Required before freeze                                        |
| ---------- | -------------- | ------------------------------------------------------------------ | ------------------------------------------------------------- |
| Core       | Collection     | Shared keyboard/active item foundation used by several primitives. | Contract current behavior and add type/API checks.            |
| Core       | Focus          | Required by Dialog, Popover and layered surfaces.                  | Clarify `isFocusable` and hidden ancestor behavior.           |
| Core       | Dismiss        | Required for overlays and modal surfaces.                          | Define top-layer ownership.                                   |
| Core       | Scroll lock    | Required for Dialog/Sidebar-like surfaces.                         | Lock nesting and destroy coverage.                            |
| Core       | Directionality | Required for RTL support across navigation and floating placement. | Runtime direction changes and SSR behavior.                   |
| Core       | Overlay        | Required by Tooltip, Popover, Menu, Select and Combobox if kept.   | Resize/scroll/anchor lifecycle contract.                      |
| Core       | Viewport       | Required by responsive primitives and consumer utilities.          | SSR first render and multi-window tests.                      |
| Primitives | Dialog         | Core modal surface for product usage.                              | Nested modal/popup composition, close result typing decision. |
| Primitives | Tooltip        | Common non-interactive floating help pattern.                      | Keep non-interactive contract explicit.                       |
| Primitives | Popover        | Interactive floating surface used where Tooltip is insufficient.   | Close reasons and focus rules.                                |
| Primitives | Menu           | Common application/menu pattern.                                   | Submenu and checked/radio item contracts.                     |
| Primitives | Listbox        | Selection base for consumers and composed controls.                | Object identity and dynamic option recovery.                  |
| Primitives | Select         | High-value composed control.                                       | Forms adapter in 0.9 and external consumer fixture.           |
| Primitives | Tabs           | Common navigation/disclosure primitive.                            | Dynamic tabs and activation mode tests.                       |
| Primitives | Accordion      | Common disclosure primitive.                                       | Single/multiple/collapsible contract.                         |
| Primitives | Checkbox       | Form control.                                                      | Forms adapter in 0.9.                                         |
| Primitives | Switch         | Form control.                                                      | Forms adapter in 0.9.                                         |
| Primitives | RadioGroup     | Form control.                                                      | Forms adapter in 0.9.                                         |
| Primitives | Toast          | Feedback primitive.                                                | Announcement/timer contract and route cleanup.                |

## Conditional before v1

| Package    | Area           | Default decision                                              | Promotion condition                                                                   |
| ---------- | -------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Core       | Splitter       | Keep exported during 0.x, do not promise v1 until 0.7 review. | Full pointer, keyboard, constraints and cleanup tests.                                |
| Core       | Drag and drop  | Keep exported during 0.x, do not promise full accessible DnD. | Product accepts native pointer DnD as the contract or scopes keyboard DnD separately. |
| Core       | Virtual scroll | Keep exported during 0.x, conditional for v1.                 | Browser resize/scroll contract and consumer fixture.                                  |
| Primitives | Combobox       | Conditional, likely split into a later minor if kept.         | IME, async stale result, freeform and Forms contract accepted.                        |
| Primitives | Tree           | Conditional, likely split into a later minor if kept.         | Lazy load, error/retry, template context and selection state all covered.             |
| Primitives | Slider         | Conditional.                                                  | Browser pointer capture, keyboard, decimal step and Forms adapter complete.           |
| Primitives | Toggle         | Conditional.                                                  | Include if product wants it as a basic control beside Switch/Checkbox.                |
| Primitives | ToggleGroup    | Conditional.                                                  | Include only with Toggle, with single/multiple semantics documented.                  |
| Primitives | Sidebar        | Conditional layout primitive.                                 | Responsive, focus and scroll-lock behavior proven in real browser.                    |
| Primitives | Navbar         | Conditional layout primitive.                                 | Scroll-state and responsive menu contract proven.                                     |
| Primitives | Stepper        | Conditional flow primitive.                                   | Linear mode, validation handoff and dynamic step recovery contract accepted.          |

## Migration stance

- No export is removed by this phase.
- Any conditional area that is excluded from v1 gets a pre-1.0 breaking minor with changelog and
  replacement guidance.
- Conditional areas can remain in 0.x as experimental source, but they cannot be presented as part
  of the stable 1.0 package root without meeting the same tests as included areas.
- Core and Primitives stay lockstep versioned. Primitives must peer on the matching compatible Core
  range for every release candidate.
