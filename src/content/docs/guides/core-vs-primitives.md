---
title: Core versus Primitives
description: What lives in each package, how they depend on each other and which one to import.
group: Guides
order: 11
---

## Core: `@quartz-headless/core`

Low-level interaction infrastructure, comparable to the Angular CDK: **Overlay**, **Dismiss**, **Focus**, **Collection**, **Directionality**, **Viewport**, **ScrollLock**, **DragDrop**, **VirtualScroll** and **Splitter**. Core has no Primitives or Forms dependency and never imports Primitives.

Use Core when you build your own widget and need the hard parts: positioned portals, dismissal rules, focus traps/restoration, a keyboard-navigable collection with typeahead.

## Primitives: `@quartz-headless/primitives`

Accessible UI patterns built on Core: Dialog, Tooltip, Toast, Popover, Menu, Select, Listbox, Combobox, Tabs, Accordion, Switch, Checkbox, RadioGroup, Toggle, ToggleGroup, Slider, Tree, Sidebar, Navbar and Stepper.

Primitives are directives (and `ToastContainerComponent`) with no CSS. They expose state through `data-qz-*` attributes and ARIA, and values through signals.

| You need                                                  | Import from                         |
| --------------------------------------------------------- | ----------------------------------- |
| A ready accessible pattern                                | `@quartz-headless/primitives`       |
| Angular Forms (`formControlName`, `ngModel`) on a pattern | `@quartz-headless/primitives/forms` |
| A custom overlay, collection, focus rule                  | `@quartz-headless/core`             |

## Packaging rules

- Primitives peers on Core with the same minor version (lockstep).
- `@angular/forms` is an optional peer, only reached through the `/forms` entry point; the main entry never imports it.
- In the CLI source-copy mode, Core folders are copied; Primitives point you at the npm Core package.

See [Installation](/docs/getting-started/installation) for both distribution modes.
