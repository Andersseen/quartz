---
title: NavigationMenu
description: 'Site navigation links with one responsive, keyboard accessible flyout panel.'
group: Primitives
order: 117
---

## At a glance

- **State** — A single `value` identifies the open flyout; links remain native links
- **Pointer** — Hover opens after `showDelay`; pointer movement into the panel is supported and close uses `hideDelay`
- **Keyboard** — Arrow keys move between triggers; ArrowDown opens and focuses panel content; Escape closes and restores trigger focus
- **CLI** — `pnpm quartz add navigation-menu`

## Live example

::demo[navigation-menu]

::playground[quartz-navigation-menu]

## Usage

```ts
import {
  NavigationMenuContentDirective,
  NavigationMenuDirective,
  NavigationMenuItemDirective,
  NavigationMenuLinkDirective,
  NavigationMenuListDirective,
  NavigationMenuTriggerDirective,
} from '@quartz-headless/primitives';
```

```html
<nav qzNavigationMenu aria-label="Main navigation" [(value)]="openSection">
  <ul qzNavigationMenuList>
    <li qzNavigationMenuItem="products">
      <button qzNavigationMenuTrigger>Products</button>
      <ng-template qzNavigationMenuContent>
        <a qzNavigationMenuLink href="/overview">Overview</a>
      </ng-template>
    </li>
  </ul>
</nav>
```

`value` is a string model; the empty string means no flyout is open, and item keys must be nonempty. `orientation` accepts `horizontal` or `vertical`. `showDelay`, `hideDelay`, `placement`, `offset`, `flip`, and `flipAxis` tune opening and positioning. A root or item can be disabled. Set `dir="rtl"` on the root or an ancestor to reverse horizontal keyboard navigation.

The root is a named navigation landmark. Triggers are buttons with expanded/control relationships only while a panel is mounted; panels are labelled regions. Destinations use ordinary anchors and keep browser navigation behavior. Arrow keys navigate triggers, Home/End select endpoints, and native Tab leaves the navigation. Escape restores focus to the trigger; outside pointer dismissal closes without stealing focus. Hover does not steal keyboard focus.

Quartz uses Core Overlay for positioning and a single dismissal owner for the active nonmodal panel. It composes with Dialog and other overlays. Timers, document listeners and overlay references are cleaned up on close and destroy. Browser-only overlay creation occurs after render, so SSR emits the closed navigation state.

Use [Navbar](/docs/primitives/navbar) for a site header shell, [Menu](/docs/primitives/menu) for popup commands, [Toolbar](/docs/primitives/toolbar) for grouped actions, and [Pagination](/docs/primitives/pagination) for page controls. NavigationMenu represents site destinations; it is not a command menu or an action toolbar.

Quartz provides `data-qz-navigation-menu`, item and open-state hooks; consumer CSS owns all visuals. Compared with Volt, Quartz keeps its own input aliases and relies on consumer-owned markup and styles.
