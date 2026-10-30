---
title: Accessibility contracts
description: The ARIA patterns, keyboard behaviour and focus rules Quartz implements, and what is not verified.
group: Guides
order: 15
---

## Patterns

| Primitive                                | Pattern                                                                                          |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Select, Listbox                          | WAI-ARIA listbox; Select trigger `aria-haspopup="listbox"`; `aria-multiselectable` when multiple |
| Combobox                                 | Editable combobox with `aria-activedescendant`; DOM focus stays on the input                     |
| Dialog                                   | Modal dialog with focus trap, background `inert`, focus restoration                              |
| Menu, Popover, Tooltip                   | Menu button, non-modal dialog, tooltip description                                               |
| Tabs, Accordion, RadioGroup, ToggleGroup | Roving focus, orientation and RTL aware                                                          |
| Checkbox, Switch, Toggle, Slider         | Native-button / ARIA slider semantics                                                            |

## Selection groups

Option groups are `role="group"` named by their label (`aria-labelledby`); group labels and separators are not options, so keyboard navigation and typeahead skip them. ARIA does not allow `separator` inside a listbox, so `qz*Separator` is decorative (`aria-hidden`). Disabled options are skipped and carry `aria-disabled`.

## Combobox rules

- `aria-expanded` mirrors the popup; `aria-controls` is present only while the listbox exists, so there is never a dangling reference.
- `aria-activedescendant` is cleared when the popup closes.
- During IME composition the query is neither filtered nor committed, and Enter belongs to the IME.

## Focus

Closing a popup by Escape or selection returns focus to the trigger; Tab hands focus back before the browser moves it so tabbing continues from the trigger's position.

## What is verified

Automated: axe-core scans of representative open/active states in Chromium, Firefox and WebKit, and unit/E2E tests for keyboard and ARIA state. **Not verified:** manual screen-reader output and formal WCAG conformance.

## Automated and manual verification

The consumer suite runs axe-core on meaningful states (modal open, nested popup, menu expanded, validation errors, disabled controls, drawer/sidebar, OTP, dropzone, toast, separator) and asserts names, ARIA relationships, focus order, focus restoration and keyboard dismissal independently of axe. A manual screen-reader matrix (`docs/releases/0.17-manual-a11y.md`) is **pending**: automated checks do not replace it.
