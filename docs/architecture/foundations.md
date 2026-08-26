# Quartz Interaction Foundations

Quartz is intentionally split into two conceptual layers:

```text
Foundations
    ↓
UI primitives
```

The visible primitive catalogue should stay small and real. Quartz is not trying
to accumulate components for its own sake; it provides reusable interaction,
accessibility and lifecycle logic that can sit under any visual system.

```text
collection
focus
dismiss
overlay
positioning
viewport
        ↓
listbox
tree
dialog
tooltip
future menu
future popover
future select
future combobox
```

## Foundations

`collection` owns linear interactive collection behavior: item registration,
DOM order, disabled items, active item state, first/last/next/previous
navigation, optional wrapping, orientation-aware keys, typeahead, roving
tabindex and aria-activedescendant support. Listbox uses the store directly.
Tree uses only the navigation helpers over its visible flattened nodes, because
its hierarchy, expansion and lazy-loading rules remain tree-specific.

`focus` owns focusable element detection, safe focus movement, initial focus,
focus restoration and focus trapping. Dialog uses it for modal focus behavior.
Future floating or composite primitives can reuse the same utilities without
depending on Dialog.

`dismiss` owns composable dismissal triggers: Escape, outside pointer, focus
outside and scroll. It keeps a small internal layer stack so nested floating UI
only dismisses the topmost interactive layer.

`overlay` remains infrastructure: portal creation, rendered lifecycle,
positioning, anchors, virtual anchors and optional dismissal. It should not grow
Popover-specific state.

## Roadmap

```text
0.3 - Interaction Foundations
      Collection
      Focus
      Dismiss
      existing primitive refactors

0.4 - Menu
      Menu
      MenuItem
      Submenu
      CheckboxItem
      RadioItem

0.5 - Floating interactions
      Popover
      positioning improvements

0.6 - Selection
      Select
      Combobox
      Autocomplete
```
