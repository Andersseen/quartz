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
directionality
overlay
positioning
viewport
scroll-lock
        ↓
listbox
tree
dialog
tooltip
menu
popover
select
combobox
tabs
accordion
switch
checkbox
radio-group
toggle
toggle-group
slider
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

## Structural CSS

Quartz may write structural styles when they are required for behavior:
`position`, `inset`, `pointer-events`, `overflow`, z-index layering and layout
needed for portal positioning or modal interaction. Quartz should not impose
visual defaults such as `background`, `color`, `box-shadow`, `border`,
`border-radius`, typography, decorative opacity or animation.

CSS custom properties follow the same rule. Geometry/state values such as
`--qz-slider-percent` are acceptable because consumers need them to position
their own range and thumb. Visual tokens such as colors, radii or shadows belong
to the consuming design system.

## Roadmap

```text
0.3 - Controls & Interaction
      Checkbox
      RadioGroup
      Toggle
      ToggleGroup
      Slider
      Dialog headless cleanup
```
