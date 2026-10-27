---
title: Toolbar
description: 'A headless action toolbar with roving focus, orientation and direction aware keyboard navigation.'
group: Primitives
order: 116
---

## At a glance

- **Focus** — One enabled item is in the Tab sequence; arrows move focus without activating controls
- **Keys** — Arrow keys follow orientation and text direction; Home and End move to the first and last item
- **Composition** — Native buttons keep Enter and Space activation; nested text inputs retain their arrow keys
- **CLI** — `pnpm quartz add toolbar`

## Live example

::demo[toolbar]

::playground[quartz-toolbar]

## Usage

```ts
import { ToolbarDirective, ToolbarItemDirective } from '@quartz-headless/primitives';

@Component({ imports: [ToolbarDirective, ToolbarItemDirective], ... })
export class EditorActions {}
```

```html
<div qzToolbar aria-label="Text formatting" orientation="horizontal">
  <button qzToolbarItem>Bold</button>
  <button qzToolbarItem>Italic</button>
  <button qzToolbarItem disabled>Unavailable</button>
</div>
```

`orientation` accepts `horizontal` or `vertical`; horizontal navigation follows LTR/RTL direction. The root can be disabled as a whole, and items accept `[qzToolbarItemDisabled]`. Disabled controls are removed from roving focus. Native disabled buttons remain natively disabled.

Arrow and Home/End navigation changes focus only. Native Enter/Space behavior remains intact. An item containing a text input, textarea, select, editable region, slider or spinbutton keeps its own arrow-key behavior. Dynamic items follow DOM order; removing the focused item recovers focus to the active enabled item when one remains.

The root renders `role="toolbar"`, orientation and disabled semantics. Give it an accessible name with `aria-label` or `aria-labelledby`. Quartz provides behavior and `data-qz-orientation` / `data-qz-disabled` hooks; all visual styling belongs to the application. Toolbar does not own a selection model, and can compose with native controls or Toggle/ToggleGroup.

The directives use browser focus and collection behavior only after rendering; server output is deterministic. No special hydration setup is required.

## Related navigation patterns

Use [Navbar](/docs/primitives/navbar) for site-header layout and responsive navigation, [NavigationMenu](/docs/primitives/navigation-menu) for site destinations with flyout panels, and [Menu](/docs/primitives/menu) for commands in a popup. Toolbar groups related actions for efficient keyboard focus. [Pagination](/docs/primitives/pagination) changes a bounded page model. These patterns have different semantics and are not interchangeable.
